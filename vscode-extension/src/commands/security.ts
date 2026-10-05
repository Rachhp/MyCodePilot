import * as vscode from 'vscode';
import { runOfflineSecurityScan } from '../utils/localSecurity';
import { LocalSecurityReport, LocalSecurityIssue } from '../types';

export function registerSecurityCommand(
  context: vscode.ExtensionContext,
  diagnosticCollection: vscode.DiagnosticCollection
) {
  return vscode.commands.registerCommand('codepilot.securityScan', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('CodePilot: Open a file to run a security scan.');
      return;
    }

    const document = editor.document;
    const code = document.getText();

    if (!code || code.trim().length === 0) {
      vscode.window.showInformationMessage('CodePilot: Current file is empty.');
      return;
    }

    // 100% OFFLINE SCAN — No API call, zero network traffic
    const report = runOfflineSecurityScan(code, document.languageId);

    // Update VS Code Diagnostics
    updateSecurityDiagnostics(diagnosticCollection, document, report.issues);

    // Show summary notification
    const totalFound = report.issues.length;
    if (totalFound === 0) {
      vscode.window.showInformationMessage(
        'CodePilot Local Security: No vulnerabilities or exposed secrets detected (100% offline analysis).'
      );
    } else {
      vscode.window.showWarningMessage(
        `CodePilot Local Security: Found ${totalFound} issue(s) [${report.stats.secretsFound} secrets]. Source code was NOT sent to Gemini.`,
        'Open Security Report'
      ).then((selection: string | undefined) => {
        if (selection === 'Open Security Report') {
          showSecurityWebview(context, report, document.fileName, document.languageId);
        }
      });
    }

    showSecurityWebview(context, report, document.fileName, document.languageId);
  });
}

function updateSecurityDiagnostics(
  collection: vscode.DiagnosticCollection,
  document: vscode.TextDocument,
  issues: LocalSecurityIssue[]
) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const issue of issues) {
    const lineIndex = Math.max(0, issue.lineNumber - 1);
    const line = lineIndex < document.lineCount ? document.lineAt(lineIndex) : null;
    const range = line ? line.range : new vscode.Range(0, 0, 0, 10);

    let severity = vscode.DiagnosticSeverity.Warning;
    if (issue.severity === 'Critical') severity = vscode.DiagnosticSeverity.Error;
    else if (issue.severity === 'High') severity = vscode.DiagnosticSeverity.Error;

    const diag = new vscode.Diagnostic(
      range,
      `[CodePilot Local Security] ${issue.title}: ${issue.description} (${issue.cwe || 'Offline Heuristic'})`,
      severity
    );
    diag.source = 'CodePilot (Offline)';
    diag.code = issue.cwe || issue.id;
    diagnostics.push(diag);
  }

  collection.set(document.uri, diagnostics);
}

function showSecurityWebview(
  context: vscode.ExtensionContext,
  report: LocalSecurityReport,
  fileName: string,
  language: string
) {
  const panel = vscode.window.createWebviewPanel(
    'codepilotLocalSecurity',
    `CodePilot Security: ${fileName.split('/').pop()}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Local Security Analysis</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 16px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      line-height: 1.5;
    }
    .privacy-banner {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .privacy-title { font-weight: bold; color: #10b981; font-size: 13px; }
    .privacy-desc { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
    .score-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--vscode-editorWidget-background, #1e1e1e);
      border: 1px solid var(--vscode-widget-border, #333);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .score-num { font-size: 26px; font-weight: bold; font-family: monospace; color: #34d399; }
    .stat-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .pill {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .pill-red { background: #7f1d1d; color: #fca5a5; }
    .pill-orange { background: #7c2d12; color: #fdba74; }
    .pill-amber { background: #78350f; color: #fde68a; }
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
    .meta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
    .snippet {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 8px 10px;
      font-family: monospace;
      font-size: 11px;
      color: #f87171;
      margin: 8px 0;
      overflow-x: auto;
    }
    .rem-box {
      background: rgba(59, 130, 246, 0.08);
      border-left: 3px solid #3b82f6;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <!-- Prominent Local Analysis Guarantee -->
  <div class="privacy-banner">
    <div>
      <div class="privacy-title">⚡ Local Analysis — Source code was not sent to the AI service.</div>
      <div class="privacy-desc">Scanned 100% offline in-memory using deterministic security heuristics and secrets patterns. Zero network traffic.</div>
    </div>
  </div>

  <div class="score-card">
    <div>
      <h2 style="margin: 0;">Local Security Score</h2>
      <div class="meta">${escapeHtml(fileName.split('/').pop() || '')} • ${escapeHtml(language)}</div>
    </div>
    <div style="text-align: right;">
      <div class="score-num">${report.overallScore}/100</div>
      <div class="meta">${report.overallScore >= 80 ? 'Healthy' : report.overallScore >= 50 ? 'Needs Attention' : 'Vulnerable'}</div>
    </div>
  </div>

  <div class="stat-row">
    <div class="pill pill-red">${report.stats.criticalCount} Critical</div>
    <div class="pill pill-orange">${report.stats.highCount} High</div>
    <div class="pill pill-amber">${report.stats.secretsFound} Secrets Leaked</div>
    <div class="pill">${report.stats.vulnerabilitiesFound} Vulnerabilities</div>
  </div>

  <h3>Findings (${report.issues.length})</h3>

  ${
    report.issues.length === 0
      ? '<p style="color: #34d399; font-weight: 500;">✓ No hardcoded secrets, injection flaws, or insecure functions detected.</p>'
      : report.issues
          .map(
            (iss) => `
    <div class="issue-card">
      <div class="issue-top">
        <div class="issue-title">${escapeHtml(iss.title)}</div>
        <span class="sev sev-${iss.severity.toLowerCase()}">${escapeHtml(iss.severity)}</span>
      </div>
      <div class="meta">Line ${iss.lineNumber} • ${escapeHtml(iss.category)}${
              iss.cwe ? ` • ${escapeHtml(iss.cwe)}` : ''
            }</div>
      <div class="snippet">Line ${iss.lineNumber}: ${escapeHtml(iss.matchedText)}</div>
      <p style="font-size: 12px; margin: 6px 0;">${escapeHtml(iss.description)}</p>
      <div class="rem-box">
        <strong>Remediation:</strong> ${escapeHtml(iss.remediation)}
      </div>
    </div>
  `
          )
          .join('')
  }
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
