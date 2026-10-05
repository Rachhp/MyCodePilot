import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '5mb' }));

// In-memory usage tracker per server session
const usageTracker = {
  requestCount: 0,
  estimatedTokens: 0,
  lastRequestTime: null as string | null,
};

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function recordUsage(estimatedTokens: number) {
  usageTracker.requestCount += 1;
  usageTracker.estimatedTokens += estimatedTokens;
  usageTracker.lastRequestTime = new Date().toISOString();
}

// Helper to generate content with fallback models and retry on temporary high demand
async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTemporary = errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
        if (isTemporary && attempt === 0) {
          // brief pause before retry
          await new Promise((res) => setTimeout(res, 800));
          continue;
        }
        // If not temporary or second attempt failed, try next model in fallback list
        break;
      }
    }
  }

  throw lastError;
}

// API: Get AI usage stats
app.get('/api/usage', (req, res) => {
  res.json({
    requestCount: usageTracker.requestCount,
    estimatedTokens: usageTracker.estimatedTokens,
    lastRequestTime: usageTracker.lastRequestTime,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API: AI Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, codeContext, language, selectedCode } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    // Build system instruction and prompt
    let contextPrompt = '';
    if (selectedCode && selectedCode.trim().length > 0) {
      contextPrompt = `\n\n[Active Selection (${language || 'code'})]:\n\`\`\`${language || ''}\n${selectedCode.slice(0, 15000)}\n\`\`\``;
    } else if (codeContext && codeContext.trim().length > 0) {
      contextPrompt = `\n\n[Current File Content (${language || 'code'})]:\n\`\`\`${language || ''}\n${codeContext.slice(0, 20000)}\n\`\`\``;
    }

    const conversationHistory = (messages || []).map((m: { role: string; content: string }) => {
      return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`;
    }).join('\n\n');

    const prompt = `You are CodePilot, an elite AI coding assistant and senior software engineer.
Respond with concise, accurate, production-grade solutions. Format code blocks using markdown with appropriate language tags.
If reviewing or suggesting changes, clearly explain why and provide clean, modern, idiomatic code.

${contextPrompt}

Conversation:
${conversationHistory}
Assistant:`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: 'You are CodePilot, an expert programming assistant built for developers. Be concise, direct, helpful, and provide high quality code.',
        temperature: 0.3,
      },
    });

    const reply = response.text || 'No response generated.';
    // Rough estimate of tokens
    const estTokens = Math.ceil((prompt.length + reply.length) / 4);
    recordUsage(estTokens);

    return res.json({
      reply,
      usage: { estimatedTokens: estTokens },
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate AI response. Please check server logs.',
    });
  }
});

// API: Code Review
app.post('/api/review', async (req, res) => {
  try {
    const { code, language, selectedCode } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const codeToReview = (selectedCode && selectedCode.trim().length > 0)
      ? selectedCode
      : code;

    if (!codeToReview || codeToReview.trim().length === 0) {
      return res.status(400).json({ error: 'No code provided for review.' });
    }

    const prompt = `Perform a comprehensive senior-level code review for the following ${language || 'code'}.
Analyze for:
1. Bugs and edge case failures
2. Security vulnerabilities and risks
3. Performance bottlenecks and algorithmic complexity
4. Code smells, readability, and modern idioms
5. Maintainability and testability

Provide a strict JSON response conforming to the schema.
Only report valid, concrete issues. Include line numbers if identifiable.
Rate each issue as one of: Critical, High, Medium, Low, Suggestion.
Categories must be one of: Bug, Security, Performance, Code Smell, Best Practice, Maintainability.

Code to review:
\`\`\`${language || ''}
${codeToReview.slice(0, 25000)}
\`\`\``;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: {
              type: Type.INTEGER,
              description: 'Score from 0 to 100 assessing code quality and readiness',
            },
            summary: {
              type: Type.STRING,
              description: 'Brief executive summary of code quality and key recommendations',
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                criticalCount: { type: Type.INTEGER },
                highCount: { type: Type.INTEGER },
                mediumCount: { type: Type.INTEGER },
                lowCount: { type: Type.INTEGER },
                suggestionCount: { type: Type.INTEGER },
              },
              required: ['criticalCount', 'highCount', 'mediumCount', 'lowCount', 'suggestionCount'],
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    description: 'Critical, High, Medium, Low, or Suggestion',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Bug, Security, Performance, Code Smell, Best Practice, or Maintainability',
                  },
                  title: { type: Type.STRING },
                  lineNumber: {
                    type: Type.INTEGER,
                    description: 'Line number in the provided code, or 0 if general',
                  },
                  description: { type: Type.STRING },
                  whyItIsAProblem: { type: Type.STRING },
                  suggestedFix: { type: Type.STRING },
                  correctedCodeSnippet: {
                    type: Type.STRING,
                    description: 'Minimal corrected code snippet or replacement',
                  },
                },
                required: ['id', 'severity', 'category', 'title', 'description', 'whyItIsAProblem', 'suggestedFix'],
              },
            },
          },
          required: ['overallScore', 'summary', 'stats', 'issues'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    const estTokens = Math.ceil((prompt.length + text.length) / 4);
    recordUsage(estTokens);

    return res.json(parsed);
  } catch (err: any) {
    console.error('Review API Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to review code.',
    });
  }
});

// API: Code Explanation
app.post('/api/explain', async (req, res) => {
  try {
    const { code, language, selectedCode } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const targetCode = (selectedCode && selectedCode.trim().length > 0)
      ? selectedCode
      : code;

    if (!targetCode || targetCode.trim().length === 0) {
      return res.status(400).json({ error: 'No code provided to explain.' });
    }

    const prompt = `Explain the following ${language || 'code'} thoroughly and clearly for developers.
Output a JSON response conforming to the schema.
Make the beginner explanation intuitive with analogies if helpful.

Code:
\`\`\`${language || ''}
${targetCode.slice(0, 25000)}
\`\`\``;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short descriptive title of what this code does' },
            overview: { type: Type.STRING, description: 'What the code does in 2-3 concise sentences' },
            importantComponents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'function, class, variable, loop, algorithm, etc.' },
                  purpose: { type: Type.STRING },
                },
                required: ['name', 'type', 'purpose'],
              },
            },
            inputsAndOutputs: {
              type: Type.OBJECT,
              properties: {
                inputs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['name', 'type', 'description'],
                  },
                },
                outputs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['type', 'description'],
                  },
                },
              },
              required: ['inputs', 'outputs'],
            },
            potentialProblems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Potential edge cases, crashes, or limits',
            },
            simpleExplanationForBeginners: {
              type: Type.STRING,
              description: 'Friendly, easy to grasp explanation as if teaching a beginner',
            },
            stepByStepFlow: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Numbered steps of execution',
            },
          },
          required: ['title', 'overview', 'importantComponents', 'inputsAndOutputs', 'potentialProblems', 'simpleExplanationForBeginners', 'stepByStepFlow'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    const estTokens = Math.ceil((prompt.length + text.length) / 4);
    recordUsage(estTokens);

    return res.json(parsed);
  } catch (err: any) {
    console.error('Explain API Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to explain code.',
    });
  }
});

// API: Code Fix
app.post('/api/fix', async (req, res) => {
  try {
    const { code, language, selectedCode, instruction } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const codeToFix = (selectedCode && selectedCode.trim().length > 0)
      ? selectedCode
      : code;

    if (!codeToFix || codeToFix.trim().length === 0) {
      return res.status(400).json({ error: 'No code provided to fix.' });
    }

    const prompt = `You are an automated code fixing assistant.
Analyze this ${language || 'code'} and propose the corrected, fixed, optimized, or improved version.
${instruction ? `Specific user instruction: ${instruction}` : 'Fix all bugs, security flaws, performance issues, and bad practices.'}

Provide the complete proposed corrected code that can directly replace the input code.
Do not omit lines with "...". Provide complete, compilable, clean code.

Input Code:
\`\`\`${language || ''}
${codeToFix.slice(0, 25000)}
\`\`\``;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryOfFixes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Bullet points explaining each key fix or improvement',
            },
            correctedCode: {
              type: Type.STRING,
              description: 'The complete corrected code replacing the provided code',
            },
            keyImprovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING, description: 'Security, Performance, Bug Fix, Readability' },
                  detail: { type: Type.STRING },
                },
                required: ['area', 'detail'],
              },
            },
            isPartialSelection: {
              type: Type.BOOLEAN,
              description: 'True if only a subset was fixed, false if full file',
            },
          },
          required: ['summaryOfFixes', 'correctedCode', 'keyImprovements'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    const estTokens = Math.ceil((prompt.length + text.length) / 4);
    recordUsage(estTokens);

    return res.json(parsed);
  } catch (err: any) {
    console.error('Fix API Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to fix code.',
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodePilot server running on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
