/**
 * CodePilot VS Code API Client
 * Handles communication between VS Code extension and the CodePilot backend service.
 * Never stores or exposes the Gemini API key directly.
 */

import * as vscode from 'vscode';
import { ExplanationResponse, FixResponse, ReviewResponse, ChatResponse } from './types';

export class CodePilotApiClient {
  private secretStorage: vscode.SecretStorage;

  constructor(secretStorage: vscode.SecretStorage) {
    this.secretStorage = secretStorage;
  }

  /**
   * Get configured base URL for CodePilot backend
   */
  private getBaseUrl(): string {
    const config = vscode.workspace.getConfiguration('codepilot');
    const url = config.get<string>('backendUrl') || 'http://localhost:3000';
    return url.replace(/\/+$/, '');
  }

  /**
   * Build request headers including optional SecretStorage token
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client': 'vscode-extension',
    };

    const token = await this.secretStorage.get('codepilot.authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    return headers;
  }

  /**
   * Health check to test backend availability
   */
  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    const baseUrl = this.getBaseUrl();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${baseUrl}/api/ai/health`, {
        method: 'GET',
        headers: await this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        return { ok: true, message: 'Connected to CodePilot backend.' };
      }
      return { ok: false, message: `Backend responded with HTTP ${res.status}.` };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { ok: false, message: `Connection timed out reaching ${baseUrl}.` };
      }
      return { ok: false, message: `Cannot connect to ${baseUrl}. Ensure CodePilot backend is running.` };
    }
  }

  /**
   * Explain Code
   */
  async explainCode(code: string, language: string): Promise<ExplanationResponse> {
    const baseUrl = this.getBaseUrl();
    return this.postRequest<ExplanationResponse>(`${baseUrl}/api/ai/explain`, {
      code,
      language,
      selectedCode: code,
    });
  }

  /**
   * Fix Code
   */
  async fixCode(code: string, language: string, instruction?: string): Promise<FixResponse> {
    const baseUrl = this.getBaseUrl();
    return this.postRequest<FixResponse>(`${baseUrl}/api/ai/fix`, {
      code,
      language,
      selectedCode: code,
      instruction,
    });
  }

  /**
   * Review Code
   */
  async reviewCode(code: string, language: string, isSelection: boolean = true): Promise<ReviewResponse> {
    const baseUrl = this.getBaseUrl();
    return this.postRequest<ReviewResponse>(`${baseUrl}/api/ai/review`, {
      code: isSelection ? undefined : code,
      selectedCode: isSelection ? code : undefined,
      language,
    });
  }

  /**
   * Chat message with optional context
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    codeContext?: string,
    language?: string,
    selectedCode?: string
  ): Promise<ChatResponse> {
    const baseUrl = this.getBaseUrl();
    return this.postRequest<ChatResponse>(`${baseUrl}/api/ai/chat`, {
      messages,
      codeContext,
      language,
      selectedCode,
    });
  }

  private async postRequest<T>(url: string, body: any): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI synthesis

    try {
      const headers = await this.getHeaders();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 401) {
        throw new Error('Authentication failed (401). Please check your CodePilot Auth Token.');
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with HTTP status ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out waiting for AI model response.');
      }
      if (err.message && err.message.includes('fetch failed')) {
        throw new Error(`Failed to connect to CodePilot backend at ${this.getBaseUrl()}. Is the server running?`);
      }
      throw err;
    }
  }
}
