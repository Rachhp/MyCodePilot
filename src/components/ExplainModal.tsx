import React from 'react';
import {
  X,
  HelpCircle,
  Lightbulb,
  Layers,
  ArrowRight,
  AlertOctagon,
  Sparkles,
  BookOpen,
  Workflow,
} from 'lucide-react';
import { ExplanationResult } from '../types';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExplanationResult | null;
  isLoading: boolean;
  language: string;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#16171f] border border-[#2d2f3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#282a36] flex items-center justify-between bg-[#13141a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Code Explanation & Deep Dive
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                  {language}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Detailed architecture breakdown, beginner analogies, and execution walkthrough
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
              <div className="w-12 h-12 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-zinc-200">Deconstructing Logic...</h4>
                <p className="text-xs text-zinc-400">
                  Tracing control flow, identifying data contracts, and generating intuitive explanations
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* High-level title and Overview */}
              <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#272938] space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Overview & Primary Objective</span>
                </div>
                <h3 className="text-base font-bold text-white">{result.title}</h3>
                <p className="text-xs text-zinc-200 leading-relaxed">{result.overview}</p>
              </div>

              {/* Beginner Friendly ELI5 section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-purple-950/20 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Simple Explanation for Beginners (ELI5)</span>
                </div>
                <p className="text-xs text-indigo-100/90 leading-relaxed italic">
                  "{result.simpleExplanationForBeginners}"
                </p>
              </div>

              {/* Execution Flow / Steps */}
              {result.stepByStepFlow && result.stepByStepFlow.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                    <Workflow className="w-4 h-4 text-cyan-400" />
                    <span>Step-by-Step Execution Flow</span>
                  </div>
                  <div className="space-y-2">
                    {result.stepByStepFlow.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#191a24] border border-zinc-800 text-xs text-zinc-300"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Functions / Classes Breakdown */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Important Functions, Classes & Structures</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.importantComponents.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#191a24] border border-[#272938] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-xs text-cyan-300">{comp.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {comp.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{comp.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inputs & Outputs */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <span>Data Contracts: Inputs & Outputs</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inputs */}
                  <div className="p-3.5 rounded-xl bg-[#191a24] border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide block">
                      Expected Inputs
                    </span>
                    {result.inputsAndOutputs.inputs.length === 0 ? (
                      <span className="text-xs text-zinc-500">None or self-contained</span>
                    ) : (
                      result.inputsAndOutputs.inputs.map((inSpec, i) => (
                        <div key={i} className="text-xs pb-1.5 border-b border-zinc-800/60 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-200">{inSpec.name}</span>
                            <span className="text-[10px] font-mono text-zinc-500">({inSpec.type})</span>
                          </div>
                          <p className="text-[11px] text-zinc-400">{inSpec.description}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Outputs */}
                  <div className="p-3.5 rounded-xl bg-[#191a24] border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wide block">
                      Returned Outputs
                    </span>
                    {result.inputsAndOutputs.outputs.length === 0 ? (
                      <span className="text-xs text-zinc-500">Void / No return value</span>
                    ) : (
                      result.inputsAndOutputs.outputs.map((outSpec, i) => (
                        <div key={i} className="text-xs pb-1.5 border-b border-zinc-800/60 last:border-0 last:pb-0">
                          <span className="text-[10px] font-mono text-sky-300 bg-sky-950/50 px-1 py-0.5 rounded">
                            {outSpec.type}
                          </span>
                          <p className="text-[11px] text-zinc-400 mt-1">{outSpec.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Potential Problems & Edge Cases */}
              {result.potentialProblems && result.potentialProblems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Potential Problems & Edge Cases</span>
                  </div>
                  <div className="space-y-2">
                    {result.potentialProblems.map((prob, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-xs text-rose-200/90 leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{prob}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-xs text-zinc-400">
              No explanation data. Click "Explain Code" to start.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-[#282a36] bg-[#13141a] flex items-center justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
