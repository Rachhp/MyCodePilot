/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AiChat } from './components/AiChat';
import { ReviewModal } from './components/ReviewModal';
import { ExplainModal } from './components/ExplainModal';
import { FixModal } from './components/FixModal';
import { LocalSecurityModal } from './components/LocalSecurityModal';
import { VsCodeModal } from './components/VsCodeModal';
import { GitHubView } from './components/github/GitHubView';
import {
  ProjectFile,
  SupportedLanguage,
  ChatMessage,
  ReviewResult,
  ExplanationResult,
  FixResult,
  EditorSettings,
  AiUsageData,
} from './types';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { scanCodeLocally, LocalSecurityReport } from './utils/localSecurityScanner';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Initialize sample files from SUPPORTED_LANGUAGES
  const [files, setFiles] = useState<ProjectFile[]>(() => {
    return SUPPORTED_LANGUAGES.map((lang) => ({
      id: `file-${lang.id}`,
      name: `main.${lang.extension}`,
      language: lang.id,
      content: lang.defaultCode,
    }));
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id || 'file-typescript');

  // Active file derived state
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Editor selection tracking
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  // Editor settings
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
  });

  // AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<'review' | 'explain' | 'fix' | 'chat' | null>(null);

  // Review state
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Explain state
  const [explainResult, setExplainResult] = useState<ExplanationResult | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  // Fix state
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [isFixOpen, setIsFixOpen] = useState(false);

  // Local Security Analysis (100% Offline, Zero Telemetry)
  const [localSecurityReport, setLocalSecurityReport] = useState<LocalSecurityReport | null>(null);
  const [isLocalSecurityOpen, setIsLocalSecurityOpen] = useState(false);

  // VS Code Extension Modal
  const [isVsCodeOpen, setIsVsCodeOpen] = useState(false);

  // Run 100% offline local security scan
  const runLocalScan = (codeToScan: string, lang: string, notifyUser = false) => {
    const report = scanCodeLocally(codeToScan, lang);
    setLocalSecurityReport(report);

    if (notifyUser) {
      if (report.issues.length === 0) {
        showToast('success', 'Local Analysis: 0 security flaws or secrets detected (100% offline).');
      } else {
        showToast(
          'info',
          `Local Analysis: Found ${report.issues.length} issue${
            report.issues.length > 1 ? 's' : ''
          } (${report.stats.secretsFound} secrets). Runs 100% in-browser.`
        );
      }
    }
    return report;
  };

  // Run local scan when active file or content changes
  useEffect(() => {
    if (activeFile?.content) {
      runLocalScan(activeFile.content, activeFile.language, false);
    }
  }, [activeFileId, activeFile?.language]);

  // Usage telemetry
  const [usageData, setUsageData] = useState<AiUsageData | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch usage stats on mount and after requests
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setUsageData(data);
      }
    } catch (err) {
      console.warn('Could not fetch usage metrics:', err);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Update current file content
  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
  };

  // Change language for current file or switch to language file
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    const existingFile = files.find((f) => f.language === newLang);
    if (existingFile) {
      setActiveFileId(existingFile.id);
    } else {
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === newLang)!;
      const newFileId = `file-${newLang}-${Date.now()}`;
      const newFile: ProjectFile = {
        id: newFileId,
        name: `script.${langConfig.extension}`,
        language: newLang,
        content: langConfig.defaultCode,
      };
      setFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFileId);
    }
    setSelectedCode('');
    setSelectedRange(null);
    setHighlightedLine(null);
  };

  // Reset current file to default sample code
  const handleResetCode = () => {
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === activeFile.language);
    if (langConfig) {
      handleContentChange(langConfig.defaultCode);
      showToast('success', `Reset ${langConfig.name} code to default sample template.`);
    }
  };

  // Clear current code in editor
  const handleClearCode = () => {
    handleContentChange('');
    setSelectedCode('');
    setSelectedRange(null);
    showToast('info', 'Editor code cleared.');
  };

  // Handle Selection Change from Editor
  const handleSelectionChange = (
    text: string,
    range: { start: number; end: number } | null
  ) => {
    setSelectedCode(text);
    setSelectedRange(range);
  };

  // Trigger Code Review
  const handleReviewCode = async () => {
    if (!activeFile.content.trim()) {
      showToast('error', 'Cannot review empty code. Please type or paste code first.');
      return;
    }

    setIsAiLoading(true);
    setActiveAction('review');
    setIsReviewOpen(true);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          selectedCode: selectedCode.trim() ? selectedCode : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Review failed with status ${res.status}`);
      }

      const data: ReviewResult = await res.json();
      setReviewResult(data);
      fetchUsage();
      showToast('success', `Code review completed: Score ${data.overallScore}/100.`);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to complete code review.');
    } finally {
      setIsAiLoading(false);
      setActiveAction(null);
    }
  };

  // Trigger Code Explanation
  const handleExplainCode = async () => {
    if (!activeFile.content.trim()) {
      showToast('error', 'Cannot explain empty code. Please type or paste code first.');
      return;
    }

    setIsAiLoading(true);
    setActiveAction('explain');
    setIsExplainOpen(true);

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          selectedCode: selectedCode.trim() ? selectedCode : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Explanation failed with status ${res.status}`);
      }

      const data: ExplanationResult = await res.json();
      setExplainResult(data);
      fetchUsage();
      showToast('success', 'Code explanation generated.');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to explain code.');
    } finally {
      setIsAiLoading(false);
      setActiveAction(null);
    }
  };

  // Trigger Code Fix
  const handleFixCode = async (instruction?: string) => {
    if (!activeFile.content.trim()) {
      showToast('error', 'Cannot fix empty code. Please type or paste code first.');
      return;
    }

    setIsAiLoading(true);
    setActiveAction('fix');
    setIsFixOpen(true);

    try {
      const res = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          selectedCode: selectedCode.trim() ? selectedCode : undefined,
          instruction: instruction || 'Fix all bugs, security flaws, performance issues, and bad practices.',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Code fix failed with status ${res.status}`);
      }

      const data: FixResult = await res.json();
      setFixResult(data);
      fetchUsage();
      showToast('success', 'Proposed code fix generated.');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to generate code fix.');
    } finally {
      setIsAiLoading(false);
      setActiveAction(null);
    }
  };

  // Apply Full Fix to Editor
  const handleApplyFix = (correctedCode: string) => {
    handleContentChange(correctedCode);
    showToast('success', 'Proposed fix successfully applied to code editor.');
  };

  // Apply fix snippet from Review finding
  const handleApplyFixSnippet = (lineNumber: number | undefined, fixSnippet: string) => {
    if (lineNumber && lineNumber > 0) {
      const lines = activeFile.content.split('\n');
      if (lineNumber <= lines.length) {
        lines[lineNumber - 1] = fixSnippet;
        handleContentChange(lines.join('\n'));
        showToast('success', `Applied fix at Line ${lineNumber}.`);
        return;
      }
    }
    // Fallback if no specific line
    handleContentChange(fixSnippet);
    showToast('success', 'Applied fix to editor.');
  };

  // Apply Local Security remediation to line
  const handleApplyLocalFix = (lineNumber: number, safeSnippet: string) => {
    if (lineNumber > 0) {
      const lines = activeFile.content.split('\n');
      if (lineNumber <= lines.length) {
        lines[lineNumber - 1] = safeSnippet;
        const updated = lines.join('\n');
        handleContentChange(updated);
        runLocalScan(updated, activeFile.language, false);
        showToast('success', `Applied local security remediation at Line ${lineNumber}.`);
        return;
      }
    }
  };

  // AI Chat message sender
  const handleSendChatMessage = async (userPrompt: string, actionType?: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString(),
      attachedCode: {
        code: selectedCode.trim() ? selectedCode : activeFile.content,
        language: activeFile.language,
        isSelection: Boolean(selectedCode.trim()),
        lineRange: selectedRange ? `${selectedRange.start}-${selectedRange.end}` : undefined,
      },
      actionType,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsAiLoading(true);
    setActiveAction('chat');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          codeContext: activeFile.content,
          language: activeFile.language,
          selectedCode: selectedCode.trim() ? selectedCode : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat failed with status ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
      fetchUsage();
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error communicating with Gemini AI**: ${err.message || 'Please check your connection and configuration.'}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      showToast('error', err.message || 'AI request failed');
    } finally {
      setIsAiLoading(false);
      setActiveAction(null);
    }
  };

  // Create new blank file
  const handleNewFile = () => {
    const newId = `file-${Date.now()}`;
    const newFile: ProjectFile = {
      id: newId,
      name: `untitled-${files.length + 1}.ts`,
      language: 'typescript',
      content: '// Write or paste your code here\n\n',
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
    showToast('info', `Created new file: ${newFile.name}`);
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      setActiveFileId(remaining[0].id);
    }
    showToast('info', 'File removed.');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121316] text-[#e2e8f0] overflow-hidden select-none font-sans">
      {/* Top Header Bar */}
      <TopBar
        currentLanguage={activeFile.language}
        onLanguageChange={handleLanguageChange}
        onReview={handleReviewCode}
        onExplain={handleExplainCode}
        onFix={() => handleFixCode()}
        onResetCode={handleResetCode}
        onOpenLocalSecurity={() => {
          runLocalScan(activeFile.content, activeFile.language, true);
          setIsLocalSecurityOpen(true);
        }}
        onOpenVsCodeModal={() => setIsVsCodeOpen(true)}
        localSecurityScore={localSecurityReport?.overallScore}
        usageData={usageData}
        isAiLoading={isAiLoading}
        activeAction={activeAction}
        toggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Activity Bar + Drawer) */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={(id) => {
            setActiveFileId(id);
            setSelectedCode('');
            setSelectedRange(null);
            setHighlightedLine(null);
          }}
          onNewFile={handleNewFile}
          onDeleteFile={handleDeleteFile}
          reviewResult={reviewResult}
          onTriggerReview={handleReviewCode}
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
          localSecurityReport={localSecurityReport}
          onTriggerLocalSecurityScan={() => runLocalScan(activeFile.content, activeFile.language, true)}
          onOpenLocalSecurityModal={() => setIsLocalSecurityOpen(true)}
          onJumpToLine={(line) => setHighlightedLine(line)}
        />

        {/* Center: Professional Code Editor */}
        <main className="flex-1 flex flex-col min-w-0 p-2 overflow-hidden bg-[#0e0f13]">
          <Editor
            code={activeFile.content}
            language={activeFile.language}
            fileName={activeFile.name}
            onChange={handleContentChange}
            onClear={handleClearCode}
            onSelectionChange={handleSelectionChange}
            highlightedLine={highlightedLine}
            fontSize={settings.fontSize}
            tabSize={settings.tabSize}
            reviewIssues={reviewResult?.issues || []}
            onApplyFixSnippet={handleApplyFixSnippet}
          />
        </main>

        {/* Right: AI Coding Chat */}
        {isChatOpen && (
          <aside className="w-80 md:w-96 flex-shrink-0 h-full">
            <AiChat
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              onClearChat={() => setChatMessages([])}
              isLoading={isAiLoading && activeAction === 'chat'}
              activeLanguage={activeFile.language}
              selectedCode={selectedCode}
              hasSelection={Boolean(selectedCode.trim())}
              onApplyCodeToEditor={(newCode) => {
                handleContentChange(newCode);
                showToast('success', 'Code block applied to editor.');
              }}
            />
          </aside>
        )}
      </div>

      {/* Code Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        result={reviewResult}
        isLoading={isAiLoading && activeAction === 'review'}
        onApplyFixSnippet={handleApplyFixSnippet}
        onJumpToLine={(line) => setHighlightedLine(line)}
      />

      {/* Code Explanation Modal */}
      <ExplainModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        result={explainResult}
        isLoading={isAiLoading && activeAction === 'explain'}
        language={activeFile.language}
      />

      {/* Proposed Code Fix Modal */}
      <FixModal
        isOpen={isFixOpen}
        onClose={() => setIsFixOpen(false)}
        originalCode={selectedCode.trim() ? selectedCode : activeFile.content}
        result={fixResult}
        isLoading={isAiLoading && activeAction === 'fix'}
        language={activeFile.language}
        onApplyFix={handleApplyFix}
        onRefineFix={(instruction) => handleFixCode(instruction)}
      />

      {/* Local Security Analysis Modal (100% Offline) */}
      <LocalSecurityModal
        isOpen={isLocalSecurityOpen}
        onClose={() => setIsLocalSecurityOpen(false)}
        report={localSecurityReport}
        language={activeFile.language}
        onJumpToLine={(line) => setHighlightedLine(line)}
        onApplyLocalFix={handleApplyLocalFix}
      />

      {/* VS Code Extension Modal */}
      <VsCodeModal
        isOpen={isVsCodeOpen}
        onClose={() => setIsVsCodeOpen(false)}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-900/30'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-900/30'
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 shadow-black/50'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-1 p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
