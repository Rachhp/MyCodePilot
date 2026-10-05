import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Bug,
  Lock,
  Zap,
  Flame,
  Filter,
} from 'lucide-react';
import { ReviewResult, ReviewIssue, Severity } from '../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReviewResult | null;
  isLoading: boolean;
  onApplyFixSnippet?: (lineNumber: number | undefined, fixSnippet: string) => void;
  onJumpToLine?: (lineNumber: number) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onApplyFixSnippet,
  onJumpToLine,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            <Flame className="w-3 h-3 text-red-400" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Info className="w-3 h-3 text-sky-400" />
            Low
          </span>
        );
      case 'Suggestion':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Suggestion
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bug':
        return <Bug className="w-3.5 h-3.5 text-rose-400" />;
      case 'Security':
        return <Lock className="w-3.5 h-3.5 text-red-400" />;
      case 'Performance':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const handleCopy = async (snippet: string, id: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIssues = result?.issues.filter((issue) => {
    if (selectedSeverity === 'All') return true;
    return issue.severity === selectedSeverity;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#16171f] border border-[#2d2f3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#282a36] flex items-center justify-between bg-[#13141a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Automated Code Review Report
                {result && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                      result.overallScore >= 80
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : result.overallScore >= 60
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    Quality Score: {result.overallScore}/100
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Auditing correctness, vulnerabilities, performance, and best practices
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
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-zinc-200">Analyzing Code Architecture...</h4>
                <p className="text-xs text-zinc-400">
                  Scanning for edge cases, security vulnerabilities, and performance bottlenecks
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Executive Summary & Stats Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-4 rounded-xl bg-[#1a1b26] border border-[#272938]">
                  <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-1.5">
                    Executive Summary
                  </h3>
                  <p className="text-xs text-zinc-200 leading-relaxed">{result.summary}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#272938] flex flex-col justify-between">
                  <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-2">
                    Finding Breakdown
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-red-950/30 border border-red-900/40">
                      <div className="font-bold text-red-400 text-sm">{result.stats.criticalCount}</div>
                      <div className="text-[10px] text-zinc-400">Critical</div>
                    </div>
                    <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-900/40">
                      <div className="font-bold text-orange-400 text-sm">{result.stats.highCount}</div>
                      <div className="text-[10px] text-zinc-400">High</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/40">
                      <div className="font-bold text-amber-400 text-sm">{result.stats.mediumCount}</div>
                      <div className="text-[10px] text-zinc-400">Medium</div>
                    </div>
                    <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-900/40">
                      <div className="font-bold text-sky-400 text-sm">{result.stats.lowCount}</div>
                      <div className="text-[10px] text-zinc-400">Low</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40 col-span-2">
                      <div className="font-bold text-emerald-400 text-sm">{result.stats.suggestionCount}</div>
                      <div className="text-[10px] text-zinc-400">Suggestions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-[#282a36] pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-zinc-400 flex items-center gap-1 mr-2">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {['All', 'Critical', 'High', 'Medium', 'Low', 'Suggestion'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        selectedSeverity === sev
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'bg-[#1b1c26] text-zinc-400 hover:text-zinc-200 hover:bg-[#232533]'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-zinc-400">
                  Showing <span className="text-white font-semibold">{filteredIssues.length}</span> issues
                </div>
              </div>

              {/* Issue Cards */}
              <div className="space-y-4">
                {filteredIssues.length === 0 ? (
                  <div className="p-8 text-center bg-[#1a1b24] rounded-xl border border-zinc-800 text-xs text-zinc-400">
                    No issues matching severity filter "{selectedSeverity}".
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl bg-[#191a24] border border-[#272938] hover:border-zinc-700 transition-all space-y-3"
                    >
                      {/* Top Bar of Issue Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getSeverityBadge(issue.severity)}
                            <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {getCategoryIcon(issue.category)}
                              <span>{issue.category}</span>
                            </div>
                            {Boolean(issue.lineNumber) && (
                              <button
                                onClick={() => {
                                  if (issue.lineNumber && onJumpToLine) {
                                    onJumpToLine(issue.lineNumber);
                                    onClose();
                                  }
                                }}
                                className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 transition-colors cursor-pointer"
                                title="Click to locate line in editor"
                              >
                                Line {issue.lineNumber}
                              </button>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-100">{issue.title}</h4>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-300 leading-relaxed">{issue.description}</p>

                      {/* Why it is a problem */}
                      <div className="p-2.5 rounded-lg bg-[#14151c] border border-red-900/20 text-xs text-zinc-400">
                        <span className="font-semibold text-rose-300 block mb-0.5">Why it's a problem:</span>
                        {issue.whyItIsAProblem}
                      </div>

                      {/* Suggested Fix */}
                      <div className="p-2.5 rounded-lg bg-[#14151c] border border-indigo-900/20 text-xs text-zinc-300">
                        <span className="font-semibold text-indigo-300 block mb-0.5">Suggested Fix:</span>
                        {issue.suggestedFix}
                      </div>

                      {/* Example Corrected Code Snippet */}
                      {issue.correctedCodeSnippet && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="font-mono text-cyan-400">Example Corrected Code</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopy(issue.correctedCodeSnippet!, issue.id)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer text-[10px]"
                              >
                                {copiedSnippetId === issue.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Snippet</span>
                                  </>
                                )}
                              </button>

                              {onApplyFixSnippet && (
                                <button
                                  onClick={() => {
                                    onApplyFixSnippet(issue.lineNumber, issue.correctedCodeSnippet!);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer text-[10px] font-medium"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Apply Fix</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <pre className="p-3 rounded-lg bg-[#121319] border border-zinc-800 font-mono-code text-[11px] text-emerald-300/90 overflow-x-auto whitespace-pre">
                            {issue.correctedCodeSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-zinc-400">
              No review data available. Click "Review Code" to trigger an audit.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-[#282a36] bg-[#13141a] flex items-center justify-between text-xs text-zinc-400">
          <span>Analysis generated via Gemini 3.8 Flash</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
