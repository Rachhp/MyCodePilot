/**
 * GitHub Authentication Service
 * Manages GitHub OAuth flow, token exchange, and user profile verification.
 * Client secrets and tokens are kept strictly on the server.
 */

import { GitHubUser } from '../../src/types/github';

// In-memory token store for session (can be keyed by session or active token)
let activeGitHubToken: string | null = process.env.GITHUB_ACCESS_TOKEN || null;
let cachedGitHubUser: GitHubUser | null = null;

export function getStoredGitHubToken(): string | null {
  return activeGitHubToken;
}

export function setStoredGitHubToken(token: string | null) {
  activeGitHubToken = token;
  if (!token) {
    cachedGitHubUser = null;
  }
}

export function getGitHubRedirectUri(origin?: string): string {
  // Use runtime APP_URL if configured, fallback to provided origin or default
  const base = process.env.APP_URL || origin || 'http://localhost:3000';
  return `${base.replace(/\/+$/, '')}/api/github/callback`;
}

export function getGitHubAuthUrl(origin?: string): { url: string; clientIdConfigured: boolean } {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return { url: '', clientIdConfigured: false };
  }

  const redirectUri = getGitHubRedirectUri(origin);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,read:user,user:email',
    allow_signup: 'true',
  });

  return {
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    clientIdConfigured: true,
  };
}

export async function exchangeGitHubCode(code: string, origin?: string): Promise<{ token: string; error?: string }> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing on the server.');
  }

  const redirectUri = getGitHubRedirectUri(origin);

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'CodePilot-App',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to exchange GitHub authorization code: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  const token = data.access_token;
  setStoredGitHubToken(token);
  return { token };
}

export async function fetchGitHubUser(customToken?: string): Promise<GitHubUser> {
  const token = customToken || activeGitHubToken;
  if (!token) {
    throw new Error('No GitHub access token configured. Please connect your GitHub account.');
  }

  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'CodePilot-App',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setStoredGitHubToken(null);
      throw new Error('GitHub token expired or unauthorized. Please re-connect.');
    }
    const errText = await res.text();
    throw new Error(`Failed to fetch GitHub profile: ${res.status} ${errText}`);
  }

  const user: GitHubUser = await res.json();
  cachedGitHubUser = user;
  return user;
}

export function getCachedUser(): GitHubUser | null {
  return cachedGitHubUser;
}
