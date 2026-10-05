# CodePilot — VS Code Extension

Official Visual Studio Code extension for **CodePilot**: AI-powered code explanation, automated diff fixes, comprehensive senior reviews, and **100% offline local security analysis**.

---

## Features

- **⚡ Explain Selected Code (`Ctrl+Alt+E` / `Cmd+Alt+E`)**: Generates an architectural breakdown, data contracts table, potential runtime problems, and a beginner-friendly (ELI5) analogy for highlighted code.
- **✨ Fix Selected Code (`Ctrl+Alt+F` / `Cmd+Alt+F`)**: Synthesizes bug fixes, modern idioms, and performance gains. Opens an interactive **VS Code Diff Preview** (`Original ↔ Proposed Fix`) allowing you to Accept or Reject changes before applying.
- **🛡️ Review Code (`Ctrl+Alt+R` / `Cmd+Alt+R`)**: Audits selected snippets or full files across Bugs, Security, Performance, and Code Smells. Integrates directly into VS Code's Problems panel (Diagnostics).
- **🔒 Local Security Scan (`Ctrl+Alt+S` / `Cmd+Alt+S`)**: **100% offline scanner**. Scans for hardcoded secrets (AWS, GitHub, Stripe, Private Keys, Passwords), SQL injections, and dangerous sinks without sending a single byte of source code over the network.
- **💬 CodePilot Chat (`Ctrl+Alt+C` / `Cmd+Alt+C`)**: Dedicated sidebar panel with quick-prompt pills ("Explain this function", "Write tests", "Why is this code failing?", etc.) automatically seeded with the current editor's active selection.

---

## Requirements

The extension communicates with the CodePilot backend service. You can run the backend locally or point to a remote deployment URL.

---

## 1. How to Install Dependencies

From the repository root, navigate to the `vscode-extension` directory:

```bash
cd vscode-extension
npm install
```

---

## 2. How to Build the Extension

To compile the TypeScript source files to JavaScript:

```bash
npm run build
```

Or for development with automatic recompilation on file changes:

```bash
npm run watch
```

---

## 3. How to Create a VSIX Package

To package the extension into an installable `.vsix` file using `@vscode/vsce`:

```bash
# Install vsce globally (or run via npx)
npx @vscode/vsce package
```

This generates `codepilot-1.0.0.vsix` in the `vscode-extension` directory.

---

## 4. How to Install the VSIX in VS Code

### Method A: Via VS Code Command Palette
1. Open Visual Studio Code.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
3. Type and select **Extensions: Install from VSIX...**.
4. Choose the `codepilot-1.0.0.vsix` file.

### Method B: Via Terminal / CLI
```bash
code --install-extension codepilot-1.0.0.vsix
```

### Method C: Debugging Directly in VS Code
1. Open the `/vscode-extension` folder in VS Code.
2. Press `F5` to start a new **Extension Development Host** window with CodePilot running live.

---

## 5. How to Configure the CodePilot Backend URL

By default, the extension connects to `http://localhost:3000`. To point to a custom or production deployment:

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`).
2. Search for `codepilot.backendUrl`.
3. Set your backend URL:
   - Local: `http://localhost:3000`
   - Remote: `https://your-deployment-url.run.app`

Or add it directly to your `.vscode/settings.json`:

```json
{
  "codepilot.backendUrl": "http://localhost:3000",
  "codepilot.enableInlineDiagnostics": true,
  "codepilot.autoScanOnSave": false
}
```

---

## 6. How Authentication Works

CodePilot uses a zero-trust model:
- **No Gemini API Key in the Extension**: The Gemini API key remains strictly on the CodePilot server and is never embedded in or accessible to the VS Code client.
- **VS Code SecretStorage**: Optional backend authentication tokens are stored in the operating system's credential vault via VS Code's `SecretStorage` API.
- **Configuring the Token**:
  1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
  2. Run `CodePilot: Set Backend Auth Token`.
  3. Enter your secret bearer token. The extension will automatically attach `Authorization: Bearer <token>` to all AI endpoint requests.

---

## 7. Supported Programming Languages

Automatic language detection for all 13 supported languages:

- JavaScript (`.js`)
- TypeScript (`.ts`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- C++ (`.cpp`, `.cc`, `.h`)
- C# (`.cs`)
- Go (`.go`)
- Rust (`.rs`)
- PHP (`.php`)
- SQL (`.sql`)
- HTML (`.html`)
- CSS (`.css`)
- JSON (`.json`)

---

## 8. Example Usage Workflows

### 🔍 Explaining Selected Code
1. Open any file in VS Code.
2. Highlight a complex function or algorithm.
3. Press `Ctrl+Alt+E` (or right-click → `CodePilot: Explain Selected Code`).
4. An interactive panel opens with an overview, data contracts, and beginner ELI5 explanation.

### 🛠️ Fixing & Refactoring with Side-by-Side Diff
1. Highlight buggy or unoptimized code.
2. Press `Ctrl+Alt+F` (or right-click → `CodePilot: Fix Selected Code`).
3. VS Code opens a native **Diff Editor** showing deletions in red and additions in green.
4. Click **Accept Fix** to apply changes or **Reject Fix** to preserve your original code.

### 🔒 100% Offline Security Scan
1. Open any project file.
2. Press `Ctrl+Alt+S` (or run `CodePilot: Security Scan`).
3. The local scanner analyzes code for AWS/GitHub/Stripe keys, SQL injection, and XSS.
4. **Zero network calls are made. Source code is never sent to Gemini.**
5. Results appear in the Problems panel and the Security Report panel.
