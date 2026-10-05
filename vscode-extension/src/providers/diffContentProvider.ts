/**
 * Virtual Document Provider for VS Code Diff View
 * Enables showing side-by-side Diff Preview without modifying physical files on disk.
 */

import * as vscode from 'vscode';

export class CodePilotDiffProvider implements vscode.TextDocumentContentProvider {
  static readonly scheme = 'codepilot-diff';

  private contentMap = new Map<string, string>();
  private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  setDocumentContent(uri: vscode.Uri, content: string): void {
    this.contentMap.set(uri.toString(), content);
    this.onDidChangeEmitter.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contentMap.get(uri.toString()) || '// No proposed fix available';
  }

  clear(uri: vscode.Uri): void {
    this.contentMap.delete(uri.toString());
  }
}
