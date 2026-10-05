export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'sql'
  | 'html'
  | 'css'
  | 'json';

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  extension: string;
  prismLang: string;
  defaultCode: string;
  category: 'web' | 'backend' | 'systems' | 'data';
}

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Suggestion';

export type IssueCategory =
  | 'Bug'
  | 'Security'
  | 'Performance'
  | 'Code Smell'
  | 'Best Practice'
  | 'Maintainability';

export interface ReviewIssue {
  id: string;
  severity: Severity;
  category: IssueCategory;
  title: string;
  lineNumber?: number;
  description: string;
  whyItIsAProblem: string;
  suggestedFix: string;
  correctedCodeSnippet?: string;
}

export interface ReviewStats {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  suggestionCount: number;
}

export interface ReviewResult {
  overallScore: number;
  summary: string;
  stats: ReviewStats;
  issues: ReviewIssue[];
}

export interface ComponentBreakdown {
  name: string;
  type: string;
  purpose: string;
}

export interface InputOutputSpec {
  name?: string;
  type: string;
  description: string;
}

export interface ExplanationResult {
  title: string;
  overview: string;
  importantComponents: ComponentBreakdown[];
  inputsAndOutputs: {
    inputs: InputOutputSpec[];
    outputs: InputOutputSpec[];
  };
  potentialProblems: string[];
  simpleExplanationForBeginners: string;
  stepByStepFlow: string[];
}

export interface KeyImprovement {
  area: string;
  detail: string;
}

export interface FixResult {
  summaryOfFixes: string[];
  correctedCode: string;
  keyImprovements: KeyImprovement[];
  isPartialSelection?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedCode?: {
    code: string;
    language: string;
    isSelection?: boolean;
    lineRange?: string;
  };
  actionType?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  content: string;
  hasBugs?: boolean;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
}

export interface AiUsageData {
  requestCount: number;
  estimatedTokens: number;
  lastRequestTime: string | null;
  hasApiKey: boolean;
}
