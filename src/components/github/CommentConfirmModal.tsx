import React, { useState } from 'react';
import { X, MessageSquare, Send, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { GitHubCommentDraft } from '../../types/github';

interface CommentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: GitHubCommentDraft | null;
  onConfirmPost: (draft: GitHubCommentDraft) => Promise<void>;
  isPosting: boolean;
}

export const CommentConfirmModal: React.FC<CommentConfirmModalProps> = ({
  isOpen,
  onClose,
  draft,
  onConfirmPost,
  isPosting,
}) => {
  const [commentText, setCommentText] = useState(draft?.body || '');

  React.useEffect(() => {
    if (draft) {
      setCommentText(draft.body);
    }
  }, [draft]);

  if (!isOpen || !draft) return null;

  const handlePost = async () => {
    await onConfirmPost({
      ...draft,
      body: commentText,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#15161f] border border-[#2c2e3e] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#282a38] flex items-center justify-between bg-[#121319]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Post Review Comment to GitHub</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review and approve the exact comment before posting to Pull Request #{draft.pullNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isPosting}
            className="p-2 rounded-lg hover:bg-[#232533] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
            <div>
              <span className="font-semibold text-zinc-200">Repository: </span>
              <span className="font-mono text-cyan-300">
                {draft.owner}/{draft.repo}
              </span>
            </div>
            {draft.path && (
              <div>
                <span className="font-semibold text-zinc-200">Target File: </span>
                <span className="font-mono text-purple-300">
                  {draft.path}
                  {draft.line ? `:${draft.line}` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Comment Markdown Content (Editable):
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={8}
              className="w-full p-3 rounded-xl bg-[#0f1016] border border-zinc-700/80 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors resize-y leading-relaxed"
              placeholder="Write or edit comment markdown..."
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200/90 leading-tight">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>User Approval Required:</strong> CodePilot will NEVER automatically post comments to your GitHub repositories without explicit confirmation.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-[#282a38] bg-[#121319] flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isPosting}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handlePost}
            disabled={isPosting || !commentText.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPosting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Posting to GitHub...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Post to GitHub</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
