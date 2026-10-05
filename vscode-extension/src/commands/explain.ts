import * as vscode from 'vscode';
import { CodePilotApiClient } from '../api';
import { ExplanationResponse } from '../types';

export function registerExplainCommand(context: vscode.ExtensionContext, apiClient: CodePilotApiClient) {
  return vscode.commands.registerCommand('codepilot.explainSelectedCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('CodePilot: Open a file and select code to explain.');
      return;
    }

    const selection = editor.selection;
    let selectedText = editor.document.getText(selection);

    if (!selectedText || selectedText.trim().length === 0) {
      // If nothing selected, prompt if developer wants to explain current function or file
      const choice = await vscode.window.showQuickPick(
        ['Explain Entire File', 'Cancel'],
        { placeHolder: 'No code selected. Would you like to explain the whole file?' }
      );
      if (choice === 'Explain Entire File') {
        selectedText = editor.document.getText();
      } else {
        return;
      }
    }

    const language = editor.document.languageId;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'CodePilot: Explaining code with Gemini AI...',
        cancellable: false,
      },
      async () => {
        try {
          const result = await apiClient.explainCode(selectedText, language);
          showExplanationWebview(context, result, language, selectedText);
        } catch (err: any) {
          vscode.window.showErrorMessage(`CodePilot Error: ${err.message || 'Failed to explain code.'}`);
        }
      }
    );
  });
}

function showExplanationWebview(
  context: vscode.ExtensionContext,
  result: ExplanationResponse,
  language: string,
  sourceCode: string
) {
  const panel = vscode.window.createWebviewPanel(
    'codepilotExplanation',
    `CodePilot: ${result.title || 'Code Explanation'}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(result.title)}</title>
  <style>
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      padding: 18px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      line-height: 1.5;
    }
    h1, h2, h3 { color: var(--vscode-editor-foreground); font-weight: 600; margin-top: 20px; }
    h1 { font-size: 1.3rem; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 8px; margin-top: 0; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 4px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      text-transform: uppercase;
      margin-left: 8px;
    }
    .card {
      background: var(--vscode-editorWidget-background, #1e1e1e);
      border: 1px solid var(--vscode-widget-border, #333);
      border-radius: 8px;
      padding: 14px;
      margin: 14px 0;
    }
    .eli5 {
      border-left: 4px solid var(--vscode-textLink-foreground, #3794ff);
      background: var(--vscode-textBlockQuote-background, rgba(55, 148, 255, 0.08));
    }
    .problem {
      border-left: 4px solid var(--vscode-errorForeground, #f14c4c);
      background: rgba(241, 76, 76, 0.08);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid var(--vscode-widget-border, #333);
      padding: 6px 10px;
      text-align: left;
    }
    th { background: var(--vscode-list-hoverBackground); }
    code { font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; }
    ol { padding-left: 20px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(result.title)} <span class="badge">${escapeHtml(language)}</span></h1>
  
  <p>${escapeHtml(result.overview)}</p>

  <div class="card eli5">
    <h3>💡 Beginner Explanation (ELI5)</h3>
    <p>${escapeHtml(result.simpleExplanationForBeginners)}</p>
  </div>

  <h2>Components Breakdown</h2>
  <table>
    <thead><tr><th>Name</th><th>Type</th><th>Purpose</th></tr></thead>
    <tbody>
      ${result.importantComponents
        .map(
          (c) =>
            `<tr><td><code>${escapeHtml(c.name)}</code></td><td>${escapeHtml(
              c.type
            )}</td><td>${escapeHtml(c.purpose)}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>Data Contracts</h2>
  <table>
    <thead><tr><th>Input / Output</th><th>Type</th><th>Description</th></tr></thead>
    <tbody>
      ${result.inputsAndOutputs.inputs
        .map(
          (i) =>
            `<tr><td><strong>Input:</strong> <code>${escapeHtml(
              i.name
            )}</code></td><td><code>${escapeHtml(i.type)}</code></td><td>${escapeHtml(
              i.description
            )}</td></tr>`
        )
        .join('')}
      ${result.inputsAndOutputs.outputs
        .map(
          (o) =>
            `<tr><td><strong>Output</strong></td><td><code>${escapeHtml(
              o.type
            )}</code></td><td>${escapeHtml(o.description)}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>

  ${
    result.potentialProblems && result.potentialProblems.length > 0
      ? `
  <div class="card problem">
    <h3>⚠️ Potential Edge Cases & Limits</h3>
    <ul>
      ${result.potentialProblems.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
    </ul>
  </div>`
      : ''
  }

  <h2>Step-by-Step Execution Flow</h2>
  <ol>
    ${result.stepByStepFlow.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
  </ol>
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
