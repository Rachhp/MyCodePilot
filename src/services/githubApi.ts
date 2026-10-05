/**
 * Client GitHub API Service
 * Communicates with the backend /api/github routes.
 */

import {
  GitHubUser,
  GitHubRepository,
  GitHubBranch,
  GitHubCommit,
  GitHubFileItem,
  GitHubPullRequest,
  GitHubChangedFile,
  PullRequestReviewResult,
  GitHubConfigStatus,
} from '../types/github';

export const githubApi = {
  async getStatus(): Promise<GitHubConfigStatus> {
    const res = await fetch('/api/github/status');
    if (!res.ok) throw new Error('Failed to fetch GitHub status');
    return res.json();
  },

  async getAuthUrl(): Promise<{ url: string }> {
    const res = await fetch('/api/github/auth-url');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to get GitHub authorization URL');
    }
    return res.json();
  },

  async loginWithToken(token: string): Promise<{ success: boolean; user: GitHubUser }> {
    const res = await fetch('/api/github/token-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid GitHub token');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/github/logout', { method: 'POST' });
  },

  async listRepositories(): Promise<GitHubRepository[]> {
    const res = await fetch('/api/github/repos');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to list repositories');
    }
    return res.json();
  },

  async searchRepositories(q: string): Promise<GitHubRepository[]> {
    const res = await fetch(`/api/github/repos/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Search failed');
    }
    return res.json();
  },

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const res = await fetch(`/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    if (!res.ok) throw new Error('Failed to fetch repository details');
    return res.json();
  },

  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    const res = await fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`
    );
    if (!res.ok) throw new Error('Failed to fetch branches');
    return res.json();
  },

  async getCommits(owner: string, repo: string, branch?: string): Promise<GitHubCommit[]> {
    let url = `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`;
    if (branch) url += `?branch=${encodeURIComponent(branch)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch commits');
    return res.json();
  },

  async getTree(owner: string, repo: string, ref: string = 'HEAD'): Promise<GitHubFileItem[]> {
    const res = await fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree?ref=${encodeURIComponent(ref)}`
    );
    if (!res.ok) throw new Error('Failed to fetch file tree');
    return res.json();
  },

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<{ path: string; name: string; content: string; size: number }> {
    let url = `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/content?path=${encodeURIComponent(path)}`;
    if (ref) url += `&ref=${encodeURIComponent(ref)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load file: ${path}`);
    return res.json();
  },

  async listPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPullRequest[]> {
    const res = await fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${state}`
    );
    if (!res.ok) throw new Error('Failed to fetch pull requests');
    return res.json();
  },

  async getPullRequestDetails(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<{ pr: GitHubPullRequest; files: GitHubChangedFile[]; commits: GitHubCommit[] }> {
    const res = await fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`
    );
    if (!res.ok) throw new Error(`Failed to fetch PR #${pullNumber}`);
    return res.json();
  },

  async reviewPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    forceRefresh: boolean = false
  ): Promise<PullRequestReviewResult> {
    const res = await fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Pull request review failed');
    }
    return res.json();
  },

  async postComment(
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
    path?: string,
    line?: number,
    commitId?: string
  ): Promise<{ success: boolean; commentUrl?: string; id?: number }> {
    const res = await fetch(
      `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/comment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, path, line, commitId }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post comment to GitHub');
    }
    return res.json();
  },
};
