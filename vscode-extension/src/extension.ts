import * as vscode from 'vscode';
import { CodePilotApiClient } from './api';
import { CodePilotDiffProvider } from './providers/diffContentProvider';
import { CodePilotChatViewProvider } from './providers/chatViewProvider';
import { registerExplainCommand } from './commands/explain';
import { registerFixCommand } from './commands/fix';
import { registerReviewCommands } from './commands/review';
import { registerSecurityCommand } from './commands/security';
import { runOfflineSecurityScan } from './utils/localSecurity';

export function activate(context: vscode.ExtensionContext) {
  // 1. Initialize API Client
  const apiClient = new CodePilotApiClient(context.secrets);

  // 2. Initialize Diagnostics Collection for Code Review & Security Issues
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('codepilot');
  context.subscriptions.push(diagnosticCollection);

  // 3. Register Virtual Diff Document Provider
  const diffProvider = new CodePilotDiffProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      CodePilotDiffProvider.scheme,
      diffProvider
    )
  );

  // 4. Register Commands
  const explainCmd = registerExplainCommand(context, apiClient);
  const fixCmd = registerFixCommand(context, apiClient, diffProvider);
  const reviewCmds = registerReviewCommands(context, apiClient, diagnosticCollection);
  const securityCmd = registerSecurityCommand(context, diagnosticCollection);

  // 5. Open Chat Command
  const openChatCmd = vscode.commands.registerCommand('codepilot.openChat', async () => {
    await vscode.commands.executeCommand('codepilot.chatView.focus');
  });

  // 6. Set Authentication Token Command (Stored securely in VS Code SecretStorage)
  const setTokenCmd = vscode.commands.registerCommand('codepilot.setAuthToken', async () => {
    const existing = await context.secrets.get('codepilot.authToken');
    const token = await vscode.window.showInputBox({
      title: 'CodePilot: Configure Backend Auth Token',
      prompt: 'Enter optional Bearer Token for CodePilot backend authentication',
      value: existing || '',
      password: true,
      placeHolder: 'Leave blank if backend does not require authentication',
    });

    if (token !== undefined) {
      if (token.trim().length > 0) {
        await context.secrets.store('codepilot.authToken', token.trim());
        vscode.window.showInformationMessage('CodePilot: Auth token securely saved to SecretStorage.');
      } else {
        await context.secrets.delete('codepilot.authToken');
        vscode.window.showInformationMessage('CodePilot: Auth token removed.');
      }
    }
  });

  // 7. Register Chat Webview Provider in Activity Bar
  const chatProvider = new CodePilotChatViewProvider(context.extensionUri, apiClient);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CodePilotChatViewProvider.viewType,
      chatProvider,
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );

  // 8. Status Bar Item for Quick Access
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'codepilot.quickMenu';
  statusBarItem.text = '$(sparkle) CodePilot';
  statusBarItem.tooltip = 'Click for CodePilot AI & Local Security Menu';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const quickMenuCmd = vscode.commands.registerCommand('codepilot.quickMenu', async () => {
    const choice = await vscode.window.showQuickPick(
      [
        {
          label: '$(comment-discussion) CodePilot Chat',
          description: 'Open AI Coding Assistant Sidebar',
          action: 'codepilot.openChat',
        },
        {
          label: '$(question) Explain Selected Code',
          description: 'Deep architectural and ELI5 explanation',
          action: 'codepilot.explainSelectedCode',
        },
        {
          label: '$(wrench) Fix Selected Code',
          description: 'Synthesize optimizations and preview diff',
          action: 'codepilot.fixSelectedCode',
        },
        {
          label: '$(shield) Review Current File',
          description: 'Senior code review across bugs, perf, security',
          action: 'codepilot.reviewCurrentFile',
        },
        {
          label: '$(lock) Local Security Scan',
          description: '100% offline secrets and injection check',
          action: 'codepilot.securityScan',
        },
        {
          label: '$(key) Set Backend Auth Token',
          description: 'Manage SecretStorage token for backend',
          action: 'codepilot.setAuthToken',
        },
      ],
      { placeHolder: 'Select a CodePilot Action' }
    );

    if (choice) {
      vscode.commands.executeCommand(choice.action);
    }
  });

  // 9. Optional: Auto-scan for secrets on save if configured
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc: vscode.TextDocument) => {
      const config = vscode.workspace.getConfiguration('codepilot');
      if (config.get<boolean>('autoScanOnSave', false)) {
        const report = runOfflineSecurityScan(doc.getText(), doc.languageId);
        if (report.stats.secretsFound > 0) {
          vscode.window.showWarningMessage(
            `CodePilot Alert: Found ${report.stats.secretsFound} hardcoded secret(s) in ${doc.fileName.split('/').pop()}!`
          );
        }
      }
    })
  );

  context.subscriptions.push(
    explainCmd,
    fixCmd,
    ...reviewCmds,
    securityCmd,
    openChatCmd,
    setTokenCmd,
    quickMenuCmd
  );
}

export function deactivate() {}
