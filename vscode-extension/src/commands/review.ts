import * as vscode from 'vscode';
import { CodePilotApiClient } from '../api';
import { ReviewResponse, ReviewIssue } from '../types';

export function registerReviewCommands(
  context: vscode.ExtensionContext,
  apiClient: CodePilotApiClient,
  diagnosticCollection: vscode.DiagnosticCollection
) {
  // 1. Review Selected Code
  const reviewSelection = vscode.commands.registerCommand('codepilot.reviewSelectedCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('CodePilot: Open a file and select code to review.');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText || selectedText.trim().length === 0) {
      vscode.window.showInformationMessage('CodePilot: Please select code to review, or use "Review Current File".');
      return;
    }

    await runReview(context, apiClient, diagnosticCollection, editor.document, selectedText, true);
  });

  // 2. Review Current File
  const reviewFile = vscode.commands.registerCommand('codepilot.reviewCurrentFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('CodePilot: Open a file to review.');
      return;
    }

    const fullText = editor.document.getText();
    if (!fullText || fullText.trim().length === 0) {
      vscode.window.showInformationMessage('CodePilot: The current file is empty.');
      return;
    }

    await runReview(context, apiClient, diagnosticCollection, editor.document, fullText, false);
  });

  return [reviewSelection, reviewFile];
}

async function runReview(
  context: vscode.ExtensionContext,
  apiClient: CodePilotApiClient,
  diagnosticCollection: vscode.DiagnosticCollection,
  document: vscode.TextDocument,
  code: string,
  isSelection: boolean
) {
  const language = document.languageId;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `CodePilot: Reviewing ${isSelection ? 'selected snippet' : 'current file'}...`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await apiClient.reviewCode(code, language, isSelection);

        // Update VS Code Diagnostics
        const config = vscode.workspace.getConfiguration('codepilot');
        if (config.get<boolean>('enableInlineDiagnostics', true)) {
          updateDiagnostics(diagnosticCollection, document, result.issues);
        }

        // Show review webview panel
        showReviewWebview(context, result, document.fileName, language, isSelection);
      } catch (err: any) {
        vscode.window.showErrorMessage(`CodePilot Error: ${err.message || 'Failed to review code.'}`);
      }
    }
  );
}

function updateDiagnostics(
  collection: vscode.DiagnosticCollection,
  document: vscode.TextDocument,
  issues: ReviewIssue[]
) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const issue of issues) {
    const lineIndex = Math.max(0, (issue.lineNumber || 1) - 1);
    const line = lineIndex < document.lineCount ? document.lineAt(lineIndex) : null;
    const range = line ? line.range : new vscode.Range(0, 0, 0, 10);

    let severity = vscode.DiagnosticSeverity.Information;
    if (issue.severity === 'Critical') severity = vscode.DiagnosticSeverity.Error;
    else if (issue.severity === 'High') severity = vscode.DiagnosticSeverity.Error;
    else if (issue.severity === 'Medium') severity = vscode.DiagnosticSeverity.Warning;

    const diag = new vscode.Diagnostic(
      range,
      `[CodePilot ${issue.severity}] ${issue.title}: ${issue.description}`,
      severity
    );
    diag.source = 'CodePilot';
    diag.code = issue.category;
    diagnostics.push(diag);
  }

  collection.set(document.uri, diagnostics);
}

function showReviewWebview(
  context: vscode.ExtensionContext,
  result: ReviewResponse,
  fileName: string,
  language: string,
  isSelection: boolean
) {
  const panel = vscode.window.createWebviewPanel(
    'codepilotReview',
    `CodePilot Review: ${fileName.split('/').pop()}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CodePilot Code Review</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 16px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--vscode-widget-border, #333);
      padding-bottom: 12px;
    }
    .score-badge {
      font-size: 24px;
      font-weight: bold;
      color: var(--vscode-statusBarItem-prominentForeground, #38bdf8);
      font-family: monospace;
    }
    .stat-pills { display: flex; gap: 8px; margin: 14px 0; flex-wrap: wrap; }
    .pill {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .pill.crit { background: #7f1d1d; color: #fca5a5; }
    .pill.high { background: #7c2d12; color: #fdba74; }
    .pill.med { background: #78350f; color: #fde68a; }
    .issue-card {
      background: var(--vscode-editorWidget-background, #1e1e1e);
      border: 1px solid var(--vscode-widget-border, #333);
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .issue-top { display: flex; justify-content: space-between; align-items: center; }
    .issue-title { font-weight: 600; font-size: 13px; }
    .sev { font-size: 10px; text-transform: uppercase; font-weight: bold; padding: 2px 6px; border-radius: 4px; }
    .sev-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .sev-high { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
    .sev-medium { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
    .sev-low { background: rgba(56, 189, 248, 0.2); color: #7dd3fc; }
    .meta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
    .fix-box {
      margin-top: 8px;
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid #10b981;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 12px;
    }
    code { font-family: monospace; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin: 0;">Code Review Report</h2>
      <div class="meta">${isSelection ? 'Selected snippet' : 'Full file'} • ${escapeHtml(
    language
  )}</div>
    </div>
    <div style="text-align: right;">
      <div class="score-badge">${result.overallScore}/100</div>
      <div class="meta">Code Health Score</div>
    </div>
  </div>

  <p style="margin-top: 14px; font-size: 13px;">${escapeHtml(result.summary)}</p>

  <div class="stat-pills">
    <div class="pill crit">${result.stats.criticalCount} Critical</div>
    <div class="pill high">${result.stats.highCount} High</div>
    <div class="pill med">${result.stats.mediumCount} Medium</div>
    <div class="pill">${result.stats.suggestionCount} Suggestions</div>
  </div>

  <h3>Review Findings (${result.issues.length})</h3>

  ${result.issues
    .map(
      (iss) => `
    <div class="issue-card">
      <div class="issue-top">
        <div class="issue-title">${escapeHtml(iss.title)}</div>
        <span class="sev sev-${iss.severity.toLowerCase()}">${escapeHtml(iss.severity)}</span>
      </div>
      <div class="meta">${iss.lineNumber ? `Line ${iss.lineNumber} • ` : ''}${escapeHtml(
        iss.category
      )}</div>
      <p style="font-size: 12px; margin: 8px 0;">${escapeHtml(iss.description)}</p>
      <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 6px;">
        <strong>Root Cause:</strong> ${escapeHtml(iss.whyItIsAProblem)}
      </div>
      <div class="fix-box">
        <strong>Suggested Fix:</strong> ${escapeHtml(iss.suggestedFix)}
        ${
          iss.correctedCodeSnippet
            ? `<pre style="margin-top: 6px; overflow-x: auto;"><code>${escapeHtml(
                iss.correctedCodeSnippet
              )}</code></pre>`
            : ''
        }
      </div>
    </div>
  `
    )
    .join('')}
</body>
</html>
  `;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
