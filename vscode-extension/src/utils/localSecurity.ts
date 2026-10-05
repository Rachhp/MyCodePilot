/**
 * Local Offline Security Scanner for VS Code Extension
 * Runs 100% locally inside the editor process with zero network calls and zero telemetry.
 * Sensitive source code is NEVER sent to Gemini or any external service.
 */

import { LocalSecurityReport, LocalSecurityIssue } from '../types';

interface Rule {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cwe?: string;
  pattern: RegExp;
  description: string;
  remediation: string;
  safeReplacement?: (match: string) => string;
  languageScope?: string[];
}

const LOCAL_RULES: Rule[] = [
  // 1. Secrets & Credentials
  {
    id: 'SEC-AWS-KEY',
    title: 'Hardcoded AWS Access Key ID',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-798',
    pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/,
    description: 'Found an active AWS Access Key ID in source code. If exposed, attackers can access your AWS infrastructure.',
    remediation: 'Move AWS credentials to environment variables or use IAM Roles.',
    safeReplacement: () => 'process.env.AWS_ACCESS_KEY_ID',
  },
  {
    id: 'SEC-GITHUB-TOKEN',
    title: 'Hardcoded GitHub Personal Access Token',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-798',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b|\bgithub_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}\b/,
    description: 'Exposed GitHub token grants repository and organization access.',
    remediation: 'Revoke token immediately and reference via environment variables or secret manager.',
    safeReplacement: () => 'process.env.GITHUB_TOKEN',
  },
  {
    id: 'SEC-PRIVATE-KEY',
    title: 'Cryptographic Private Key in Plaintext',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-312',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    description: 'Cryptographic private key detected in source code. Anyone with access can forge signatures or decrypt traffic.',
    remediation: 'Never check private keys into source control. Store in KMS, Vault, or protected filesystem at runtime.',
  },
  {
    id: 'SEC-STRIPE-KEY',
    title: 'Hardcoded Stripe API Secret Key',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-798',
    pattern: /\b(?:sk_live|rk_live)_[0-9a-zA-Z]{24,}\b/,
    description: 'Live Stripe Secret API Key found in code.',
    remediation: 'Load key dynamically via process.env.STRIPE_SECRET_KEY.',
    safeReplacement: () => 'process.env.STRIPE_SECRET_KEY',
  },
  {
    id: 'SEC-GENERIC-SECRET',
    title: 'Plaintext Hardcoded Password or Secret',
    category: 'Secret Leak',
    severity: 'High',
    cwe: 'CWE-259',
    pattern: /(?:password|passwd|api_key|apikey|secret|auth_token|client_secret)\s*[:=]\s*["']([^"'\\s]{6,})["']/i,
    description: 'Detected hardcoded credentials in plain text assignment.',
    remediation: 'Store credentials in .env file or VS Code SecretStorage.',
  },
  {
    id: 'SEC-DB-URI-CREDENTIALS',
    title: 'Database URI with Plaintext Credentials',
    category: 'Secret Leak',
    severity: 'High',
    cwe: 'CWE-312',
    pattern: /(?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_\-\.]+:[^@\s"']+@[a-zA-Z0-9_\-\.]+/i,
    description: 'Database connection URI contains embedded plaintext username and password.',
    remediation: 'Pass connection parameters separately or reference an encrypted DATABASE_URL environment variable.',
  },

  // 2. Injections
  {
    id: 'INJ-SQL-CONCAT',
    title: 'Potential SQL Injection via String Concatenation',
    category: 'Injection',
    severity: 'Critical',
    cwe: 'CWE-89',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*?(?:\+|%|\.|\$)\s*(?:req\.|params|input|id|user|query)/i,
    description: 'SQL query constructed using raw concatenation with untrusted input.',
    remediation: 'Use parameterized queries or an ORM prepared statement.',
  },
  {
    id: 'INJ-COMMAND-EXEC',
    title: 'Dangerous System Command Execution',
    category: 'Injection',
    severity: 'Critical',
    cwe: 'CWE-78',
    pattern: /(?:exec|execSync|spawn|popen|system|Runtime\.getRuntime\(\)\.exec)\s*\([^)]*?(?:\+|%|\$)\s*[a-zA-Z_]/,
    description: 'Constructing shell commands with dynamic variable concatenation can lead to Remote Command Execution (RCE).',
    remediation: 'Pass arguments as an array to spawn without `{ shell: true }`.',
  },

  // 3. Sinks
  {
    id: 'SINK-EVAL',
    title: 'Use of eval() or dynamic code executor',
    category: 'Dangerous Sink',
    severity: 'Critical',
    cwe: 'CWE-95',
    pattern: /\b(?:eval|new\s+Function|execScript)\s*\(/,
    description: 'eval() executes arbitrary strings as code, opening severe vulnerability to code injection.',
    remediation: 'Use JSON.parse() or dictionary lookups instead of dynamic evaluation.',
  },
  {
    id: 'SINK-INNERHTML-XSS',
    title: 'Potential Cross-Site Scripting (XSS) via innerHTML',
    category: 'Dangerous Sink',
    severity: 'High',
    cwe: 'CWE-79',
    pattern: /\.(?:innerHTML|outerHTML)\s*=\s*(?![`'"][\w\s<>]*['"]\s*;)(?:.*[a-zA-Z_])|dangerouslySetInnerHTML\s*=\s*\{/,
    description: 'Directly assigning dynamic or unsanitized content to innerHTML allows arbitrary JavaScript injection (XSS).',
    remediation: 'Use textContent, innerText, or sanitize with DOMPurify.',
  },

  // 4. Cryptography
  {
    id: 'CRYPTO-WEAK-HASH-MD5',
    title: 'Weak / Broken Cryptographic Hash (MD5/SHA-1)',
    category: 'Cryptography',
    severity: 'Medium',
    cwe: 'CWE-328',
    pattern: /(?:createHash\s*\(\s*['"](?:md5|sha1)['"]|hashlib\.(?:md5|sha1)\b|md5\s*\(|sha1\s*\()/i,
    description: 'MD5 and SHA-1 are cryptographically broken due to collision vulnerabilities.',
    remediation: 'Use SHA-256 for integrity hashing and bcrypt/Argon2 for passwords.',
  },
  {
    id: 'CRYPTO-INSECURE-RANDOM',
    title: 'Predictable Random Number Generator in Security Context',
    category: 'Cryptography',
    severity: 'Medium',
    cwe: 'CWE-330',
    pattern: /(?:token|secret|salt|key|nonce|auth|pass|session).*?Math\.random\s*\(\)|Math\.random\s*\(\).*?(?:token|secret|salt|key|nonce|auth|pass|session)/i,
    description: 'Math.random() is a pseudo-random number generator and is not cryptographically secure.',
    remediation: 'Use crypto.randomBytes() or crypto.getRandomValues().',
  },

  // 5. Memory Safety
  {
    id: 'MEM-UNSAFE-STRCPY',
    title: 'Unbounded String Copy Function (Buffer Overflow)',
    category: 'Memory Safety',
    severity: 'High',
    cwe: 'CWE-120',
    pattern: /\b(?:strcpy|strcat|gets|sprintf)\s*\(/,
    description: 'Functions like strcpy and gets do not perform buffer boundary checks, easily leading to stack buffer overflows.',
    remediation: 'Use bounded alternatives like strncpy, snprintf, or std::string in C++.',
    languageScope: ['c', 'cpp'],
  },
];

export function runOfflineSecurityScan(code: string, languageId: string = 'text'): LocalSecurityReport {
  const lines = code.split('\n');
  const issues: LocalSecurityIssue[] = [];
  const normalizedLang = languageId.toLowerCase();
  const seenMatches = new Set<string>();

  for (let idx = 0; idx < lines.length; idx++) {
    const lineText = lines[idx];
    const lineNumber = idx + 1;
    const trimmed = lineText.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('# ') || trimmed.startsWith('/*')) {
      const hasExtremeSecret = /(?:AKIA|ghp_|sk_live_)[\w-]{16,}/.test(lineText);
      if (!hasExtremeSecret) {
        continue;
      }
    }

    for (const rule of LOCAL_RULES) {
      if (rule.languageScope && !rule.languageScope.includes(normalizedLang)) {
        continue;
      }

      const match = rule.pattern.exec(lineText);
      if (match) {
        const snippet = match[0];
        const dedupKey = `${rule.id}:${lineNumber}:${snippet}`;
        if (!seenMatches.has(dedupKey)) {
          seenMatches.add(dedupKey);
          issues.push({
            id: rule.id,
            title: rule.title,
            category: rule.category,
            severity: rule.severity,
            lineNumber,
            matchedText: snippet,
            cwe: rule.cwe,
            description: rule.description,
            remediation: rule.remediation,
            safeReplacementSnippet: rule.safeReplacement ? rule.safeReplacement(snippet) : undefined,
          });
        }
      }
    }
  }

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let secretsFound = 0;
  let vulnerabilitiesFound = 0;

  for (const issue of issues) {
    if (issue.severity === 'Critical') criticalCount++;
    else if (issue.severity === 'High') highCount++;
    else if (issue.severity === 'Medium') mediumCount++;
    else if (issue.severity === 'Low') lowCount++;

    if (issue.category === 'Secret Leak') {
      secretsFound++;
    } else {
      vulnerabilitiesFound++;
    }
  }

  const deductions = (criticalCount * 25) + (highCount * 15) + (mediumCount * 8) + (lowCount * 3);
  const overallScore = Math.max(0, 100 - deductions);

  return {
    timestamp: new Date().toISOString(),
    isOffline: true,
    codeLength: code.length,
    lineCount: lines.length,
    overallScore,
    stats: {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      secretsFound,
      vulnerabilitiesFound,
    },
    issues,
  };
}
