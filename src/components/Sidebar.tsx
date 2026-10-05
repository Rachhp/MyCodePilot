import React, { useState } from 'react';
import {
  Files,
  FileCode,
  ShieldCheck,
  Settings,
  Plus,
  Trash2,
  AlertCircle,
  Lock,
  Flame,
  CheckCircle2,
  Bug,
  Sliders,
  ChevronRight,
  Code2,
  ShieldAlert,
} from 'lucide-react';
import { ProjectFile, SupportedLanguage, EditorSettings, ReviewResult } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';

interface SidebarProps {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onNewFile: () => void;
  onDeleteFile: (fileId: string) => void;
  reviewResult: ReviewResult | null;
  onTriggerReview: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  onTriggerSecurityScan: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
  reviewResult,
  onTriggerReview,
  settings,
  onUpdateSettings,
  onTriggerSecurityScan,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'review' | 'security' | 'settings'>('files');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-full bg-[#121317] border-r border-[#272832] select-none">
      {/* Activity Bar (Slim leftmost strip like VS Code) */}
      <div className="w-12 bg-[#101115] border-r border-[#22232c] flex flex-col items-center py-3 justify-between">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'files' && !isCollapsed) {
                setIsCollapsed(true);
              } else {
                setActiveTab('files');
                setIsCollapsed(false);
              }
            }}
            title="Explorer (Files)"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'files' && !isCollapsed
                ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <Files className="w-5 h-5" />
            {activeTab === 'files' && !isCollapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-r" />
            )}
          </button>

          <button
            onClick={() => {
              if (activeTab === 'review' && !isCollapsed) {
                setIsCollapsed(true);
              } else {
                setActiveTab('review');
                setIsCollapsed(false);
              }
            }}
            title="Code Review Results"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'review' && !isCollapsed
                ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            {reviewResult && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => {
              if (activeTab === 'security' && !isCollapsed) {
                setIsCollapsed(true);
              } else {
                setActiveTab('security');
                setIsCollapsed(false);
              }
            }}
            title="Security & Vulnerability Hub"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'security' && !isCollapsed
                ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>

        <div>
          <button
            onClick={() => {
              if (activeTab === 'settings' && !isCollapsed) {
                setIsCollapsed(true);
              } else {
                setActiveTab('settings');
                setIsCollapsed(false);
              }
            }}
            title="Editor Settings"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings' && !isCollapsed
                ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Sidebar Drawer */}
      {!isCollapsed && (
        <div className="w-60 bg-[#14151a] flex flex-col justify-between overflow-hidden">
          {/* Top of Sidebar Pane */}
          <div className="flex-1 overflow-y-auto">
            {/* FILES VIEW */}
            {activeTab === 'files' && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Explorer / Workspace
                  </span>
                  <button
                    onClick={onNewFile}
                    title="Create new file"
                    className="p-1 rounded hover:bg-[#222432] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {files.map((file) => {
                    const isActive = file.id === activeFileId;
                    return (
                      <div
                        key={file.id}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/20 text-cyan-300 font-medium border border-indigo-500/30'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1c1d27]'
                        }`}
                        onClick={() => onSelectFile(file.id)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                          <span className="truncate">{file.name}</span>
                        </div>

                        {files.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(file.id);
                            }}
                            title="Delete file"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/40 hover:text-rose-400 text-zinc-500 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Preloaded Sample Files by Language */}
                <div className="pt-3 border-t border-[#22232c] space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
                    Sample Playground Files
                  </span>
                  <div className="space-y-0.5">
                    {SUPPORTED_LANGUAGES.slice(0, 7).map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          const existing = files.find((f) => f.language === l.id);
                          if (existing) {
                            onSelectFile(existing.id);
                          } else {
                            // Switch to this language
                            onSelectFile(files[0].id);
                          }
                        }}
                        className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b24] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{l.name}</span>
                        <span className="font-mono text-[10px] text-zinc-600">.{l.extension}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REVIEW VIEW */}
            {activeTab === 'review' && (
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Review Summary
                  </span>
                </div>

                {reviewResult ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#191a24] border border-[#272938] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Code Health:</span>
                        <span className="font-bold text-cyan-400 font-mono">
                          {reviewResult.overallScore} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${reviewResult.overallScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center px-2 py-1 rounded bg-red-950/20 text-red-300">
                        <span>Critical Issues</span>
                        <span className="font-mono font-bold">{reviewResult.stats.criticalCount}</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-1 rounded bg-orange-950/20 text-orange-300">
                        <span>High Priority</span>
                        <span className="font-mono font-bold">{reviewResult.stats.highCount}</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-1 rounded bg-amber-950/20 text-amber-300">
                        <span>Medium Priority</span>
                        <span className="font-mono font-bold">{reviewResult.stats.mediumCount}</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-1 rounded bg-emerald-950/20 text-emerald-300">
                        <span>Suggestions</span>
                        <span className="font-mono font-bold">{reviewResult.stats.suggestionCount}</span>
                      </div>
                    </div>

                    <button
                      onClick={onTriggerReview}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md"
                    >
                      Re-run Code Review
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3 px-2">
                    <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400">
                      No code reviews recorded yet. Run a review on your current file to view results.
                    </p>
                    <button
                      onClick={onTriggerReview}
                      className="w-full py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-medium text-xs transition-colors cursor-pointer"
                    >
                      Audit Code Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECURITY VIEW */}
            {activeTab === 'security' && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Security Vulnerability Hub
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#191a24] border border-[#272938] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Lock className="w-4 h-4" />
                    <span>Security Scanner</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Detects injection flaws (SQLi/XSS), buffer overflows, race conditions, memory leaks, and weak cryptography.
                  </p>
                  <button
                    onClick={onTriggerSecurityScan}
                    className="w-full py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-medium text-xs transition-colors cursor-pointer"
                  >
                    Scan For Vulnerabilities
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-semibold uppercase text-zinc-500 px-1">
                    Coverage Checklist
                  </span>
                  <div className="text-[11px] space-y-1 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>OWASP Top 10 Flaws</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Memory Safety & Leaks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cryptographic Weaknesses</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Concurrent Race Hazards</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div className="p-3 space-y-4 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1 block">
                  Editor Settings
                </span>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400">Font Size: {settings.fontSize}px</label>
                  <div className="flex gap-1.5">
                    {[12, 14, 16, 18].map((size) => (
                      <button
                        key={size}
                        onClick={() => onUpdateSettings({ fontSize: size })}
                        className={`flex-1 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          settings.fontSize === size
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-[#1b1c26] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Size */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400">Tab Size (Spaces):</label>
                  <div className="flex gap-1.5">
                    {[2, 4].map((size) => (
                      <button
                        key={size}
                        onClick={() => onUpdateSettings({ tabSize: size })}
                        className={`flex-1 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          settings.tabSize === size
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-[#1b1c26] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {size} Spaces
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Numbers Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[#22232c]">
                  <span className="text-zinc-300">Line Numbers</span>
                  <input
                    type="checkbox"
                    checked={settings.showLineNumbers}
                    onChange={(e) => onUpdateSettings({ showLineNumbers: e.target.checked })}
                    className="accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Info about Gemini */}
                <div className="pt-3 border-t border-[#22232c] text-[10px] text-zinc-500 space-y-1">
                  <p>AI Engine: Gemini 3.8 Flash</p>
                  <p>Environment: Google AI Studio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
