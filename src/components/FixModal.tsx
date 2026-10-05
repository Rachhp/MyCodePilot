import React, { useState } from 'react';
import {
  X,
  Wand2,
  CheckCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bug,
  BookOpen,
  Split,
  Eye,
  GitCommit,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { FixResult } from '../types';
import { highlightCode } from '../utils/highlighter';
import { computeLineDiff } from '../utils/diff';

interface FixModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCode: string;
  result: FixResult | null;
  isLoading: boolean;
  language: string;
  onApplyFix: (correctedCode: string) => void;
  onRefineFix?: (customInstruction: string) => void;
}

export const FixModal: React.FC<FixModalProps> = ({
  isOpen,
  onClose,
  originalCode,
  result,
  isLoading,
  language,
  onApplyFix,
  onRefineFix,
}) => {
  const [viewMode, setViewMode] = useState<'diff' | 'unified' | 'corrected'>('unified');
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!result?.correctedCode) return;
    try {
      await navigator.clipboard.writeText(result.correctedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const getAreaIcon = (area: string) => {
    switch (area.toLowerCase()) {
      case 'security':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'performance':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'bug fix':
        return <Bug className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const diffLines = result?.correctedCode ? computeLineDiff(originalCode, result.correctedCode) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#16171f] border border-[#2d2f3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#282a36] flex items-center justify-between bg-[#13141a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Proposed Code Fixes & Refactoring
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {language}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Review automated optimizations and bug fixes before replacing editor buffer
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-zinc-200">Synthesizing Fixes...</h4>
                <p className="text-xs text-zinc-400">
                  Rewriting code with security hardening, performance gains, and modern best practices
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Summary of fixes */}
              <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#272938] space-y-3">
                <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                  Summary of Fixes Applied
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.summaryOfFixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-zinc-200 p-2 rounded-lg bg-[#14151d] border border-zinc-800/80"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{fix}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Improvements Badges */}
              {result.keyImprovements && result.keyImprovements.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {result.keyImprovements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#191a24] border border-[#272938] space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                        {getAreaIcon(imp.area)}
                        <span>{imp.area}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{imp.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* View mode toggle: Unified Diff vs Side-by-Side vs Corrected */}
              <div className="flex items-center justify-between border-b border-[#282a36] pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('unified')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === 'unified'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#1a1b24] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>Unified Diff View</span>
                  </button>

                  <button
                    onClick={() => setViewMode('diff')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === 'diff'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#1a1b24] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Side-by-Side</span>
                  </button>

                  <button
                    onClick={() => setViewMode('corrected')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === 'corrected'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#1a1b24] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Proposed Full Code</span>
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Proposed Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Views */}
              {viewMode === 'unified' ? (
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#121319]">
                  <div className="px-4 py-2 bg-[#171822] border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 font-mono">
                    <span>Unified Line Diff</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-400">+ Additions</span>
                      <span className="text-rose-400">- Deletions</span>
                    </div>
                  </div>
                  <div className="font-mono-code text-xs leading-relaxed overflow-x-auto max-h-[420px] p-2">
                    {diffLines.map((line, idx) => {
                      const isAdded = line.type === 'added';
                      const isRemoved = line.type === 'removed';
                      return (
                        <div
                          key={idx}
                          className={`flex items-center px-2 py-0.5 rounded-sm ${
                            isAdded
                              ? 'bg-emerald-950/40 text-emerald-300'
                              : isRemoved
                              ? 'bg-rose-950/40 text-rose-300 line-through opacity-80'
                              : 'text-zinc-400'
                          }`}
                        >
                          <span className="w-6 text-right text-zinc-600 select-none mr-2 font-mono text-[10px]">
                            {line.originalLineNumber || ''}
                          </span>
                          <span className="w-6 text-right text-zinc-600 select-none mr-3 font-mono text-[10px]">
                            {line.newLineNumber || ''}
                          </span>
                          <span className="w-4 select-none font-bold mr-1">
                            {isAdded ? '+' : isRemoved ? '-' : ' '}
                          </span>
                          <span className="whitespace-pre flex-1">{line.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : viewMode === 'diff' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Original Code */}
                  <div className="flex flex-col rounded-xl overflow-hidden border border-rose-900/30 bg-[#121319]">
                    <div className="px-3 py-2 bg-rose-950/30 border-b border-rose-900/30 flex items-center justify-between text-xs text-rose-300">
                      <span className="font-semibold">Original Code</span>
                      <span className="text-[10px] text-zinc-400">Before</span>
                    </div>
                    <pre
                      className="p-3 font-mono-code text-[11px] leading-relaxed text-zinc-400 overflow-x-auto max-h-96 whitespace-pre"
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(originalCode, language),
                      }}
                    />
                  </div>

                  {/* Proposed Corrected Code */}
                  <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-900/30 bg-[#121319]">
                    <div className="px-3 py-2 bg-emerald-950/30 border-b border-emerald-900/30 flex items-center justify-between text-xs text-emerald-300">
                      <span className="font-semibold">Proposed Fix</span>
                      <span className="text-[10px] text-zinc-400">After (Optimized)</span>
                    </div>
                    <pre
                      className="p-3 font-mono-code text-[11px] leading-relaxed text-emerald-300/90 overflow-x-auto max-h-96 whitespace-pre"
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(result.correctedCode, language),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-emerald-900/40 bg-[#121319]">
                  <div className="px-4 py-2.5 bg-emerald-950/30 border-b border-emerald-900/30 flex items-center justify-between text-xs text-emerald-300">
                    <span className="font-semibold">Proposed Replacement Code</span>
                    <span className="text-[11px] font-mono text-zinc-400">{language}</span>
                  </div>
                  <pre
                    className="p-4 font-mono-code text-xs leading-relaxed text-zinc-200 overflow-x-auto max-h-[450px] whitespace-pre"
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(result.correctedCode, language),
                    }}
                  />
                </div>
              )}

              {/* Optional Custom Refinement Input */}
              {onRefineFix && (
                <div className="p-3.5 rounded-xl bg-[#191a24] border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Need specific adjustments to this fix?</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customPrompt.trim()) {
                          onRefineFix(customPrompt.trim());
                        }
                      }}
                      placeholder="e.g. Also add unit test annotations, or avoid external dependencies..."
                      className="flex-1 bg-[#121319] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => {
                        if (customPrompt.trim()) {
                          onRefineFix(customPrompt.trim());
                        }
                      }}
                      disabled={!customPrompt.trim()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refine</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-xs text-zinc-400">
              No fix generated yet. Click "Fix Code" to analyze and synthesize improvements.
            </div>
          )}
        </div>

        {/* Footer with Apply / Reject buttons */}
        <div className="h-16 px-6 border-t border-[#282a36] bg-[#13141a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Reject Fix
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (result?.correctedCode) {
                  onApplyFix(result.correctedCode);
                  onClose();
                }
              }}
              disabled={!result?.correctedCode || isLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                result?.correctedCode && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Apply Fix to Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
