/**
 * CodePilot VS Code Extension Types
 */

export interface ExplanationResponse {
  title: string;
  overview: string;
  importantComponents: Array<{
    name: string;
    type: string;
    purpose: string;
  }>;
  inputsAndOutputs: {
    inputs: Array<{ name: string; type: string; description: string }>;
    outputs: Array<{ type: string; description: string }>;
  };
  potentialProblems: string[];
  simpleExplanationForBeginners: string;
  stepByStepFlow: string[];
}

export interface FixResponse {
  summaryOfFixes: string[];
  correctedCode: string;
  keyImprovements: Array<{
    area: string;
    detail: string;
  }>;
  isPartialSelection?: boolean;
}

export interface ReviewIssue {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Suggestion';
  category: 'Bug' | 'Security' | 'Performance' | 'Code Smell' | 'Best Practice' | 'Maintainability';
  title: string;
  lineNumber?: number;
  description: string;
  whyItIsAProblem: string;
  suggestedFix: string;
  correctedCodeSnippet?: string;
}

export interface ReviewResponse {
  overallScore: number;
  summary: string;
  stats: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    suggestionCount: number;
  };
  issues: ReviewIssue[];
}

export interface ChatResponse {
  reply: string;
}

export interface LocalSecurityIssue {
  id: string;
  title: string;
  category: string;
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
  overallScore: number;
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
