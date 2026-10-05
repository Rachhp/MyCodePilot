import React, { useState, useEffect } from 'react';
import {
  Github,
  GitPullRequest,
  FolderGit2,
  GitBranch,
  GitCommit,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  WifiOff,
  Sparkles,
  KeyRound,
  RefreshCw,
  LogOut,
  FileCode,
  Folder,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Sliders,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import {
  GitHubUser,
  GitHubRepository,
  GitHubBranch,
  GitHubCommit,
  GitHubFileItem,
  GitHubPullRequest,
  GitHubChangedFile,
  PullRequestReviewResult,
  PullRequestFinding,
  GitHubCommentDraft,
  GitHubConfigStatus,
} from '../../types/github';
import { githubApi } from '../../services/githubApi';
import { CommentConfirmModal } from './CommentConfirmModal';
import { scanCodeLocally, LocalSecurityReport } from '../../utils/localSecurityScanner';

interface GitHubViewProps {
  onOpenFileInEditor: (fileName: string, content: string, language: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GitHubView: React.FC<GitHubViewProps> = ({ onOpenFileInEditor, showToast }) => {
  // Auth state
  const [configStatus, setConfigStatus] = useState<GitHubConfigStatus | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [patInput, setPatInput] = useState('');
  const [isPatSubmitting, setIsPatSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Privacy setting: "Send repository code to Gemini" ON/OFF
  const [sendCodeToGemini, setSendCodeToGemini] = useState<boolean>(true);

  // Repositories state
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);

  // Repository view tabs
  const [activeRepoTab, setActiveRepoTab] = useState<'pulls' | 'files' | 'commits'>('pulls');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [treeItems, setTreeItems] = useState<GitHubFileItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Pull Requests state
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isLoadingPulls, setIsLoadingPulls] = useState(false);
  const [prFilter, setPrFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [selectedPr, setSelectedPr] = useState<GitHubPullRequest | null>(null);
  const [prDetails, setPrDetails] = useState<{
    files: GitHubChangedFile[];
    commits: GitHubCommit[];
  } | null>(null);
  const [isLoadingPrDetails, setIsLoadingPrDetails] = useState(false);

  // PR Review state
  const [prReview, setPrReview] = useState<PullRequestReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [localReport, setLocalReport] = useState<LocalSecurityReport | null>(null);

  // Comment Modal state
  const [commentDraft, setCommentDraft] = useState<GitHubCommentDraft | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Repo Architecture Explanation Modal/State
  const [repoExplanation, setRepoExplanation] = useState<string | null>(null);
  const [isExplainingRepo, setIsExplainingRepo] = useState(false);

  // Load auth state on mount
  const checkStatus = async () => {
    setIsLoadingAuth(true);
    try {
      const status = await githubApi.getStatus();
      setConfigStatus(status);
      if (status.isAuthenticated) {
        loadRepositories();
      }
    } catch (err: any) {
      console.warn('Could not check GitHub status:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Listen for popup OAuth callback message
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        showToast('success', `GitHub connected as @${event.data.user?.login || 'user'}!`);
        checkStatus();
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Load repositories
  const loadRepositories = async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await githubApi.listRepositories();
      setRepositories(repos);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Connect via OAuth Popup
  const handleConnectOAuth = async () => {
    try {
      const { url } = await githubApi.getAuthUrl();
      const popup = window.open(
        url,
        'github_oauth_popup',
        'width=600,height=750,menubar=no,toolbar=no,status=no'
      );
      if (!popup) {
        showToast('error', 'Popup blocked. Please allow popups to connect GitHub.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'OAuth initiation failed');
    }
  };

  // Connect via Personal Access Token
  const handleConnectPat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;

    setIsPatSubmitting(true);
    try {
      const res = await githubApi.loginWithToken(patInput.trim());
      showToast('success', `Connected to GitHub as @${res.user.login}!`);
      setPatInput('');
      checkStatus();
    } catch (err: any) {
      showToast('error', err.message || 'Invalid GitHub token');
    } finally {
      setIsPatSubmitting(false);
    }
  };

  // Disconnect GitHub
  const handleDisconnect = async () => {
    try {
      await githubApi.logout();
      showToast('info', 'Disconnected GitHub account.');
      setSelectedRepo(null);
      setSelectedPr(null);
      setRepositories([]);
      checkStatus();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to disconnect');
    }
  };

  // Select Repository
  const handleSelectRepo = async (repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setSelectedBranch(repo.default_branch);
    setSelectedPr(null);
    setPrReview(null);
    setActiveRepoTab('pulls');

    // Load branches & PRs
    loadRepoBranches(repo.owner.login, repo.name);
    loadRepoPulls(repo.owner.login, repo.name, prFilter);
    loadRepoCommits(repo.owner.login, repo.name, repo.default_branch);
    loadRepoTree(repo.owner.login, repo.name, repo.default_branch);
  };

  const loadRepoBranches = async (owner: string, repo: string) => {
    try {
      const b = await githubApi.getBranches(owner, repo);
      setBranches(b);
    } catch (err) {
      console.warn(err);
    }
  };

  const loadRepoCommits = async (owner: string, repo: string, branch?: string) => {
    try {
      const c = await githubApi.getCommits(owner, repo, branch);
      setCommits(c);
    } catch (err) {
      console.warn(err);
    }
  };

  const loadRepoTree = async (owner: string, repo: string, ref: string) => {
    setIsLoadingTree(true);
    try {
      const t = await githubApi.getTree(owner, repo, ref);
      setTreeItems(t);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoadingTree(false);
    }
  };

  const loadRepoPulls = async (owner: string, repo: string, state: 'open' | 'closed' | 'all') => {
    setIsLoadingPulls(true);
    try {
      const pulls = await githubApi.listPullRequests(owner, repo, state);
      setPullRequests(pulls);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load pull requests');
    } finally {
      setIsLoadingPulls(false);
    }
  };

  // Select Pull Request
  const handleSelectPr = async (pr: GitHubPullRequest) => {
    setSelectedPr(pr);
    setPrReview(null);
    setLocalReport(null);
    setIsLoadingPrDetails(true);

    try {
      const details = await githubApi.getPullRequestDetails(
        selectedRepo!.owner.login,
        selectedRepo!.name,
        pr.number
      );
      setPrDetails(details);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load PR details');
    } finally {
      setIsLoadingPrDetails(false);
    }
  };

  // Run AI Review or Local Security on Pull Request
  const handleRunPrReview = async (forceRefresh: boolean = false) => {
    if (!selectedRepo || !selectedPr) return;

    // Check Privacy Setting
    if (!sendCodeToGemini) {
      // Local analysis only! No cloud transfer.
      showToast('info', 'Cloud AI analysis disabled. Running 100% offline local security scanner on changed diffs.');
      const allDiffText = (prDetails?.files || []).map((f) => f.patch || '').join('\n');
      const scan = scanCodeLocally(allDiffText, 'diff');
      setLocalReport(scan);

      // Create a localized result
      const localResult: PullRequestReviewResult = {
        pullNumber: selectedPr.number,
        headSha: selectedPr.head.sha,
        reviewedAt: new Date().toISOString(),
        overallScore: scan.overallScore,
        assessment:
          scan.stats.criticalCount > 0
            ? 'Critical issues detected'
            : scan.issues.length > 0
            ? 'Changes require attention'
            : 'Changes look good',
        summary: `100% Offline Local Analysis: Checked ${prDetails?.files.length || 0} changed files. ${
          scan.stats.secretsFound
        } secrets and ${scan.stats.vulnerabilitiesFound} vulnerabilities found. Zero bytes sent to Gemini.`,
        stats: {
          criticalCount: scan.stats.criticalCount,
          highCount: scan.stats.highCount,
          mediumCount: scan.stats.mediumCount,
          lowCount: scan.stats.lowCount,
          suggestionCount: 0,
        },
        findings: scan.issues.map((iss, i) => ({
          id: `local-${i + 1}`,
          file: 'Changed Patch',
          lineNumber: iss.lineNumber,
          severity: iss.severity,
          category: 'Security',
          explanation: iss.description,
          suggestedFix: iss.remediation,
          correctedCodeSnippet: iss.safeReplacementSnippet,
        })),
        isLocalOnly: true,
      };
      setPrReview(localResult);
      return;
    }

    setIsReviewing(true);
    try {
      const res = await githubApi.reviewPullRequest(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedPr.number,
        forceRefresh
      );
      setPrReview(res);
      showToast('success', `AI Review complete: ${res.assessment}`);
    } catch (err: any) {
      showToast('error', err.message || 'AI Review failed');
    } finally {
      setIsReviewing(false);
    }
  };

  // Open file content preview & load in editor
  const handleOpenFile = async (item: GitHubFileItem) => {
    if (!selectedRepo) return;
    setSelectedFilePath(item.path);
    setIsLoadingFile(true);

    try {
      const data = await githubApi.getFileContent(
        selectedRepo.owner.login,
        selectedRepo.name,
        item.path,
        selectedBranch
      );
      setFileContent(data.content);
    } catch (err: any) {
      showToast('error', err.message || 'Could not load file');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSendFileToEditor = () => {
    if (!selectedFilePath || fileContent === null) return;
    const ext = selectedFilePath.split('.').pop() || 'ts';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'cpp',
      cs: 'csharp',
      php: 'php',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json',
    };
    const language = langMap[ext.toLowerCase()] || 'text';
    const cleanFileName = selectedFilePath.split('/').pop() || selectedFilePath;

    onOpenFileInEditor(cleanFileName, fileContent, language);
    showToast('success', `Loaded "${cleanFileName}" into CodePilot Editor!`);
  };

  // Explain Repository Architecture with Gemini
  const handleExplainRepository = async () => {
    if (!selectedRepo) return;
    if (!sendCodeToGemini) {
      showToast('info', 'Cloud AI analysis disabled. Enable "Send repository code to Gemini" to use repository explanation.');
      return;
    }

    setIsExplainingRepo(true);
    try {
      // Find README if available in tree
      const readmeItem = treeItems.find((i) => i.path.toLowerCase().startsWith('readme'));
      let contextText = `Repository: ${selectedRepo.full_name}\nDescription: ${selectedRepo.description || 'None'}\nDefault Branch: ${selectedRepo.default_branch}\nStars: ${selectedRepo.stargazers_count}\nLanguage: ${selectedRepo.language || 'Unknown'}\n`;

      if (readmeItem) {
        const readme = await githubApi.getFileContent(selectedRepo.owner.login, selectedRepo.name, readmeItem.path, selectedBranch);
        contextText += `\nREADME snippet:\n${readme.content.slice(0, 10000)}`;
      } else {
        contextText += `\nTop Files:\n${treeItems.slice(0, 30).map((t) => t.path).join('\n')}`;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Provide a concise architectural overview and technical stack explanation of this repository based on this context:\n${contextText}`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to explain repository');
      const data = await res.json();
      setRepoExplanation(data.reply);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to explain repository');
    } finally {
      setIsExplainingRepo(false);
    }
  };

  // Prepare and open comment confirmation modal
  const handleDraftComment = (finding: PullRequestFinding) => {
    if (!selectedRepo || !selectedPr) return;

    let body = `### 🤖 CodePilot Finding: [${finding.severity}] ${finding.category}\n\n`;
    body += `**Description:** ${finding.explanation}\n\n`;
    body += `**Suggested Fix:** ${finding.suggestedFix}\n\n`;
    if (finding.correctedCodeSnippet) {
      body += `\`\`\`${selectedRepo.language?.toLowerCase() || ''}\n${finding.correctedCodeSnippet}\n\`\`\`\n`;
    }

    setCommentDraft({
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      pullNumber: selectedPr.number,
      body,
      path: finding.file,
      line: finding.lineNumber,
      commitId: selectedPr.head.sha,
    });
    setIsCommentModalOpen(true);
  };

  const handleConfirmPostComment = async (draft: GitHubCommentDraft) => {
    setIsPostingComment(true);
    try {
      const res = await githubApi.postComment(
        draft.owner,
        draft.repo,
        draft.pullNumber,
        draft.body,
        draft.path,
        draft.line,
        draft.commitId
      );
      setIsCommentModalOpen(false);
      showToast('success', `Review comment successfully posted to GitHub PR #${draft.pullNumber}!`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRepos = repositories.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#101115] text-[#e2e8f0] overflow-hidden select-none font-sans">
      {/* Top Header / Account Status Bar */}
      <div className="h-14 px-6 border-b border-[#232431] bg-[#14151b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">GitHub Integration</h2>
              {configStatus?.isAuthenticated ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Repository explorer, Pull Request AI reviews, and verified GitHub commenting
            </p>
          </div>
        </div>

        {/* Right side controls: Privacy Mode Switch & User Profile */}
        <div className="flex items-center gap-3">
          {/* Privacy Switch (Requirement #9) */}
          <div
            title="Privacy Guard: When OFF, repository code is never sent to Gemini. Only local offline scans run."
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b1c26] border border-zinc-800 text-xs"
          >
            <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">
              Gemini Cloud AI:
            </span>
            <button
              onClick={() => {
                setSendCodeToGemini(!sendCodeToGemini);
                showToast(
                  !sendCodeToGemini ? 'success' : 'info',
                  !sendCodeToGemini
                    ? 'Cloud AI analysis enabled.'
                    : 'Cloud AI disabled. Source code remains strictly local.'
                );
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                sendCodeToGemini ? 'bg-emerald-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  sendCodeToGemini ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-[11px] font-bold font-mono ${
                sendCodeToGemini ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {sendCodeToGemini ? 'ON' : 'OFF (LOCAL)'}
            </span>
          </div>

          {configStatus?.isAuthenticated && configStatus.user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <img
                src={configStatus.user.avatar_url}
                alt={configStatus.user.login}
                className="w-7 h-7 rounded-full border border-zinc-700"
              />
              <div className="hidden md:block text-left text-xs leading-tight">
                <div className="font-semibold text-white">@{configStatus.user.login}</div>
                <div className="text-[10px] text-zinc-500">
                  {configStatus.user.public_repos} repos
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                title="Disconnect GitHub"
                className="p-1.5 rounded-lg hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      {!configStatus?.isAuthenticated ? (
        /* CONNECT SCREEN (OAuth & PAT Setup) */
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-3xl mx-auto space-y-6 w-full">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto shadow-xl">
              <Github className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Connect Your GitHub Account</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Review Pull Requests, explore repository files, detect bugs and security flaws, and post verified feedback back to GitHub.
            </p>
          </div>

          {/* Connect Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Option A: OAuth Popup */}
            <div className="p-5 rounded-2xl bg-[#161720] border border-[#2b2d3d] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>One-Click OAuth Connect</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sign in with GitHub in a secure popup window. Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
                </p>
              </div>

              <button
                onClick={handleConnectOAuth}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-900 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>Connect with GitHub OAuth</span>
              </button>
            </div>

            {/* Option B: Personal Access Token */}
            <div className="p-5 rounded-2xl bg-[#161720] border border-[#2b2d3d] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>Personal Access Token (PAT)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Connect instantly without configuring an OAuth App using a GitHub Classic or Fine-grained token (`repo` scope).
                </p>
              </div>

              <form onSubmit={handleConnectPat} className="space-y-2">
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-[#0f1016] border border-zinc-700 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isPatSubmitting || !patInput.trim()}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPatSubmitting ? 'Verifying Token...' : 'Connect with Token'}
                </button>
              </form>
            </div>
          </div>

          {/* OAuth Setup Instructions & Exact Callback URLs (Skill Requirement) */}
          <div className="w-full p-5 rounded-2xl bg-[#14151e] border border-[#262837] space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>OAuth Application Setup Guide</span>
            </div>

            <p className="text-zinc-400 leading-relaxed">
              To enable GitHub OAuth, create a GitHub OAuth App at{' '}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline inline-flex items-center gap-0.5"
              >
                <span>github.com/settings/developers</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              :
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#0e0f14] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500">
                  Required Authorization Callback URL:
                </span>
                <div className="flex items-center justify-between font-mono text-cyan-300 text-[11px] truncate">
                  <span className="truncate">{configStatus?.redirectUri || 'https://.../api/github/callback'}</span>
                  <button
                    onClick={() => handleCopy(configStatus?.redirectUri || '', 'cbUrl')}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    {copiedText === 'cbUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e0f14] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500">
                  Environment Variables:
                </span>
                <div className="font-mono text-zinc-300 text-[11px] space-y-0.5">
                  <div>GITHUB_CLIENT_ID=your_client_id</div>
                  <div>GITHUB_CLIENT_SECRET=your_client_secret</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !selectedRepo ? (
        /* REPOSITORIES DASHBOARD */
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Search & Actions Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Your Repositories</h3>
              <p className="text-xs text-zinc-400">
                Select a repository to inspect code, review Pull Requests, and analyze architecture
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#181923] border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={loadRepositories}
                disabled={isLoadingRepos}
                title="Refresh Repositories"
                className="p-2 rounded-lg bg-[#181923] hover:bg-[#222432] text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Banner */}
          {!sendCodeToGemini && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Cloud AI analysis disabled.</strong> Source code remains local. Pull Request reviews run via offline regex security scanner.
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Zero Telemetry
              </span>
            </div>
          )}

          {/* Repositories Grid */}
          {isLoadingRepos ? (
            <div className="py-20 text-center space-y-2 text-zinc-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
              <p>Fetching repositories from GitHub...</p>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-zinc-400 text-xs">
              <FolderGit2 className="w-8 h-8 mx-auto text-zinc-600" />
              <p>No repositories found matching "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className="p-4 rounded-xl bg-[#161720] hover:bg-[#1c1d28] border border-[#262837] hover:border-purple-500/40 transition-all cursor-pointer flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                        {repo.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          repo.private
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-1.5 font-mono">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-zinc-300">{repo.language}</span>
                        </span>
                      )}
                    </div>
                    <span>{repo.default_branch}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* REPOSITORY VIEW (Explorer & Pull Requests) */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Repository Subheader */}
          <div className="px-6 py-3 border-b border-[#232431] bg-[#121318] flex items-center justify-between shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRepo(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Back to all repositories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-zinc-400">{selectedRepo.owner.login} /</span>
                <span className="text-sm font-bold text-white">{selectedRepo.name}</span>
                <a
                  href={selectedRepo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Branch Selector */}
              {branches.length > 0 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-xs">
                  <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => {
                      setSelectedBranch(e.target.value);
                      loadRepoCommits(selectedRepo.owner.login, selectedRepo.name, e.target.value);
                      loadRepoTree(selectedRepo.owner.login, selectedRepo.name, e.target.value);
                    }}
                    className="bg-[#181923] text-zinc-300 text-xs rounded border border-zinc-800 px-2 py-0.5 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* AI Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExplainRepository}
                disabled={isExplainingRepo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-800/60 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{isExplainingRepo ? 'Analyzing Stack...' : 'Explain Repository'}</span>
              </button>
            </div>
          </div>

          {/* Repo Navigation Tabs */}
          <div className="flex border-b border-[#232431] bg-[#14151b] px-6 gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveRepoTab('pulls')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeRepoTab === 'pulls'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Pull Requests ({pullRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveRepoTab('files')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeRepoTab === 'files'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>File Explorer</span>
            </button>

            <button
              onClick={() => setActiveRepoTab('commits')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeRepoTab === 'commits'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Commits ({commits.length})</span>
            </button>
          </div>

          {/* TAB 1: PULL REQUESTS & PR AI REVIEW (Requirement #5, #6, #7, #8) */}
          {activeRepoTab === 'pulls' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: PR List */}
              <div className="w-80 border-r border-[#232431] bg-[#121319] flex flex-col">
                <div className="p-3 border-b border-[#232431] flex items-center justify-between text-xs">
                  <div className="flex gap-1">
                    {(['open', 'closed', 'all'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setPrFilter(s);
                          loadRepoPulls(selectedRepo.owner.login, selectedRepo.name, s);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] uppercase font-semibold cursor-pointer ${
                          prFilter === s ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => loadRepoPulls(selectedRepo.owner.login, selectedRepo.name, prFilter)}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingPulls ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {isLoadingPulls ? (
                    <div className="p-6 text-center text-xs text-zinc-500">Loading PRs...</div>
                  ) : pullRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      No {prFilter} Pull Requests found.
                    </div>
                  ) : (
                    pullRequests.map((pr) => {
                      const isSel = selectedPr?.id === pr.id;
                      return (
                        <div
                          key={pr.id}
                          onClick={() => handleSelectPr(pr)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                            isSel
                              ? 'bg-purple-950/30 border-purple-500/50 text-white'
                              : 'bg-[#161722] hover:bg-[#1a1b28] border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-purple-400 font-bold">#{pr.number}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(pr.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold line-clamp-2 leading-snug">
                            {pr.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <span>@{pr.user?.login}</span>
                            <span>•</span>
                            <span className="font-mono text-zinc-500">{pr.head.ref}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Selected PR Details & AI Review */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedPr ? (
                  <>
                    {/* PR Header Banner */}
                    <div className="p-5 rounded-2xl bg-[#151620] border border-[#27293a] space-y-4">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-purple-400">
                              #{selectedPr.number}
                            </span>
                            <h3 className="text-base font-bold text-white">{selectedPr.title}</h3>
                            <a
                              href={selectedPr.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-500 hover:text-white"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Authored by <strong>@{selectedPr.user?.login}</strong> • Target:{' '}
                            <code className="text-purple-300 font-mono">{selectedPr.base.ref}</code> &larr;{' '}
                            <code className="text-cyan-300 font-mono">{selectedPr.head.ref}</code>
                          </p>
                        </div>

                        {/* Primary Review Action Buttons (Requirement #5 & #8) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRunPrReview(false)}
                            disabled={isReviewing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isReviewing ? 'Analyzing Diffs...' : prReview ? 'Re-run AI Review' : 'Run AI Review'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Changed Files summary */}
                      {prDetails && (
                        <div className="flex items-center gap-4 text-xs pt-3 border-t border-zinc-800 text-zinc-400">
                          <div>
                            <strong>{prDetails.files.length}</strong> changed files
                          </div>
                          <div className="text-emerald-400 font-mono">
                            +{prDetails.files.reduce((acc, f) => acc + f.additions, 0)}
                          </div>
                          <div className="text-rose-400 font-mono">
                            -{prDetails.files.reduce((acc, f) => acc + f.deletions, 0)}
                          </div>
                          {prReview && (
                            <div className="text-[10px] text-zinc-500 ml-auto font-mono">
                              Reviewed: {new Date(prReview.reviewedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI REVIEW SUMMARY (Requirement #6) */}
                    {prReview && (
                      <div className="p-5 rounded-2xl bg-[#171824] border border-[#2b2d40] space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                              AI Review Summary
                            </span>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                prReview.assessment === 'Changes look good'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : prReview.assessment === 'Critical issues detected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {prReview.assessment}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1 font-mono">
                            <span className="text-xs text-zinc-400">Health:</span>
                            <span className="text-xl font-extrabold text-cyan-400">
                              {prReview.overallScore}
                            </span>
                            <span className="text-xs text-zinc-500">/ 100</span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed">{prReview.summary}</p>

                        {/* Counts (Requirement #6) */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-center">
                            <div className="text-[10px] uppercase font-bold text-red-400">Critical</div>
                            <div className="text-lg font-mono font-extrabold">
                              {prReview.stats.criticalCount}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 text-orange-300 text-center">
                            <div className="text-[10px] uppercase font-bold text-orange-400">High</div>
                            <div className="text-lg font-mono font-extrabold">
                              {prReview.stats.highCount}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-center">
                            <div className="text-[10px] uppercase font-bold text-amber-400">Medium</div>
                            <div className="text-lg font-mono font-extrabold">
                              {prReview.stats.mediumCount}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/30 text-sky-300 text-center">
                            <div className="text-[10px] uppercase font-bold text-sky-400">Low</div>
                            <div className="text-lg font-mono font-extrabold">
                              {prReview.stats.lowCount}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-center col-span-2 sm:col-span-1">
                            <div className="text-[10px] uppercase font-bold text-emerald-400">Suggestions</div>
                            <div className="text-lg font-mono font-extrabold">
                              {prReview.stats.suggestionCount}
                            </div>
                          </div>
                        </div>

                        {/* Findings List (Requirement #5 & #7) */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Findings & Actionable Improvements ({prReview.findings.length})
                          </h4>

                          {prReview.findings.length === 0 ? (
                            <div className="p-8 text-center text-xs text-emerald-400 bg-[#121319] rounded-xl border border-zinc-800">
                              ✓ No major issues detected in this diff. Code is in good shape.
                            </div>
                          ) : (
                            prReview.findings.map((f) => (
                              <div
                                key={f.id}
                                className="p-4 rounded-xl bg-[#14151e] border border-[#27293a] space-y-3"
                              >
                                <div className="flex items-start justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                                        f.severity === 'Critical'
                                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                          : f.severity === 'High'
                                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                          : f.severity === 'Medium'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                      }`}
                                    >
                                      {f.severity}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                                      {f.category}
                                    </span>
                                    <span className="text-xs font-mono text-purple-300 font-semibold">
                                      {f.file}
                                      {f.lineNumber ? `:${f.lineNumber}` : ''}
                                    </span>
                                  </div>

                                  {/* Create GitHub Comment Button (Requirement #7) */}
                                  <button
                                    onClick={() => handleDraftComment(f)}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer border border-zinc-700"
                                  >
                                    <Send className="w-3 h-3 text-purple-400" />
                                    <span>Create GitHub Comment</span>
                                  </button>
                                </div>

                                <p className="text-xs text-zinc-300 leading-relaxed">{f.explanation}</p>

                                <div className="p-3 rounded-lg bg-[#0e0f15] border border-zinc-800 space-y-1.5 text-xs">
                                  <div className="text-[10px] font-bold uppercase text-emerald-400">
                                    Suggested Fix:
                                  </div>
                                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                                    {f.suggestedFix}
                                  </p>
                                  {f.correctedCodeSnippet && (
                                    <pre className="p-2 rounded bg-black/60 font-mono text-[10px] text-emerald-300 overflow-x-auto border border-zinc-800">
                                      <code>{f.correctedCodeSnippet}</code>
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Changed Files Diffs List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Modified Files ({prDetails?.files.length || 0})
                      </h4>

                      {isLoadingPrDetails ? (
                        <div className="p-8 text-center text-xs text-zinc-500">Loading diffs...</div>
                      ) : (
                        prDetails?.files.map((file) => (
                          <div
                            key={file.filename}
                            className="p-3.5 rounded-xl bg-[#14151e] border border-[#262837] space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-zinc-200 font-semibold truncate">
                                {file.filename}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="text-emerald-400">+{file.additions}</span>
                                <span className="text-rose-400">-{file.deletions}</span>
                              </div>
                            </div>

                            {file.patch ? (
                              <pre className="p-3 rounded-lg bg-[#0a0a0f] border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-48">
                                <code>{file.patch}</code>
                              </pre>
                            ) : (
                              <div className="text-zinc-500 text-[11px]">Binary file or large diff</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-24 text-center space-y-2 text-zinc-500 text-xs">
                    <GitPullRequest className="w-10 h-10 mx-auto text-zinc-700" />
                    <p>Select a Pull Request from the left sidebar to run an AI Review.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FILE EXPLORER (Requirement #3 & #4) */}
          {activeRepoTab === 'files' && (
            <div className="flex-1 flex overflow-hidden">
              {/* File Tree */}
              <div className="w-72 border-r border-[#232431] bg-[#121319] overflow-y-auto p-2 space-y-0.5 text-xs">
                {isLoadingTree ? (
                  <div className="p-6 text-center text-zinc-500">Loading tree...</div>
                ) : (
                  treeItems.map((item) => (
                    <div
                      key={item.path}
                      onClick={() => item.type === 'blob' && handleOpenFile(item)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                        selectedFilePath === item.path
                          ? 'bg-purple-600/20 text-purple-300 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b24]'
                      }`}
                    >
                      {item.type === 'tree' ? (
                        <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">{item.path}</span>
                    </div>
                  ))
                )}
              </div>

              {/* File Content Preview */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0e12]">
                {selectedFilePath ? (
                  <>
                    <div className="h-10 px-4 border-b border-zinc-800 flex items-center justify-between text-xs bg-[#13141a]">
                      <span className="font-mono text-zinc-300 truncate">{selectedFilePath}</span>
                      <button
                        onClick={handleSendFileToEditor}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>Open in CodePilot Editor</span>
                      </button>
                    </div>

                    <div className="flex-1 p-4 overflow-auto">
                      {isLoadingFile ? (
                        <div className="text-zinc-500 text-xs">Loading content...</div>
                      ) : (
                        <pre className="font-mono text-xs text-zinc-200 whitespace-pre leading-relaxed">
                          <code>{fileContent}</code>
                        </pre>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                    Select a source file to view contents or load into editor.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMITS */}
          {activeRepoTab === 'commits' && (
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Recent Commits on {selectedBranch}
              </h4>
              <div className="space-y-2">
                {commits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-3.5 rounded-xl bg-[#151620] border border-zinc-800 flex items-start justify-between text-xs gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-zinc-200">{c.commit.message}</div>
                      <div className="text-[11px] text-zinc-500">
                        {c.commit.author.name} • {new Date(c.commit.author.date).toLocaleString()}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-purple-300 shrink-0">
                      {c.sha.slice(0, 7)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comment Confirmation Modal (Requirement #7) */}
      <CommentConfirmModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        draft={commentDraft}
        onConfirmPost={handleConfirmPostComment}
        isPosting={isPostingComment}
      />

      {/* Repo Architecture Explanation Modal */}
      {repoExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#15161f] border border-[#2b2d3d] rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Repository Architectural Overview</h3>
              </div>
              <button
                onClick={() => setRepoExplanation(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto text-xs text-zinc-300 leading-relaxed space-y-2 font-sans whitespace-pre-line">
              {repoExplanation}
            </div>
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setRepoExplanation(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
