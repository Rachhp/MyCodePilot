import React, { useState } from 'react';
import {
  Files,
  FileCode,
  ShieldCheck,
  Settings,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  WifiOff,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Github,
} from 'lucide-react';
import { ProjectFile, EditorSettings, ReviewResult } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { LocalSecurityReport } from '../utils/localSecurityScanner';

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
  localSecurityReport: LocalSecurityReport | null;
  onTriggerLocalSecurityScan: () => void;
  onOpenLocalSecurityModal: () => void;
  onJumpToLine?: (line: number) => void;
  currentView?: 'editor' | 'github';
  onViewChange?: (view: 'editor' | 'github') => void;
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
  localSecurityReport,
  onTriggerLocalSecurityScan,
  onOpenLocalSecurityModal,
  onJumpToLine,
  currentView = 'editor',
  onViewChange,
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
              onViewChange?.('editor');
              if (activeTab === 'files' && !isCollapsed && currentView === 'editor') {
                setIsCollapsed(true);
              } else {
                setActiveTab('files');
                setIsCollapsed(false);
              }
            }}
            title="Explorer (Files)"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'files' && !isCollapsed && currentView === 'editor'
                ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <Files className="w-5 h-5" />
            {activeTab === 'files' && !isCollapsed && currentView === 'editor' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-r" />
            )}
          </button>

          <button
            onClick={() => {
              onViewChange?.('editor');
              if (activeTab === 'review' && !isCollapsed && currentView === 'editor') {
                setIsCollapsed(true);
              } else {
                setActiveTab('review');
                setIsCollapsed(false);
              }
            }}
            title="AI Code Review"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'review' && !isCollapsed && currentView === 'editor'
                ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            {reviewResult && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => {
              onViewChange?.('editor');
              if (activeTab === 'security' && !isCollapsed && currentView === 'editor') {
                setIsCollapsed(true);
              } else {
                setActiveTab('security');
                setIsCollapsed(false);
              }
            }}
            title="Local Security Analysis (Offline)"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'security' && !isCollapsed && currentView === 'editor'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <Lock className="w-5 h-5" />
            {localSecurityReport && localSecurityReport.issues.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* GitHub Integration Navigation Item */}
          <button
            onClick={() => {
              onViewChange?.('github');
            }}
            title="GitHub Integration & PR Reviews"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer relative ${
              currentView === 'github'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-600/10'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1b24]'
            }`}
          >
            <Github className="w-5 h-5" />
            {currentView === 'github' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple-400 rounded-r" />
            )}
          </button>
        </div>

        <div>
          <button
            onClick={() => {
              onViewChange?.('editor');
              if (activeTab === 'settings' && !isCollapsed && currentView === 'editor') {
                setIsCollapsed(true);
              } else {
                setActiveTab('settings');
                setIsCollapsed(false);
              }
            }}
            title="Editor Settings"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings' && !isCollapsed && currentView === 'editor'
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
        <div className="w-64 bg-[#14151a] flex flex-col justify-between overflow-hidden">
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
                    AI Review Summary
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
                      Re-run AI Review
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
                      Audit Code with AI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LOCAL SECURITY VIEW (100% Offline / Zero Telemetry) */}
            {activeTab === 'security' && (
              <div className="p-3 space-y-3.5">
                {/* Header with clear offline label */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Local Analysis</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                    Offline
                  </span>
                </div>

                {/* Privacy Badge */}
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200/90 leading-tight">
                  <div className="flex items-center gap-1 font-semibold text-emerald-300 mb-0.5">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Zero Data Sent</span>
                  </div>
                  <span>Scanned 100% in-browser. Source code is never sent to Gemini or any external server.</span>
                </div>

                {/* Score & Trigger Card */}
                {localSecurityReport ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#191a24] border border-[#272938] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Local Security Score:</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            localSecurityReport.overallScore >= 80
                              ? 'text-emerald-400'
                              : localSecurityReport.overallScore >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {localSecurityReport.overallScore} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            localSecurityReport.overallScore >= 80
                              ? 'bg-emerald-500'
                              : localSecurityReport.overallScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${localSecurityReport.overallScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-[#14151f] border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          <span>Secrets</span>
                        </div>
                        <div className="font-bold text-white text-sm font-mono mt-0.5">
                          {localSecurityReport.stats.secretsFound}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#14151f] border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Critical/High</span>
                        </div>
                        <div className="font-bold text-rose-400 text-sm font-mono mt-0.5">
                          {localSecurityReport.stats.criticalCount + localSecurityReport.stats.highCount}
                        </div>
                      </div>
                    </div>

                    {/* Issues Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] px-1 text-zinc-400">
                        <span>Findings ({localSecurityReport.issues.length})</span>
                        <button
                          onClick={onOpenLocalSecurityModal}
                          className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer flex items-center gap-0.5"
                        >
                          <span>View Full</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {localSecurityReport.issues.length === 0 ? (
                          <div className="p-2 text-center text-[11px] text-zinc-500 bg-[#121319] rounded-lg">
                            ✓ No local security flaws detected
                          </div>
                        ) : (
                          localSecurityReport.issues.slice(0, 5).map((iss, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                if (onJumpToLine) onJumpToLine(iss.lineNumber);
                              }}
                              className="p-2 rounded-lg bg-[#181922] hover:bg-[#1e1f2b] border border-zinc-800/80 text-xs transition-colors cursor-pointer space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    iss.severity === 'Critical'
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : iss.severity === 'High'
                                      ? 'bg-orange-500/20 text-orange-400'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {iss.severity}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  Line {iss.lineNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-300 truncate font-medium">
                                {iss.title}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Scan Action Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={onTriggerLocalSecurityScan}
                        className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <WifiOff className="w-3.5 h-3.5" />
                        <span>Re-Scan Locally</span>
                      </button>

                      <button
                        onClick={onOpenLocalSecurityModal}
                        className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Open Full Audit Report
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3 px-2">
                    <Lock className="w-8 h-8 text-emerald-500/50 mx-auto" />
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Scan your file offline for secrets, injection flaws, XSS, and weak cryptography without internet.
                    </p>
                    <button
                      onClick={onTriggerLocalSecurityScan}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Run Local Security Scan</span>
                    </button>
                  </div>
                )}

                {/* Offline Rules Covered */}
                <div className="space-y-1.5 pt-2 border-t border-[#22232c]">
                  <span className="text-[10px] font-semibold uppercase text-zinc-500 px-1">
                    Local Rules Covered
                  </span>
                  <div className="text-[11px] space-y-1 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AWS, GitHub & Stripe Secrets</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SQL Injection & Eval Sinks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>XSS innerHTML Flaws</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Weak Hashes (MD5/SHA1)</span>
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

                {/* Info about Local vs Gemini */}
                <div className="pt-3 border-t border-[#22232c] text-[10px] text-zinc-500 space-y-1">
                  <p className="text-emerald-400 font-medium">⚡ Local Analysis: 100% Offline</p>
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
