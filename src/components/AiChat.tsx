import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Code2,
  Trash2,
  CornerDownLeft,
  ArrowRight,
  Shield,
  Zap,
  Bug,
  BookOpen,
  Wrench,
  Globe,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { marked } from 'marked';
import { ChatMessage, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { highlightCode } from '../utils/highlighter';

interface AiChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, actionType?: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  activeLanguage: SupportedLanguage;
  selectedCode: string;
  hasSelection: boolean;
  onApplyCodeToEditor: (newCode: string) => void;
}

export const AiChat: React.FC<AiChatProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  activeLanguage,
  selectedCode,
  hasSelection,
  onApplyCodeToEditor,
}) => {
  const [input, setInput] = useState('');
  const [targetConvertLang, setTargetConvertLang] = useState<SupportedLanguage>('python');
  const [showConvertDropdown, setShowConvertDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (promptText: string, actionType?: string) => {
    if (isLoading) return;
    onSendMessage(promptText, actionType);
  };

  const handleCopyCode = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy snippet:', err);
    }
  };

  // Helper to extract fenced code blocks from markdown reply for quick action buttons
  const extractCodeBlocks = (text: string): { lang: string; code: string }[] => {
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const blocks: { lang: string; code: string }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        lang: match[1] || 'code',
        code: match[2].trim(),
      });
    }
    return blocks;
  };

  return (
    <div className="flex flex-col h-full bg-[#14151a] border-l border-[#272832]">
      {/* Header */}
      <div className="h-12 border-b border-[#272832] px-4 flex items-center justify-between bg-[#121317]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              CodePilot AI Assistant
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded font-mono">
                online
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={onClearChat}
          title="Clear chat history"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Code Context Pill */}
      <div className="px-3 py-1.5 bg-[#171821] border-b border-[#22232c] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Context:</span>
          {hasSelection ? (
            <span className="px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
              Selected snippet ({selectedCode.split('\n').length} lines)
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
              Full {activeLanguage} file
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">How can CodePilot help you?</h3>
              <p className="text-xs text-zinc-400 max-w-[280px] mt-1 leading-relaxed">
                Ask questions about your code, detect hidden bugs, generate optimizations, or convert languages.
              </p>
            </div>

            {/* Quick Action Suggestions */}
            <div className="w-full space-y-1.5 pt-2 text-left">
              <span className="text-[11px] font-semibold text-zinc-400 px-1 uppercase tracking-wider">
                Quick Prompts
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleQuickPrompt('Explain this code step-by-step', 'explain')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b24] hover:bg-[#222433] border border-zinc-800 text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Explain this code</span>
                </button>
                <button
                  onClick={() => handleQuickPrompt('Find bugs and edge-case errors in this code', 'bugs')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b24] hover:bg-[#222433] border border-zinc-800 text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Find bugs</span>
                </button>
                <button
                  onClick={() => handleQuickPrompt('Optimize this code for maximum performance and lower memory usage', 'optimize')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b24] hover:bg-[#222433] border border-zinc-800 text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Optimize this code</span>
                </button>
                <button
                  onClick={() => handleQuickPrompt('Perform a security audit: find vulnerabilities and suggest secure alternatives', 'security')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b24] hover:bg-[#222433] border border-zinc-800 text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Make this code more secure</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            const codeBlocks = !isUser ? extractCodeBlocks(message.content) : [];

            return (
              <div
                key={message.id}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3 ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-[#1a1b24] border border-[#272832] text-zinc-200 shadow-md'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div>
                      {/* Render markdown */}
                      <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(message.content) as string,
                        }}
                      />

                      {/* Code Block quick actions if any code was returned */}
                      {codeBlocks.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            Code Actions
                          </span>
                          {codeBlocks.map((block, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 rounded-lg bg-[#121319] border border-zinc-800"
                            >
                              <span className="text-[11px] font-mono text-cyan-400">
                                {block.lang || 'code'} block ({block.code.split('\n').length} lines)
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopyCode(block.code, `${message.id}-${i}`)}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e2029] hover:bg-[#282b37] text-[10px] text-zinc-300 transition-colors cursor-pointer"
                                >
                                  {copiedId === `${message.id}-${i}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => onApplyCodeToEditor(block.code)}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-[10px] text-indigo-300 border border-indigo-500/40 transition-colors cursor-pointer font-medium"
                                  title="Replace current editor content with this code"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Apply to Editor</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? 'text-indigo-200/70' : 'text-zinc-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-[#1a1b24] border border-[#272832] rounded-xl p-3 text-zinc-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>CodePilot is thinking & analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Action Chips (horizontal scrollable) */}
      <div className="px-3 py-1.5 border-t border-[#22232c] bg-[#161720] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleQuickPrompt('Explain this code')}
          className="shrink-0 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          Explain
        </button>
        <button
          onClick={() => handleQuickPrompt('Find bugs in this code')}
          className="shrink-0 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          Find bugs
        </button>
        <button
          onClick={() => handleQuickPrompt('Fix bugs and errors in this code')}
          className="shrink-0 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          Fix this code
        </button>
        <button
          onClick={() => handleQuickPrompt('Optimize this code for execution speed')}
          className="shrink-0 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          Optimize
        </button>
        <button
          onClick={() => handleQuickPrompt('Add clear, professional documentation comments')}
          className="shrink-0 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          Add comments
        </button>
        <button
          onClick={() => handleQuickPrompt('Improve code quality and maintainability')}
          className="shrink-0 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          Improve
        </button>

        {/* Convert to another language quick prompt */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowConvertDropdown(!showConvertDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#1f202c] hover:bg-[#282a3a] border border-zinc-800 text-[11px] text-cyan-300 transition-colors cursor-pointer"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>Convert to {targetConvertLang}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showConvertDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowConvertDropdown(false)} />
              <div className="absolute bottom-8 right-0 w-44 rounded-lg bg-[#1a1b24] border border-zinc-700 shadow-xl p-1 z-50 max-h-48 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setTargetConvertLang(l.id);
                      setShowConvertDropdown(false);
                      handleQuickPrompt(`Convert this code to ${l.name}. Provide clean idiomatic ${l.name} with equivalent functionality.`);
                    }}
                    className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-300 hover:bg-[#242636] transition-colors cursor-pointer"
                  >
                    Convert to {l.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#121318] border-t border-[#272832]">
        <div className="relative flex items-end bg-[#181922] border border-zinc-700/80 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask CodePilot anything... (Shift+Enter for newline)"
            rows={2}
            className="w-full bg-transparent p-3 pr-10 text-xs text-zinc-200 placeholder-zinc-500 outline-none resize-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
              input.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30'
                : 'text-zinc-600 bg-zinc-800/40 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-1.5 px-1 text-[10px] text-zinc-400">
          <span>Enter to send • Shift+Enter for new line</span>
          <span>Gemini 3.8 Flash</span>
        </div>
      </form>
    </div>
  );
};
