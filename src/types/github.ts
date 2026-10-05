/**
 * GitHub Integration Types
 */

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubFileItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
}

export interface GitHubChangedFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  raw_url: string;
}

export interface PullRequestFinding {
  id: string;
  file: string;
  lineNumber?: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Suggestion';
  category: 'Bug' | 'Security' | 'Performance' | 'Code Smell' | 'Maintainability' | 'Edge Case';
  explanation: string;
  suggestedFix: string;
  correctedCodeSnippet?: string;
}

export interface PullRequestReviewResult {
  pullNumber: number;
  headSha: string;
  reviewedAt: string;
  overallScore: number;
  assessment: 'Changes look good' | 'Changes require attention' | 'Critical issues detected';
  summary: string;
  stats: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    suggestionCount: number;
  };
  findings: PullRequestFinding[];
  isLocalOnly?: boolean;
}

export interface GitHubCommentDraft {
  owner: string;
  repo: string;
  pullNumber: number;
  body: string;
  path?: string;
  line?: number;
  commitId?: string;
}

export interface GitHubConfigStatus {
  hasOAuthConfig: boolean;
  clientId: string | null;
  isAuthenticated: boolean;
  user: GitHubUser | null;
  scope?: string;
}
