import * as vscode from 'vscode';
import { CodePilotApiClient } from '../api';

export class CodePilotChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codepilot.chatView';

  private _view?: vscode.WebviewView;
  private messages: Array<{ role: string; content: string }> = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly apiClient: CodePilotApiClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages sent from the webview to the extension
    webviewView.webview.onDidReceiveMessage(async (data: any) => {
      switch (data.type) {
        case 'sendMessage': {
          await this._handleUserMessage(data.text);
          break;
        }
        case 'clearChat': {
          this.messages = [];
          this._view?.webview.postMessage({ type: 'chatCleared' });
          break;
        }
        case 'applyToEditor': {
          await this._applyCodeToEditor(data.code);
          break;
        }
      }
    });
  }

  private async _handleUserMessage(text: string) {
    if (!text || text.trim().length === 0) return;

    // Get current selection or file context from active editor
    const editor = vscode.window.activeTextEditor;
    let selectedCode: string | undefined = undefined;
    let fileContent: string | undefined = undefined;
    let languageId: string | undefined = undefined;

    if (editor) {
      languageId = editor.document.languageId;
      const selection = editor.selection;
      if (!selection.isEmpty) {
        selectedCode = editor.document.getText(selection);
      }
      fileContent = editor.document.getText();
    }

    const userMessage = { role: 'user', content: text };
    this.messages.push(userMessage);

    // Post message to webview so user sees their message immediately
    this._view?.webview.postMessage({
      type: 'addMessage',
      message: {
        role: 'user',
        content: text,
        hasSelection: Boolean(selectedCode),
      },
    });

    this._view?.webview.postMessage({ type: 'setLoading', isLoading: true });

    try {
      const response = await this.apiClient.chat(
        this.messages,
        fileContent,
        languageId,
        selectedCode
      );

      const assistantMessage = { role: 'assistant', content: response.reply };
      this.messages.push(assistantMessage);

      this._view?.webview.postMessage({
        type: 'addMessage',
        message: assistantMessage,
      });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'addMessage',
        message: {
          role: 'assistant',
          content: `⚠️ **Error communicating with CodePilot:** ${err.message || 'Please check your connection and configuration.'}`,
        },
      });
    } finally {
      this._view?.webview.postMessage({ type: 'setLoading', isLoading: false });
    }
  }

  private async _applyCodeToEditor(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('CodePilot: No active editor open to apply code.');
      return;
    }

    const selection = editor.selection;
    const targetRange = selection.isEmpty
      ? new vscode.Range(0, 0, editor.document.lineCount, 0)
      : selection;

    await editor.edit((editBuilder: vscode.TextEditorEdit) => {
      editBuilder.replace(targetRange, code);
    });

    vscode.window.showInformationMessage('CodePilot: Applied code to editor.');
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodePilot Chat</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 10px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background, #181818);
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-widget-border, #333);
      font-size: 11px;
    }
    .clear-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-size: 11px;
    }
    .clear-btn:hover { color: var(--vscode-foreground); text-decoration: underline; }
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .msg {
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.45;
      word-break: break-word;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--vscode-button-background, #007acc);
      color: var(--vscode-button-foreground, #ffffff);
      max-width: 90%;
    }
    .msg.assistant {
      align-self: flex-start;
      background: var(--vscode-editorWidget-background, #252526);
      border: 1px solid var(--vscode-widget-border, #333);
      max-width: 98%;
    }
    .quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      padding: 8px 0;
      border-top: 1px solid var(--vscode-widget-border, #333);
    }
    .pill {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ffffff);
      border: none;
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .pill:hover { opacity: 0.85; }
    .input-row {
      display: flex;
      gap: 6px;
      padding-top: 6px;
    }
    textarea {
      flex: 1;
      background: var(--vscode-input-background, #1e1e1e);
      color: var(--vscode-input-foreground, #ccc);
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 12px;
      resize: none;
      height: 54px;
      font-family: inherit;
      outline: none;
    }
    textarea:focus { border-color: var(--vscode-focusBorder, #007acc); }
    .send-btn {
      background: var(--vscode-button-background, #007acc);
      color: var(--vscode-button-foreground, #fff);
      border: none;
      border-radius: 4px;
      padding: 0 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    pre {
      background: #0d1117;
      padding: 8px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 11px;
      position: relative;
    }
    .code-action {
      margin-top: 4px;
      background: #238636;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10px;
      cursor: pointer;
    }
    .loading-dots { font-style: italic; color: var(--vscode-descriptionForeground); font-size: 11px; }
  </style>
</head>
<body>
  <div class="chat-header">
    <span>✨ CodePilot Gemini AI</span>
    <button class="clear-btn" id="clearBtn">Clear</button>
  </div>

  <div class="messages-container" id="messagesContainer">
    <div class="msg assistant">
      👋 Hi! I'm CodePilot. Select any code in your editor and ask me to explain, optimize, write tests, or find security bugs.
    </div>
  </div>

  <!-- Quick Prompts from Requirements -->
  <div class="quick-prompts">
    <button class="pill" data-prompt="Explain this function">Explain this function</button>
    <button class="pill" data-prompt="Why is this code failing?">Why is this code failing?</button>
    <button class="pill" data-prompt="How can I optimize this?">How can I optimize this?</button>
    <button class="pill" data-prompt="Find security vulnerabilities">Find security vulnerabilities</button>
    <button class="pill" data-prompt="Write tests for this function">Write tests for this function</button>
    <button class="pill" data-prompt="Refactor this code">Refactor this code</button>
    <button class="pill" data-prompt="Convert this code to another language">Convert to another language</button>
  </div>

  <div id="loadingIndicator" style="display: none;" class="loading-dots">
    Thinking with Gemini 3.8 Flash...
  </div>

  <div class="input-row">
    <textarea id="chatInput" placeholder="Ask CodePilot anything... (Enter to send)"></textarea>
    <button class="send-btn" id="sendBtn">Send</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    function sendCurrentInput() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      vscode.postMessage({ type: 'sendMessage', text });
    }

    sendBtn.addEventListener('click', sendCurrentInput);

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCurrentInput();
      }
    });

    clearBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'clearChat' });
    });

    document.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          vscode.postMessage({ type: 'sendMessage', text: prompt });
        }
      });
    });

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data.type === 'addMessage') {
        const div = document.createElement('div');
        div.className = 'msg ' + data.message.role;
        
        let content = data.message.content;
        
        // Simple code block extraction
        const codeBlockRegex = /\`\`\`([a-zA-Z0-9]*)\\n([\\s\\S]*?)\`\`\`/g;
        let match;
        let hasCode = false;
        let lastCode = '';

        content = content.replace(codeBlockRegex, (m, lang, code) => {
          hasCode = true;
          lastCode = code;
          return '<pre><code>' + escapeHtml(code) + '</code><br><button class="code-action" onclick="applyCode(' + JSON.stringify(code) + ')">Apply to Editor</button></pre>';
        });

        // Basic bold & markdown
        content = content.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
        content = content.replace(/\\*(.*?)\\*/g, '<em>$1</em>');
        content = content.replace(/\\n/g, '<br>');

        div.innerHTML = content;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else if (data.type === 'setLoading') {
        loadingIndicator.style.display = data.isLoading ? 'block' : 'none';
        sendBtn.disabled = data.isLoading;
        if (data.isLoading) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      } else if (data.type === 'chatCleared') {
        messagesContainer.innerHTML = '<div class="msg assistant">Chat cleared. Ready for your next coding question!</div>';
      }
    });

    window.applyCode = function(code) {
      vscode.postMessage({ type: 'applyToEditor', code });
    };

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  </script>
</body>
</html>
    `;
  }
}
