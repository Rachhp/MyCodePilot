/**
 * GitHub Repositories Service
 * Handles listing, searching, branches, and commits.
 */

import { getStoredGitHubToken } from './githubAuth';
import { GitHubRepository, GitHubBranch, GitHubCommit } from '../../src/types/github';

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

export async function listUserRepositories(tokenOverride?: string): Promise<GitHubRepository[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list repositories from GitHub: HTTP ${res.status} ${errorText}`);
  }

  const data: GitHubRepository[] = await res.json();
  return data;
}

export async function searchRepositories(query: string, tokenOverride?: string): Promise<GitHubRepository[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=30`, {
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub repository search failed: HTTP ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function getRepositoryDetails(owner: string, repo: string, tokenOverride?: string): Promise<GitHubRepository> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to get repository ${owner}/${repo}: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function getRepositoryBranches(owner: string, repo: string, tokenOverride?: string): Promise<GitHubBranch[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to get branches for ${owner}/${repo}: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function getRepositoryCommits(owner: string, repo: string, branch?: string, tokenOverride?: string): Promise<GitHubCommit[]> {
  const headers = getAuthHeaders(tokenOverride);
  let url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=20`;
  if (branch) {
    url += `&sha=${encodeURIComponent(branch)}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`Failed to get commits for ${owner}/${repo}: HTTP ${res.status}`);
  }

  return await res.json();
}
