import React, { useState } from 'react';
import {
  Code2,
  FileCheck,
  HelpCircle,
  Wand2,
  Cpu,
  ChevronDown,
  RotateCcw,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Check,
  ShieldAlert,
  WifiOff,
  Laptop,
} from 'lucide-react';
import { SupportedLanguage, AiUsageData } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';

interface TopBarProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onReview: () => void;
  onExplain: () => void;
  onFix: () => void;
  onResetCode: () => void;
  onOpenLocalSecurity?: () => void;
  onOpenVsCodeModal?: () => void;
  localSecurityScore?: number;
  usageData: AiUsageData | null;
  isAiLoading: boolean;
  activeAction: 'review' | 'explain' | 'fix' | 'chat' | null;
  toggleChat: () => void;
  isChatOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentLanguage,
  onLanguageChange,
  onReview,
  onExplain,
  onFix,
  onResetCode,
  onOpenLocalSecurity,
  onOpenVsCodeModal,
  localSecurityScore,
  usageData,
  isAiLoading,
  activeAction,
  toggleChat,
  isChatOpen,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.id === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleResetClick = () => {
    if (resetConfirm) {
      onResetCode();
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  return (
    <header className="h-14 border-b border-[#272832] bg-[#121318] px-4 flex items-center justify-between select-none z-20">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#14151c] rounded-[7px] flex items-center justify-center">
              <Code2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">CodePilot</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">Developer AI Engine</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-zinc-800 mx-1 hidden sm:block" />

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#1a1b23] hover:bg-[#22242f] text-xs font-medium text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{currentLangObj.name}</span>
            <span className="text-[10px] text-zinc-400 uppercase">.{currentLangObj.extension}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          </button>

          {showLangMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowLangMenu(false)}
              />
              <div className="absolute left-0 mt-1.5 w-56 rounded-lg bg-[#181922] border border-zinc-700 shadow-2xl p-1.5 z-40 max-h-80 overflow-y-auto">
                <div className="text-[10px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider">
                  Supported Languages (13)
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.id === currentLanguage;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => {
                        onLanguageChange(lang.id);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 text-cyan-300 font-medium'
                          : 'text-zinc-300 hover:bg-[#232533]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono text-[10px]">.{lang.extension}</span>
                        <span>{lang.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Reset to template button */}
        <button
          onClick={handleResetClick}
          title="Reset code to sample template"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            resetConfirm
              ? 'bg-rose-950/40 text-rose-300 border-rose-800'
              : 'bg-[#181920] hover:bg-[#20222c] text-zinc-400 hover:text-zinc-200 border-zinc-800'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetConfirm ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{resetConfirm ? 'Confirm Reset?' : 'Reset'}</span>
        </button>
      </div>

      {/* Core Action Buttons: Review, Explain, Fix */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReview}
          disabled={isAiLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm cursor-pointer ${
            activeAction === 'review' && isAiLoading
              ? 'bg-indigo-600 text-white animate-pulse'
              : 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-700/50 hover:border-indigo-600'
          } ${isAiLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">Review Code</span>
        </button>

        <button
          onClick={onExplain}
          disabled={isAiLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm cursor-pointer ${
            activeAction === 'explain' && isAiLoading
              ? 'bg-sky-600 text-white animate-pulse'
              : 'bg-sky-950/40 hover:bg-sky-900/50 text-sky-200 border border-sky-800/60 hover:border-sky-700'
          } ${isAiLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold">Explain Code</span>
        </button>

        <button
          onClick={onFix}
          disabled={isAiLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm cursor-pointer ${
            activeAction === 'fix' && isAiLoading
              ? 'bg-emerald-600 text-white animate-pulse'
              : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border border-emerald-800/60 hover:border-emerald-700'
          } ${isAiLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">Fix Code</span>
        </button>

        {onOpenLocalSecurity && (
          <button
            onClick={onOpenLocalSecurity}
            title="Run 100% offline local security scan (Zero network traffic)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-sm cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Local Security</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-0.5">
              <WifiOff className="w-2.5 h-2.5" />
              <span>Offline</span>
            </span>
          </button>
        )}
      </div>

      {/* Right controls: AI Usage & Chat Toggle */}
      <div className="flex items-center gap-2">
        {/* AI Usage Indicator Pill */}
        <button
          onClick={() => setShowUsageModal(!showUsageModal)}
          title="AI Usage & Telemetry"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#181920] hover:bg-[#22242f] border border-zinc-800 text-[11px] text-zinc-300 transition-colors cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline text-zinc-400">Tokens:</span>
          <span className="font-mono text-zinc-200">
            {usageData?.estimatedTokens ? usageData.estimatedTokens.toLocaleString() : '0'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </button>

        {/* VS Code Extension Button */}
        {onOpenVsCodeModal && (
          <button
            onClick={onOpenVsCodeModal}
            title="Download CodePilot VS Code Extension (.vsix)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 border border-blue-800/60 hover:border-blue-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">VS Code</span>
          </button>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={toggleChat}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            isChatOpen
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
              : 'bg-[#181920] hover:bg-[#22242f] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
          title={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">AI Chat</span>
        </button>
      </div>

      {/* AI Usage Modal / Popover */}
      {showUsageModal && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowUsageModal(false)}
          />
          <div className="absolute right-4 top-14 w-80 rounded-xl bg-[#191a24] border border-zinc-700 shadow-2xl p-4 z-40 text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-zinc-100">AI Usage & Optimization</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                Active
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Model Backend:</span>
                <span className="font-mono text-zinc-200 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  gemini-3.8-flash
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Total API Calls:</span>
                <span className="font-mono font-semibold text-zinc-100">
                  {usageData?.requestCount ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Estimated Tokens:</span>
                <span className="font-mono font-semibold text-cyan-300">
                  {usageData?.estimatedTokens?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Free Tier Optimization:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enabled
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              Requests only transmit the selected code snippet or active file, avoiding unnecessary token consumption.
            </div>
          </div>
        </>
      )}
    </header>
  );
};
