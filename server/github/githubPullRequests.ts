/**
 * GitHub Pull Requests Service
 * Fetches pull requests, changed files, diffs, and PR metadata.
 */

import { getStoredGitHubToken } from './githubAuth';
import { GitHubPullRequest, GitHubChangedFile, GitHubCommit } from '../../src/types/github';

function getAuthHeaders(tokenOverride?: string): Record<string, string> {
  const token = tokenOverride || getStoredGitHubToken();
  if (!token) {
    throw new Error('Not authenticated with GitHub. Please connect your GitHub account.');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CodePilot-App',
  };
}

export async function listPullRequests(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  tokenOverride?: string
): Promise<GitHubPullRequest[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${state}&per_page=50`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to list pull requests for ${owner}/${repo}: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function getPullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  tokenOverride?: string
): Promise<GitHubPullRequest> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to get PR #${pullNumber} for ${owner}/${repo}: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function getPullRequestFiles(
  owner: string,
  repo: string,
  pullNumber: number,
  tokenOverride?: string
): Promise<GitHubChangedFile[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/files?per_page=100`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to get files for PR #${pullNumber}: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function getPullRequestCommits(
  owner: string,
  repo: string,
  pullNumber: number,
  tokenOverride?: string
): Promise<GitHubCommit[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/commits?per_page=100`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to get commits for PR #${pullNumber}: HTTP ${res.status}`);
  }

  return await res.json();
}
