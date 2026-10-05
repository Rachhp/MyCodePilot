import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  FileCode,
  ArrowRight,
  Download,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  WifiOff,
  Filter,
} from 'lucide-react';
import { LocalSecurityReport, LocalSecurityIssue } from '../utils/localSecurityScanner';

interface LocalSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LocalSecurityReport | null;
  onJumpToLine?: (line: number) => void;
  onApplyLocalFix?: (line: number, safeReplacement: string) => void;
  language: string;
}

export const LocalSecurityModal: React.FC<LocalSecurityModalProps> = ({
  isOpen,
  onClose,
  report,
  onJumpToLine,
  onApplyLocalFix,
  language,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'SECRETS'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `local-security-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredIssues = (report?.issues || []).filter((issue) => {
    if (filterSeverity === 'CRITICAL') return issue.severity === 'Critical';
    if (filterSeverity === 'HIGH') return issue.severity === 'Critical' || issue.severity === 'High';
    if (filterSeverity === 'SECRETS') return issue.category === 'Secret Leak';
    return true;
  });

  const getSeverityBadge = (sev: LocalSecurityIssue['severity']) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#15161e] border border-[#2d2f3e] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#282a38] flex items-center justify-between bg-[#121319]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Local Security Analysis</h2>
                {/* Prominent Local / Offline Badges */}
                <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wide">
                  <WifiOff className="w-3 h-3 text-emerald-400" />
                  Local Analysis (Offline)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {language}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Runs 100% in browser • Zero network transfer • Source code never leaves your device</span>
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
          {report ? (
            <>
              {/* Score & Metrics Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Health Score */}
                <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#272938] flex flex-col justify-between">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                    Local Security Score
                  </span>
                  <div className="flex items-baseline gap-2 my-2">
                    <span
                      className={`text-3xl font-extrabold font-mono ${
                        report.overallScore >= 85
                          ? 'text-emerald-400'
                          : report.overallScore >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {report.overallScore}
                    </span>
                    <span className="text-xs text-zinc-500">/ 100</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        report.overallScore >= 85
                          ? 'bg-emerald-500'
                          : report.overallScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${report.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Secrets Found */}
                <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#272938] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="uppercase tracking-wider font-medium">Exposed Secrets</span>
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white my-1">
                    {report.stats.secretsFound}
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    API keys, tokens, or credentials
                  </span>
                </div>

                {/* Critical / High Vulnerabilities */}
                <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#272938] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="uppercase tracking-wider font-medium">Critical / High</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-400 my-1">
                    {report.stats.criticalCount + report.stats.highCount}
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Immediate remediation required
                  </span>
                </div>

                {/* Privacy Guarantee */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-emerald-300">
                    <span className="uppercase tracking-wider font-semibold">Zero Telemetry</span>
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed my-1">
                    Scanned offline in memory using client regex heuristics.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-mono">0 bytes transmitted</span>
                </div>
              </div>

              {/* Filters & Export Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#282a38] pb-3">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs text-zinc-400 mr-1">Filter:</span>
                  <button
                    onClick={() => setFilterSeverity('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterSeverity === 'ALL'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#1b1c28] text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({report.issues.length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('CRITICAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterSeverity === 'CRITICAL'
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'bg-[#1b1c28] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Critical ({report.stats.criticalCount})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('HIGH')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterSeverity === 'HIGH'
                        ? 'bg-orange-600 text-white font-semibold'
                        : 'bg-[#1b1c28] text-zinc-400 hover:text-white'
                    }`}
                  >
                    High+ ({report.stats.criticalCount + report.stats.highCount})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('SECRETS')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filterSeverity === 'SECRETS'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-[#1b1c28] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Secrets Only ({report.stats.secretsFound})
                  </button>
                </div>

                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Local Report</span>
                </button>
              </div>

              {/* Issues List */}
              {filteredIssues.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-200">
                    No Security Issues Found In This Filter
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Your code passed all local heuristic checks for secrets, injections, and dangerous sinks.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id + issue.lineNumber}
                      className="p-4 rounded-xl bg-[#191a24] border border-[#272938] space-y-3"
                    >
                      {/* Top line of issue */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${getSeverityBadge(
                              issue.severity
                            )}`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs font-semibold text-white">{issue.title}</span>
                          {issue.cwe && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {issue.cwe}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                            {issue.category}
                          </span>
                        </div>

                        {onJumpToLine && (
                          <button
                            onClick={() => {
                              onJumpToLine(issue.lineNumber);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>Jump to Line {issue.lineNumber}</span>
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-300 leading-relaxed">{issue.description}</p>

                      {/* Matched code snippet */}
                      <div className="p-2.5 rounded-lg bg-[#121319] border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 truncate text-rose-300">
                          <span className="text-zinc-500 select-none">Line {issue.lineNumber}:</span>
                          <span className="truncate">{issue.matchedText}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(issue.matchedText, issue.id)}
                          title="Copy snippet"
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedId === issue.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Remediation guidance & safe replacement */}
                      <div className="p-3 rounded-lg bg-[#14151e] border border-zinc-800 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Recommended Remediation</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {issue.remediation}
                        </p>

                        {issue.safeReplacementSnippet && onApplyLocalFix && (
                          <div className="pt-1 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-mono text-emerald-300 truncate bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/40">
                              Suggested: {issue.safeReplacementSnippet}
                            </span>
                            <button
                              onClick={() => {
                                onApplyLocalFix(issue.lineNumber, issue.safeReplacementSnippet!);
                                onClose();
                              }}
                              className="shrink-0 flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Apply Safe Fix</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400">
              No local scan report yet. Click "Scan For Vulnerabilities (Local)" to begin.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-[#282a38] bg-[#121319] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local analysis active • No cloud dependency</span>
          </div>

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
