/**
 * GitHub Files Service
 * Fetches file tree, directories, and file content from a repository.
 */

import { getStoredGitHubToken } from './githubAuth';
import { GitHubFileItem } from '../../src/types/github';

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

export async function getRepositoryTree(
  owner: string,
  repo: string,
  branchOrSha: string = 'HEAD',
  tokenOverride?: string
): Promise<GitHubFileItem[]> {
  const headers = getAuthHeaders(tokenOverride);
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branchOrSha)}?recursive=1`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`Failed to load repository tree: HTTP ${res.status}`);
  }

  const data = await res.json();
  // Filter out git internal files or hidden files if needed, return items
  const items: GitHubFileItem[] = (data.tree || []).slice(0, 2000);
  return items;
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  tokenOverride?: string
): Promise<{ path: string; name: string; content: string; size: number }> {
  const headers = getAuthHeaders(tokenOverride);
  let url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;
  if (ref) {
    url += `?ref=${encodeURIComponent(ref)}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`Failed to fetch file content for ${path}: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.type !== 'file') {
    throw new Error(`Target path "${path}" is a ${data.type}, not a file.`);
  }

  let text = '';
  if (data.encoding === 'base64' && data.content) {
    text = Buffer.from(data.content, 'base64').toString('utf-8');
  } else if (data.download_url) {
    const rawRes = await fetch(data.download_url, { headers });
    text = await rawRes.text();
  }

  return {
    path: data.path,
    name: data.name,
    content: text,
    size: data.size || text.length,
  };
}
