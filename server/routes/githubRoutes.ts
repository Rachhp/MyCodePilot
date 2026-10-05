/**
 * GitHub Integration Express Router
 * Mounts all GitHub API endpoints under /api/github.
 */

import { Router } from 'express';
import {
  getGitHubAuthUrl,
  exchangeGitHubCode,
  fetchGitHubUser,
  getStoredGitHubToken,
  setStoredGitHubToken,
  getCachedUser,
  getGitHubRedirectUri,
} from '../github/githubAuth';
import {
  listUserRepositories,
  searchRepositories,
  getRepositoryDetails,
  getRepositoryBranches,
  getRepositoryCommits,
} from '../github/githubRepositories';
import {
  listPullRequests,
  getPullRequest,
  getPullRequestFiles,
  getPullRequestCommits,
} from '../github/githubPullRequests';
import { getRepositoryTree, getFileContent } from '../github/githubFiles';
import { reviewPullRequestWithAi, postGitHubComment } from '../github/githubReviews';
import {
  verifyWebhookSignature,
  handleIncomingWebhook,
  getRecentWebhookEvents,
} from '../github/githubWebhook';

export const githubRouter = Router();

// 1. Status & Auth State
githubRouter.get('/status', async (req, res) => {
  const token = getStoredGitHubToken();
  const clientId = process.env.GITHUB_CLIENT_ID || null;
  const redirectUri = getGitHubRedirectUri(req.headers.origin as string);

  let user = getCachedUser();
  if (token && !user) {
    try {
      user = await fetchGitHubUser();
    } catch {
      user = null;
    }
  }

  res.json({
    hasOAuthConfig: Boolean(clientId && process.env.GITHUB_CLIENT_SECRET),
    clientId,
    redirectUri,
    isAuthenticated: Boolean(token && user),
    user,
  });
});

// 2. OAuth Auth URL
githubRouter.get('/auth-url', (req, res) => {
  const origin = req.headers.origin as string;
  const { url, clientIdConfigured } = getGitHubAuthUrl(origin);
  if (!clientIdConfigured) {
    return res.status(400).json({
      error: 'GITHUB_CLIENT_ID is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in environment variables.',
      setupGuide: {
        devCallback: `${process.env.APP_URL || 'https://.../api/github/callback'}`,
      },
    });
  }
  res.json({ url });
});

// 3. OAuth Callback Route (popup sends postMessage & closes)
githubRouter.get(['/callback', '/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 30px; text-align: center; background: #121316; color: #fca5a5;">
          <h2>GitHub Authentication Failed</h2>
          <p>${String(error_description || error)}</p>
          <button onclick="window.close()" style="padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 6px;">Close Window</button>
        </body>
      </html>
    `);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const origin = req.headers.origin as string;
    const { token } = await exchangeGitHubCode(code, origin);
    const user = await fetchGitHubUser(token);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>GitHub Connected</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #121316; color: #fff;">
          <h2 style="color: #34d399;">✓ GitHub Connected Successfully!</h2>
          <p style="color: #a1a1aa; font-size: 14px;">Logged in as <strong>@${user.login}</strong>.</p>
          <p style="color: #71717a; font-size: 12px;">This popup window will close automatically...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GITHUB_AUTH_SUCCESS',
                  token: '${token}',
                  user: ${JSON.stringify(user)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            } catch (err) {
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 30px; text-align: center; background: #121316; color: #fca5a5;">
          <h2>GitHub Token Exchange Error</h2>
          <p>${err.message || 'Unknown error during token exchange'}</p>
          <button onclick="window.close()" style="padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 6px;">Close</button>
        </body>
      </html>
    `);
  }
});

// 4. Token Login (for Personal Access Token or manual token)
githubRouter.post('/token-login', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const user = await fetchGitHubUser(token.trim());
    setStoredGitHubToken(token.trim());
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid GitHub token' });
  }
});

// 5. Logout
githubRouter.post('/logout', (req, res) => {
  setStoredGitHubToken(null);
  res.json({ success: true, message: 'Disconnected GitHub account' });
});

// 6. User profile
githubRouter.get('/user', async (req, res) => {
  try {
    const user = await fetchGitHubUser();
    res.json(user);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// 7. Repositories List
githubRouter.get('/repos', async (req, res) => {
  try {
    const repos = await listUserRepositories();
    res.json(repos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Search Repositories
githubRouter.get('/repos/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  try {
    const repos = await searchRepositories(query);
    res.json(repos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Repository Detail
githubRouter.get('/repos/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const details = await getRepositoryDetails(owner, repo);
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Repository Branches
githubRouter.get('/repos/:owner/:repo/branches', async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const branches = await getRepositoryBranches(owner, repo);
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Repository Commits
githubRouter.get('/repos/:owner/:repo/commits', async (req, res) => {
  const { owner, repo } = req.params;
  const branch = req.query.branch as string | undefined;
  try {
    const commits = await getRepositoryCommits(owner, repo, branch);
    res.json(commits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Repository Tree
githubRouter.get('/repos/:owner/:repo/tree', async (req, res) => {
  const { owner, repo } = req.params;
  const ref = (req.query.ref as string) || 'HEAD';
  try {
    const tree = await getRepositoryTree(owner, repo, ref);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. File Content
githubRouter.get('/repos/:owner/:repo/content', async (req, res) => {
  const { owner, repo } = req.params;
  const path = req.query.path as string;
  const ref = req.query.ref as string | undefined;
  if (!path) {
    return res.status(400).json({ error: 'path parameter is required' });
  }
  try {
    const content = await getFileContent(owner, repo, path, ref);
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Pull Requests List
githubRouter.get('/repos/:owner/:repo/pulls', async (req, res) => {
  const { owner, repo } = req.params;
  const state = (req.query.state as 'open' | 'closed' | 'all') || 'open';
  try {
    const pulls = await listPullRequests(owner, repo, state);
    res.json(pulls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Pull Request Detail & Changed Files
githubRouter.get('/repos/:owner/:repo/pulls/:number', async (req, res) => {
  const { owner, repo, number } = req.params;
  const pullNumber = parseInt(number, 10);
  try {
    const [pr, files, commits] = await Promise.all([
      getPullRequest(owner, repo, pullNumber),
      getPullRequestFiles(owner, repo, pullNumber),
      getPullRequestCommits(owner, repo, pullNumber),
    ]);
    res.json({ pr, files, commits });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Pull Request AI Review
githubRouter.post('/repos/:owner/:repo/pulls/:number/review', async (req, res) => {
  const { owner, repo, number } = req.params;
  const pullNumber = parseInt(number, 10);
  const forceRefresh = Boolean(req.body.forceRefresh);

  try {
    const reviewResult = await reviewPullRequestWithAi(owner, repo, pullNumber, forceRefresh);
    res.json(reviewResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to review pull request' });
  }
});

// 17. Post Comment to GitHub Pull Request
githubRouter.post('/repos/:owner/:repo/pulls/:number/comment', async (req, res) => {
  const { owner, repo, number } = req.params;
  const pullNumber = parseInt(number, 10);
  const { body, path, line, commitId } = req.body;

  if (!body || typeof body !== 'string') {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  try {
    const result = await postGitHubComment({
      owner,
      repo,
      pullNumber,
      body,
      path,
      line,
      commitId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to post comment to GitHub' });
  }
});

// 18. GitHub Webhook Receiver
githubRouter.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = (req.headers['x-github-event'] as string) || 'unknown';
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const record = handleIncomingWebhook(event, req.body);
  res.json({ received: true, event: record });
});

// 19. Recent Webhook Events Log
githubRouter.get('/webhook/events', (req, res) => {
  res.json(getRecentWebhookEvents());
});
