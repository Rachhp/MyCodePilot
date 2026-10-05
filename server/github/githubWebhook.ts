/**
 * GitHub Webhook Handler Service
 * Receives repository events (pull_request, push) with cryptographic HMAC-SHA256 signature verification.
 * Prepares event queuing without automatically consuming Gemini tokens without user approval.
 */

import crypto from 'crypto';

export interface WebhookEventRecord {
  id: string;
  event: string;
  action?: string;
  repository: string;
  sender: string;
  timestamp: string;
  pullNumber?: number;
  commitSha?: string;
  details: string;
}

const recentWebhookEvents: WebhookEventRecord[] = [];

export function verifyWebhookSignature(payload: string, signature: string | undefined): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret configured in prototype, allow with notice
    return true;
  }
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function handleIncomingWebhook(event: string, payload: any): WebhookEventRecord {
  const repoName = payload.repository?.full_name || 'unknown/repository';
  const sender = payload.sender?.login || 'unknown';
  const action = payload.action;
  const timestamp = new Date().toISOString();

  let details = `Event: ${event}`;
  let pullNumber: number | undefined;
  let commitSha: string | undefined;

  if (event === 'pull_request') {
    pullNumber = payload.pull_request?.number;
    details = `Pull Request #${pullNumber} ${action || 'updated'}: "${payload.pull_request?.title}"`;
  } else if (event === 'push') {
    commitSha = payload.after?.slice(0, 7);
    details = `Push to ${payload.ref} (${commitSha}): ${payload.commits?.length || 0} commits`;
  }

  const record: WebhookEventRecord = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    event,
    action,
    repository: repoName,
    sender,
    timestamp,
    pullNumber,
    commitSha,
    details,
  };

  recentWebhookEvents.unshift(record);
  if (recentWebhookEvents.length > 50) {
    recentWebhookEvents.pop();
  }

  return record;
}

export function getRecentWebhookEvents(): WebhookEventRecord[] {
  return recentWebhookEvents;
}
