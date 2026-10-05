import React, { useState } from 'react';
import {
  X,
  Download,
  Terminal,
  KeyRound,
  Check,
  Copy,
  ExternalLink,
  Laptop,
  Sparkles,
  ShieldCheck,
  Wand2,
  HelpCircle,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface VsCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VsCodeModal: React.FC<VsCodeModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#15161f] border border-[#2b2d3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#282a38] flex items-center justify-between bg-[#121319]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">CodePilot for VS Code</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-semibold">
                  v1.0.0 VSIX
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Install the official extension directly in your local desktop Visual Studio Code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#232533] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Download Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Ready-to-Install VSIX Package</span>
              </h3>
              <p className="text-xs text-zinc-300">
                Pre-packaged extension with Gemini AI chat, diff preview fixes, and offline local security.
              </p>
            </div>

            <a
              href="/api/vscode/download"
              download="codepilot-1.0.0.vsix"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .VSIX</span>
            </a>
          </div>

          {/* Installation Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Quick Installation (2 Steps)
            </h4>

            {/* Step 1: CLI install */}
            <div className="p-3.5 rounded-xl bg-[#191a24] border border-[#272938] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">
                  Option A: Install via VS Code Terminal
                </span>
                <button
                  onClick={() => handleCopy('code --install-extension codepilot-1.0.0.vsix', 'step1')}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                >
                  {copiedCmd === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'step1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2 rounded bg-[#111218] border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center justify-between">
                <code>code --install-extension codepilot-1.0.0.vsix</code>
              </div>
            </div>

            {/* Step 2: GUI install */}
            <div className="p-3.5 rounded-xl bg-[#191a24] border border-[#272938] space-y-1.5 text-xs text-zinc-300">
              <span className="font-semibold text-zinc-200">
                Option B: Install via Command Palette
              </span>
              <p className="text-[11px] text-zinc-400">
                In VS Code, press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono">Ctrl+Shift+P</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono">Cmd+Shift+P</kbd>) &rarr; select <strong>Extensions: Install from VSIX...</strong> &rarr; pick the downloaded file.
              </p>
            </div>
          </div>

          {/* Config & Backend URL */}
          <div className="p-4 rounded-xl bg-[#181923] border border-[#272938] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Backend Configuration
            </h4>
            <p className="text-xs text-zinc-300">
              In your VS Code settings (<kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono">Ctrl+,</kbd>), configure your backend URL:
            </p>
            <div className="p-2.5 rounded bg-[#111218] border border-zinc-800 font-mono text-xs flex items-center justify-between">
              <span className="text-cyan-400">"codepilot.backendUrl": "{currentOrigin}"</span>
              <button
                onClick={() => handleCopy(currentOrigin, 'url')}
                className="text-zinc-400 hover:text-white"
              >
                {copiedCmd === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Command Cheat-Sheet */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Command Palette Shortcuts
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#191a24] border border-[#272938] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Explain Selected Code</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Ctrl+Alt+E
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#191a24] border border-[#272938] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fix Selected Code (Diff)</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Ctrl+Alt+F
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#191a24] border border-[#272938] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Review Selected Code</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Ctrl+Alt+R
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#191a24] border border-[#272938] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Local Security Scan (Offline)</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Ctrl+Alt+S
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#191a24] border border-[#272938] flex items-center justify-between md:col-span-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open CodePilot Chat in Sidebar</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Ctrl+Alt+C
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-[#282a38] bg-[#121319] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Compatible with VS Code 1.85+ and Cursor IDE</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
