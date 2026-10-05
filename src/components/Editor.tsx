import React, { useRef, useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  FileCode2,
  Sparkles,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { SupportedLanguage, ReviewIssue } from '../types';
import { highlightCode } from '../utils/highlighter';

interface EditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (value: string) => void;
  onClear: () => void;
  onSelectionChange?: (selectedText: string, lineRange: { start: number; end: number } | null) => void;
  highlightedLine?: number | null;
  fontSize?: number;
  tabSize?: number;
  reviewIssues?: ReviewIssue[];
  onApplyFixSnippet?: (lineNumber: number | undefined, snippet: string) => void;
  fileName?: string;
}

export const Editor: React.FC<EditorProps> = ({
  code,
  language,
  onChange,
  onClear,
  onSelectionChange,
  highlightedLine = null,
  fontSize = 14,
  tabSize = 2,
  reviewIssues = [],
  onApplyFixSnippet,
  fileName,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTooltipIssue, setActiveTooltipIssue] = useState<{
    issue: ReviewIssue;
    top: number;
  } | null>(null);

  // Split code into lines
  const lines = code.split('\n');
  const lineCount = lines.length;

  // Map issues by line number for fast lookup
  const issueByLine = new Map<number, ReviewIssue>();
  for (const issue of reviewIssues) {
    if (issue.lineNumber && issue.lineNumber > 0) {
      // Prioritize higher severity if multiple on same line
      if (!issueByLine.has(issue.lineNumber)) {
        issueByLine.set(issue.lineNumber, issue);
      }
    }
  }

  // Handle synchronized scroll between textarea, pre highlight, and line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
    setActiveTooltipIssue(null);
  };

  // Update cursor position and selection tracking
  const updateSelectionState = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Calculate line and col
    const textUpToCursor = textarea.value.slice(0, start);
    const lineIndex = textUpToCursor.split('\n').length;
    const lastNewline = textUpToCursor.lastIndexOf('\n');
    const colIndex = start - (lastNewline === -1 ? 0 : lastNewline + 1) + 1;
    setCursorPos({ line: lineIndex, col: colIndex });

    if (start !== end) {
      const selected = textarea.value.slice(start, end);
      setSelectedText(selected);

      const startLine = textarea.value.slice(0, start).split('\n').length;
      const endLine = textarea.value.slice(0, end).split('\n').length;
      const range = { start: startLine, end: endLine };
      setSelectedRange(range);

      if (onSelectionChange) {
        onSelectionChange(selected, range);
      }
    } else {
      setSelectedText('');
      setSelectedRange(null);
      if (onSelectionChange) {
        onSelectionChange('', null);
      }
    }
  };

  // Keyboard navigation & indentation handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = ' '.repeat(tabSize);

      const newCode = code.substring(0, start) + spaces + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
        updateSelectionState();
      }, 0);
    } else if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const currentLine = code.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^\s+/);
      const indent = match ? match[0] : '';

      if (indent.length > 0) {
        e.preventDefault();
        const addition = '\n' + indent;
        const newCode = code.substring(0, start) + addition + code.substring(textarea.selectionEnd);
        onChange(newCode);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + addition.length;
          updateSelectionState();
        }, 0);
      }
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = selectedText ? selectedText : code;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Highlight line effect if review requested jump to line
  useEffect(() => {
    if (highlightedLine && textareaRef.current) {
      const linesArr = code.split('\n');
      if (highlightedLine <= linesArr.length) {
        let charIndex = 0;
        for (let i = 0; i < highlightedLine - 1; i++) {
          charIndex += linesArr[i].length + 1;
        }
        const lineLen = linesArr[highlightedLine - 1].length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charIndex, charIndex + lineLen);
        updateSelectionState();

        const lineHeight = fontSize * 1.5;
        const targetScroll = Math.max(0, (highlightedLine - 4) * lineHeight);
        textareaRef.current.scrollTop = targetScroll;
      }
    }
  }, [highlightedLine]);

  // Syntax highlighted HTML
  const highlightedHtml = highlightCode(code, language);

  const getGutterBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500 shadow-red-500/50';
      case 'High':
        return 'bg-orange-500 shadow-orange-500/50';
      case 'Medium':
        return 'bg-amber-400 shadow-amber-400/50';
      case 'Low':
        return 'bg-sky-400 shadow-sky-400/50';
      default:
        return 'bg-emerald-400 shadow-emerald-400/50';
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#16171d] border border-[#272832] rounded-lg overflow-hidden shadow-xl transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full flex-1'
      }`}
    >
      {/* Editor Header Bar with Tab */}
      <div className="h-10 bg-[#14151a] border-b border-[#272832] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {/* Active File Tab */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-t-md bg-[#191a24] border-t-2 border-indigo-500 border-x border-[#272832] text-xs font-mono text-zinc-100 shadow-sm">
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{fileName || `main.${language}`}</span>
          </div>

          {selectedRange ? (
            <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Selection: Lines {selectedRange.start}–{selectedRange.end}</span>
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
              Full file ({lineCount} lines)
            </div>
          )}

          {issueByLine.size > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>{issueByLine.size} review issue{issueByLine.size > 1 ? 's' : ''} flagged</span>
            </div>
          )}
        </div>

        {/* Action icons: Copy, Clear, Fullscreen */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title={selectedText ? 'Copy selected code' : 'Copy entire code'}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-[#232533] text-zinc-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px] font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] text-zinc-300 hidden md:inline">
                  {selectedText ? 'Copy Selection' : 'Copy'}
                </span>
              </>
            )}
          </button>

          <button
            onClick={onClear}
            title="Clear editor code"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Clear</span>
          </button>

          <div className="h-3 w-[1px] bg-zinc-800 mx-1" />

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit fullscreen' : 'Maximize editor'}
            className="p-1.5 rounded hover:bg-[#232533] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            {isFullScreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Editor Body: Line Numbers + Gutter Markers + Textarea + Highlighting Overlay */}
      <div className="relative flex-1 flex overflow-hidden bg-[#16171d]">
        {/* Line Numbers & Gutter Column */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-14 select-none bg-[#131419] border-r border-[#22232c] py-3 text-right font-mono-code text-zinc-400 text-xs overflow-hidden flex flex-col items-end pr-2.5"
          style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}
        >
          {Array.from({ length: lineCount }).map((_, index) => {
            const lineNum = index + 1;
            const isHighlighted = highlightedLine === lineNum;
            const isInSelection =
              selectedRange && lineNum >= selectedRange.start && lineNum <= selectedRange.end;
            const issueOnLine = issueByLine.get(lineNum);

            return (
              <div
                key={lineNum}
                className={`w-full flex items-center justify-end gap-1.5 transition-colors ${
                  isHighlighted
                    ? 'text-amber-400 font-bold bg-amber-500/20'
                    : isInSelection
                    ? 'text-indigo-300 font-medium'
                    : 'hover:text-zinc-300'
                }`}
              >
                {/* Gutter issue indicator dot */}
                {issueOnLine && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setActiveTooltipIssue({
                        issue: issueOnLine,
                        top: rect.top - 60,
                      });
                    }}
                    title={`${issueOnLine.severity}: ${issueOnLine.title}`}
                    className={`w-2 h-2 rounded-full cursor-pointer shadow-sm ${getGutterBadgeColor(
                      issueOnLine.severity
                    )}`}
                  />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Syntax Highlighting Layer (Underneath textarea) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-3 font-mono-code pointer-events-none overflow-hidden whitespace-pre tab-4"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: `${fontSize * 1.5}px`,
              tabSize: tabSize,
            }}
          >
            <code
              className={`language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
            />
          </pre>

          {/* Transparent Editable Textarea (On top) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onClick={updateSelectionState}
            onKeyUp={updateSelectionState}
            onSelect={updateSelectionState}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 m-0 p-3 font-mono-code text-transparent caret-cyan-400 bg-transparent resize-none outline-none border-none overflow-auto whitespace-pre z-10 selection:bg-indigo-600/35 selection:text-transparent"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: `${fontSize * 1.5}px`,
              tabSize: tabSize,
            }}
          />
        </div>

        {/* Floating In-Editor Issue Tooltip */}
        {activeTooltipIssue && (
          <div
            className="absolute left-16 z-30 w-80 rounded-xl bg-[#1c1d28] border border-zinc-700 shadow-2xl p-3 text-xs space-y-2 animate-in fade-in"
            style={{ top: `${Math.max(10, Math.min(activeTooltipIssue.top, 350))}px` }}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  activeTooltipIssue.issue.severity === 'Critical'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {activeTooltipIssue.issue.severity} • Line {activeTooltipIssue.issue.lineNumber}
              </span>
              <button
                onClick={() => setActiveTooltipIssue(null)}
                className="p-0.5 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h5 className="font-semibold text-zinc-100">{activeTooltipIssue.issue.title}</h5>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {activeTooltipIssue.issue.description}
            </p>

            {activeTooltipIssue.issue.correctedCodeSnippet && onApplyFixSnippet && (
              <button
                onClick={() => {
                  onApplyFixSnippet(
                    activeTooltipIssue.issue.lineNumber,
                    activeTooltipIssue.issue.correctedCodeSnippet!
                  );
                  setActiveTooltipIssue(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Apply Line Fix</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* VS Code Style Status Bar */}
      <div className="h-6 bg-[#121317] border-t border-[#22232c] px-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 hover:text-zinc-300">
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          </div>

          {selectedText.length > 0 && (
            <div className="text-cyan-400">
              ({selectedText.length} characters selected)
            </div>
          )}

          <div className="hidden md:flex items-center gap-1">
            <span>Lines: {lineCount}</span>
            <span>•</span>
            <span>Chars: {code.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Spaces: {tabSize}</span>
          <span>UTF-8</span>
          <span className="text-zinc-300 font-semibold uppercase">{language}</span>
        </div>
      </div>
    </div>
  );
};
