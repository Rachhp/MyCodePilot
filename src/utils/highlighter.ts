import Prism from 'prismjs';

// Import all required Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';

const PRISM_LANG_MAP: Record<string, string> = {
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  python: 'python',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'csharp',
  cs: 'csharp',
  'c#': 'csharp',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
  php: 'php',
  sql: 'sql',
  html: 'markup',
  markup: 'markup',
  xml: 'markup',
  css: 'css',
  json: 'json',
};

export function highlightCode(code: string, language: string): string {
  if (!code) return '';
  const normalizedLang = PRISM_LANG_MAP[language?.toLowerCase()] || 'javascript';
  const grammar = Prism.languages[normalizedLang] || Prism.languages.javascript;

  try {
    if (grammar) {
      return Prism.highlight(code, grammar, normalizedLang);
    }
  } catch (err) {
    console.warn(`Prism highlighting failed for ${language}:`, err);
  }

  // Fallback: escape HTML
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
