/**
 * GitHub Pull Request AI Review Service
 * Performs structured AI code review on PR diffs and handles posting approved comments.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { getStoredGitHubToken } from './githubAuth';
import { getPullRequest, getPullRequestFiles } from './githubPullRequests';
import { PullRequestReviewResult, GitHubCommentDraft } from '../../src/types/github';

// In-memory cache for PR reviews: Key is `${owner}/${repo}/${pullNumber}/${headSha}`
const prReviewCache = new Map<string, PullRequestReviewResult>();

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

export async function reviewPullRequestWithAi(
  owner: string,
  repo: string,
  pullNumber: number,
  forceRefresh: boolean = false,
  tokenOverride?: string
): Promise<PullRequestReviewResult> {
  const pr = await getPullRequest(owner, repo, pullNumber, tokenOverride);
  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}/${pullNumber}/${pr.head.sha}`;

  if (!forceRefresh && prReviewCache.has(cacheKey)) {
    return prReviewCache.get(cacheKey)!;
  }

  const changedFiles = await getPullRequestFiles(owner, repo, pullNumber, tokenOverride);

  // Free-tier optimization: filter out noisy lockfiles, images, binaries
  const relevantFiles = changedFiles.filter((f) => {
    const fn = f.filename.toLowerCase();
    if (fn.endsWith('.lock') || fn.includes('package-lock.json') || fn.includes('yarn.lock') || fn.includes('bun.lock')) {
      return false;
    }
    if (fn.endsWith('.png') || fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.svg') || fn.endsWith('.ico')) {
      return false;
    }
    return Boolean(f.patch && f.patch.trim().length > 0);
  });

  if (relevantFiles.length === 0) {
    const emptyResult: PullRequestReviewResult = {
      pullNumber,
      headSha: pr.head.sha,
      reviewedAt: new Date().toISOString(),
      overallScore: 100,
      assessment: 'Changes look good',
      summary: 'No code diff changes detected (only non-code assets, lockfiles, or metadata modified).',
      stats: { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, suggestionCount: 0 },
      findings: [],
    };
    prReviewCache.set(cacheKey, emptyResult);
    return emptyResult;
  }

  // Build diff representation (capped to ~25k characters to protect token limits)
  let diffContent = '';
  for (const file of relevantFiles) {
    if (diffContent.length > 25000) break;
    diffContent += `\n--- FILE: ${file.filename} (+${file.additions} -${file.deletions}) ---\n`;
    diffContent += file.patch ? file.patch.slice(0, 4000) : '';
  }

  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server. AI Pull Request review requires a configured key.');
  }

  const prompt = `You are a Principal Software Engineer performing a thorough, high-precision Pull Request code review.

Pull Request: #${pr.number} - "${pr.title}"
Repository: ${owner}/${repo}
Author: ${pr.user?.login || 'unknown'}

Examine the following code diffs for:
1. Bugs, regressions, null pointer issues, and logic flaws
2. Security vulnerabilities (OWASP top 10, secrets, injections, improper access controls)
3. Performance bottlenecks and wasteful allocations
4. Code smells, architectural violations, and anti-patterns
5. Missing error handling and unhandled promise/async rejections
6. Potential edge cases

Provide a strict, professional review.
Assessment MUST be one of: "Changes look good", "Changes require attention", or "Critical issues detected".
(Note: Do not claim code is 100% bug-free or completely secure).

Changed Diffs:
\`\`\`diff
${diffContent.slice(0, 25000)}
\`\`\``;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.INTEGER, description: 'Code health score 0 to 100' },
          assessment: {
            type: Type.STRING,
            description: 'One of: Changes look good, Changes require attention, Critical issues detected',
          },
          summary: { type: Type.STRING, description: 'Executive summary of PR diff review' },
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
          findings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                file: { type: Type.STRING },
                lineNumber: { type: Type.INTEGER },
                severity: { type: Type.STRING, description: 'Critical, High, Medium, Low, Suggestion' },
                category: { type: Type.STRING, description: 'Bug, Security, Performance, Code Smell, Maintainability, Edge Case' },
                explanation: { type: Type.STRING },
                suggestedFix: { type: Type.STRING },
                correctedCodeSnippet: { type: Type.STRING },
              },
              required: ['id', 'file', 'severity', 'category', 'explanation', 'suggestedFix'],
            },
          },
        },
        required: ['overallScore', 'assessment', 'summary', 'stats', 'findings'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  const reviewResult: PullRequestReviewResult = {
    pullNumber,
    headSha: pr.head.sha,
    reviewedAt: new Date().toISOString(),
    overallScore: parsed.overallScore ?? 85,
    assessment: parsed.assessment ?? 'Changes require attention',
    summary: parsed.summary ?? 'AI Pull Request review completed.',
    stats: parsed.stats ?? { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, suggestionCount: 0 },
    findings: (parsed.findings || []).map((f: any, idx: number) => ({
      ...f,
      id: f.id || `finding-${idx + 1}`,
    })),
  };

  prReviewCache.set(cacheKey, reviewResult);
  return reviewResult;
}

export async function postGitHubComment(
  draft: GitHubCommentDraft,
  tokenOverride?: string
): Promise<{ success: boolean; commentUrl?: string; id?: number }> {
  const token = tokenOverride || getStoredGitHubToken();
  if (!token) {
    throw new Error('Not authenticated with GitHub. Please connect your GitHub account.');
  }

  // Format professional comment with CodePilot signature
  const formattedBody = `${draft.body}\n\n---\n*Reported by [CodePilot AI](https://github.com) • Verified by developer*`;

  // Post to PR Issue Comments API (always succeeds regardless of commit range)
  const url = `https://api.github.com/repos/${encodeURIComponent(draft.owner)}/${encodeURIComponent(
    draft.repo
  )}/issues/${draft.pullNumber}/comments`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'CodePilot-App',
    },
    body: JSON.stringify({ body: formattedBody }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to post comment to GitHub PR #${draft.pullNumber}: HTTP ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return { success: true, commentUrl: data.html_url, id: data.id };
}
