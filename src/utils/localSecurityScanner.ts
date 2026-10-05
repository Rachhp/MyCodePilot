/**
 * Local Security Analysis System
 * Runs 100% in-browser without sending source code or data to Gemini or any external server.
 * Operates completely offline with zero telemetry.
 */

export interface LocalSecurityIssue {
  id: string;
  title: string;
  category: 'Secret Leak' | 'Injection' | 'Dangerous Sink' | 'Cryptography' | 'Network Security' | 'Memory Safety' | 'Path Traversal';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  lineNumber: number;
  matchedText: string;
  cwe?: string;
  description: string;
  remediation: string;
  safeReplacementSnippet?: string;
}

export interface LocalSecurityReport {
  timestamp: string;
  isOffline: true;
  codeLength: number;
  lineCount: number;
  overallScore: number; // 0 to 100 (100 = safe)
  stats: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    secretsFound: number;
    vulnerabilitiesFound: number;
  };
  issues: LocalSecurityIssue[];
}

interface ScanRule {
  id: string;
  title: string;
  category: LocalSecurityIssue['category'];
  severity: LocalSecurityIssue['severity'];
  cwe?: string;
  pattern: RegExp;
  description: string;
  remediation: string;
  safeReplacement?: (match: string) => string;
  languageScope?: string[]; // If undefined, applies to all languages
}

const SECURITY_RULES: ScanRule[] = [
  // 1. SECRETS & HARDCODED CREDENTIALS
  {
    id: 'SEC-AWS-KEY',
    title: 'Hardcoded AWS Access Key ID',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-798',
    pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/,
    description: 'Found an active AWS Access Key ID directly in source code. If exposed, attackers can access your AWS infrastructure.',
    remediation: 'Move AWS credentials to environment variables or use IAM Roles/AWS Secrets Manager.',
    safeReplacement: () => 'process.env.AWS_ACCESS_KEY_ID',
  },
  {
    id: 'SEC-GITHUB-TOKEN',
    title: 'Hardcoded GitHub Personal Access Token',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-798',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b|\bgithub_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}\b/,
    description: 'Exposed GitHub Token grants repository, package, and organization permissions.',
    remediation: 'Revoke token immediately in GitHub settings and store in repository secrets or .env file.',
    safeReplacement: () => 'process.env.GITHUB_TOKEN',
  },
  {
    id: 'SEC-PRIVATE-KEY',
    title: 'Hardcoded RSA/EC/PGP Private Key',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-312',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    description: 'Cryptographic private key detected in source code. Anyone with access to this file can decrypt traffic or forge signatures.',
    remediation: 'Never check private keys into source control. Store in a secure vault (KMS, Vault) or load from file at runtime.',
    safeReplacement: () => 'fs.readFileSync(process.env.PRIVATE_KEY_PATH)',
  },
  {
    id: 'SEC-STRIPE-KEY',
    title: 'Hardcoded Stripe API Secret Key',
    category: 'Secret Leak',
    severity: 'Critical',
    cwe: 'CWE-798',
    pattern: /\b(?:sk_live|rk_live)_[0-9a-zA-Z]{24,}\b/,
    description: 'Live Stripe Secret API key detected. An attacker can make unauthorized financial charges or inspect customer billing details.',
    remediation: 'Store Stripe keys in environment variables (STRIPE_SECRET_KEY) and restrict API key permissions.',
    safeReplacement: () => 'process.env.STRIPE_SECRET_KEY',
  },
  {
    id: 'SEC-GENERIC-SECRET',
    title: 'Hardcoded Password or Secret String',
    category: 'Secret Leak',
    severity: 'High',
    cwe: 'CWE-259',
    pattern: /(?:password|passwd|api_key|apikey|secret|auth_token|client_secret)\s*[:=]\s*["']([^"'\\s]{6,})["']/i,
    description: 'Detected a hardcoded password or authentication credential in plain text assignment.',
    remediation: 'Load sensitive credentials from environment variables or a configuration secret store.',
    safeReplacement: (match) => {
      const varName = match.split(/[=:]/)[0].trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
      return `${match.split(/[=:]/)[0].trim()} = process.env.${varName}`;
    },
  },
  {
    id: 'SEC-JWT-TOKEN',
    title: 'Exposed Hardcoded JSON Web Token (JWT)',
    category: 'Secret Leak',
    severity: 'High',
    cwe: 'CWE-798',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    description: 'Found a signed JWT in code. If long-lived or holding administrative claims, accounts can be hijacked.',
    remediation: 'Generate tokens dynamically at runtime and exchange via Authorization Bearer headers.',
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
    safeReplacement: () => 'process.env.DATABASE_URL',
  },

  // 2. INJECTION VULNERABILITIES
  {
    id: 'INJ-SQL-CONCAT',
    title: 'Potential SQL Injection via String Concatenation',
    category: 'Injection',
    severity: 'Critical',
    cwe: 'CWE-89',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*?(?:\+|%|\.|\$)\s*(?:req\.|params|input|id|user|query)/i,
    description: 'SQL query appears to be constructed using raw string concatenation or interpolation with untrusted input.',
    remediation: 'Use parameterized / prepared queries (e.g. query("SELECT * FROM users WHERE id = $1", [id])) or an ORM.',
    languageScope: ['javascript', 'typescript', 'python', 'java', 'php', 'csharp', 'go', 'rust'],
  },
  {
    id: 'INJ-COMMAND-EXEC',
    title: 'Dangerous System Command Execution',
    category: 'Injection',
    severity: 'Critical',
    cwe: 'CWE-78',
    pattern: /(?:exec|execSync|spawn|popen|system|Runtime\.getRuntime\(\)\.exec)\s*\([^)]*?(?:\+|%|\$)\s*[a-zA-Z_]/,
    description: 'Constructing shell commands with dynamic variable concatenation can lead to Remote Command Execution (RCE).',
    remediation: 'Pass arguments as an array to spawn without `{ shell: true }`, or strictly whitelist inputs.',
  },

  // 3. DANGEROUS SINKS & EVAL
  {
    id: 'SINK-EVAL',
    title: 'Use of eval() or dynamic code executor',
    category: 'Dangerous Sink',
    severity: 'Critical',
    cwe: 'CWE-95',
    pattern: /\b(?:eval|new\s+Function|execScript)\s*\(/,
    description: 'eval() executes arbitrary strings as code in the current scope, opening severe vulnerability to code injection.',
    remediation: 'Use JSON.parse() for data serialization or safe dictionary/map lookups instead of dynamic evaluation.',
    languageScope: ['javascript', 'typescript', 'python', 'php'],
  },
  {
    id: 'SINK-INNERHTML-XSS',
    title: 'Potential Cross-Site Scripting (XSS) via innerHTML',
    category: 'Dangerous Sink',
    severity: 'High',
    cwe: 'CWE-79',
    pattern: /\.(?:innerHTML|outerHTML)\s*=\s*(?![`'"][\w\s<>]*['"]\s*;)(?:.*[a-zA-Z_])|dangerouslySetInnerHTML\s*=\s*\{/,
    description: 'Directly assigning dynamic or unsanitized content to innerHTML allows arbitrary JavaScript injection (XSS).',
    remediation: 'Use textContent, innerText, or sanitize HTML with DOMPurify before inserting.',
    languageScope: ['javascript', 'typescript', 'html'],
  },
  {
    id: 'SINK-PYTHON-PICKLE',
    title: 'Insecure Deserialization via pickle.loads',
    category: 'Dangerous Sink',
    severity: 'Critical',
    cwe: 'CWE-502',
    pattern: /\bpickle\.(?:loads|load)\s*\(/,
    description: 'Python pickle module is not secure against untrusted data and can execute arbitrary payloads during unpickling.',
    remediation: 'Use safe serialization formats like JSON, Protocol Buffers, or messagepack instead of pickle.',
    languageScope: ['python'],
  },

  // 4. CRYPTOGRAPHY FLAWS
  {
    id: 'CRYPTO-WEAK-HASH-MD5',
    title: 'Weak / Broken Cryptographic Hash (MD5/SHA-1)',
    category: 'Cryptography',
    severity: 'Medium',
    cwe: 'CWE-328',
    pattern: /(?:createHash\s*\(\s*['"](?:md5|sha1)['"]|hashlib\.(?:md5|sha1)\b|md5\s*\(|sha1\s*\()/i,
    description: 'MD5 and SHA-1 are cryptographically broken due to collision vulnerabilities.',
    remediation: 'Use SHA-256 (SHA-2) or SHA-3 for hashing, and bcrypt/Argon2 for passwords.',
    safeReplacement: () => 'crypto.createHash("sha256")',
  },
  {
    id: 'CRYPTO-INSECURE-RANDOM',
    title: 'Predictable Random Number Generator in Security Context',
    category: 'Cryptography',
    severity: 'Medium',
    cwe: 'CWE-330',
    pattern: /(?:token|secret|salt|key|nonce|auth|pass|session).*?Math\.random\s*\(\)|Math\.random\s*\(\).*?(?:token|secret|salt|key|nonce|auth|pass|session)/i,
    description: 'Math.random() is a pseudo-random number generator (PRNG) and is not cryptographically secure.',
    remediation: 'Use crypto.getRandomValues() in browser, crypto.randomBytes() in Node, or secrets module in Python.',
    safeReplacement: () => 'crypto.getRandomValues(new Uint8Array(32))',
  },

  // 5. NETWORK SECURITY & TLS
  {
    id: 'NET-TLS-REJECT-FALSE',
    title: 'Disabled TLS Certificate Verification',
    category: 'Network Security',
    severity: 'High',
    cwe: 'CWE-295',
    pattern: /(?:rejectUnauthorized\s*:\s*false|verify\s*=\s*False|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?|check_hostname\s*=\s*False)/i,
    description: 'Disabling SSL/TLS certificate validation exposes network requests to Man-In-The-Middle (MITM) attacks.',
    remediation: 'Ensure certificates are validated with valid CA root certificates; never disable rejectUnauthorized in production.',
  },
  {
    id: 'NET-INSECURE-HTTP',
    title: 'Cleartext HTTP Protocol in Sensitive Endpoint',
    category: 'Network Security',
    severity: 'Low',
    cwe: 'CWE-319',
    pattern: /http:\/\/(?!(?:localhost|127\.0\.0\.1|0\.0\.0\.0|w3\.org))[a-zA-Z0-9_\-\.]+\.[a-zA-Z]{2,}[^\s'"]*/i,
    description: 'Transmitting data over unencrypted HTTP protocol allows packet sniffing and tampering.',
    remediation: 'Migrate endpoint URL to HTTPS (TLS 1.2+).',
  },

  // 6. PATH TRAVERSAL
  {
    id: 'PATH-TRAVERSAL',
    title: 'Potential Path Traversal in File System Call',
    category: 'Path Traversal',
    severity: 'High',
    cwe: 'CWE-22',
    pattern: /(?:readFile|readFileSync|createReadStream|open|unlink|writeFile)\s*\([^)]*?(?:req\.params|req\.query|req\.body|\.\.\/|\.\.\\)/,
    description: 'File operation incorporates untrusted input without path canonicalization, allowing attackers to access arbitrary files.',
    remediation: 'Resolve and validate paths using path.normalize() and check that the resolved path starts with the allowed root directory.',
  },

  // 7. MEMORY SAFETY (C / C++)
  {
    id: 'MEM-UNSAFE-STRCPY',
    title: 'Unbounded String Copy Function (Buffer Overflow)',
    category: 'Memory Safety',
    severity: 'High',
    cwe: 'CWE-120',
    pattern: /\b(?:strcpy|strcat|gets|sprintf)\s*\(/,
    description: 'Functions like strcpy and gets do not perform buffer boundary checks, easily leading to stack-based buffer overflows.',
    remediation: 'Use bounded alternatives like strncpy, snprintf, strlcpy, or std::string in C++.',
    languageScope: ['c', 'cpp', 'c++'],
  },
];

/**
 * Perform a 100% local, client-side security analysis on source code.
 * Zero network traffic, zero third-party calls.
 */
export function scanCodeLocally(code: string, language: string = 'text'): LocalSecurityReport {
  const lines = code.split('\n');
  const issues: LocalSecurityIssue[] = [];
  const normalizedLang = language.toLowerCase();

  // Deduplication set to avoid multiple identical alerts on same line
  const seenMatches = new Set<string>();

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const lineNumber = lineIdx + 1;

    // Skip empty lines or pure single-line comment lines to reduce false positives
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('# ') || trimmed.startsWith('/*')) {
      // Still scan comments for high-risk secrets (AWS, GitHub, Stripe keys)
      const hasExtremeSecret = /(?:AKIA|ghp_|sk_live_)[\w-]{16,}/.test(lineText);
      if (!hasExtremeSecret) {
        continue;
      }
    }

    for (const rule of SECURITY_RULES) {
      // Check language scope
      if (rule.languageScope && !rule.languageScope.includes(normalizedLang)) {
        continue;
      }

      const match = rule.pattern.exec(lineText);
      if (match) {
        const matchedSnippet = match[0];
        const dedupKey = `${rule.id}:${lineNumber}:${matchedSnippet}`;

        if (!seenMatches.has(dedupKey)) {
          seenMatches.add(dedupKey);

          issues.push({
            id: rule.id,
            title: rule.title,
            category: rule.category,
            severity: rule.severity,
            lineNumber,
            matchedText: matchedSnippet,
            cwe: rule.cwe,
            description: rule.description,
            remediation: rule.remediation,
            safeReplacementSnippet: rule.safeReplacement ? rule.safeReplacement(matchedSnippet) : undefined,
          });
        }
      }
    }
  }

  // Calculate statistics
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

  // Compute overall health score: Start at 100, subtract weighted penalties
  // Critical: -25, High: -15, Medium: -8, Low: -3
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
