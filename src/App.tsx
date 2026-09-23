import { useState, useEffect, useCallback } from 'react';
import {
  AgentMode,
  AgentState,
  Message,
  PreviewArtifact,
  ProjectInfo,
  GitStatus,
  PermissionPolicy,
  AgentConfig,
} from './types';
import { Language, translations, SUPPORTED_LANGUAGES } from './utils/translations';
import { Sidebar } from './components/Sidebar';
import { CodedAiChatCard } from './components/CodedAiChatCard';
import { playSoftChimeSound } from './utils/audioNotification';
import { LiveArtifactPreview } from './components/LiveArtifactPreview';
import { AnimatedCodeDrawer } from './components/AnimatedCodeDrawer';
import { TerminalPanel } from './components/TerminalPanel';
import { FileExplorer } from './components/FileExplorer';
import { DiffViewerModal } from './components/DiffViewerModal';
import { FreebuffWorkspacesModal } from './components/FreebuffWorkspacesModal';
import { FreebuffQueueDrawer } from './components/FreebuffQueueDrawer';
import { SkillsModal } from './components/SkillsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { FuelApiKeyView } from './components/FuelApiKeyView';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { LocalBridgeModal } from './components/LocalBridgeModal';
import { LiquidGlassBackground } from './components/LiquidGlassBackground';
import { SiriLiveSpeakerOverlay } from './components/SiriLiveSpeakerOverlay';
import { voiceAgent } from './services/voiceAgent';
import {
  Sparkles,
  Globe,
  Settings as SettingsIcon,
  User,
  Fuel,
  Terminal as TerminalIcon,
  Bot,
} from 'lucide-react';

export default function App() {
  // Core App State
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codgar_lang') as Language) || 'fa';
  });
  const t = translations[language] || translations.en;
  const isFa = language === 'fa';
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [activeWorker, setActiveWorker] = useState<'coder' | 'writer' | null>(null);

  // Active Artifact for Live Preview
  const [activeArtifact, setActiveArtifact] = useState<PreviewArtifact | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // System & Workspace Data
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);

  // Modals & Panels State
  const [isFuelActive, setIsFuelActive] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState<boolean>(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState<boolean>(false);
  const [codeDrawerTab, setCodeDrawerTab] = useState<'editor' | 'terminal' | 'files' | 'agents'>('editor');
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState<boolean>(false);
  const [isLocalBridgeOpen, setIsLocalBridgeOpen] = useState<boolean>(false);

  // Voice Engine State
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [siriVisualActive, setSiriVisualActive] = useState<boolean>(false);

  // Toggle helper for Live Preview: if artifact is null, create a stylish live demo artifact
  const toggleLivePreview = () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
    } else {
      if (!activeArtifact) {
        setActiveArtifact({
          id: `art-live-${Date.now()}`,
          title: isFa ? 'برنامه واکنش‌گرا و مدرن کدگر' : 'Codgar Live Interactive Workspace',
          type: 'react',
          language: 'react',
          code: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('Active');
  const [items, setItems] = useState([
    { id: 1, name: 'AI Core Engine', ready: true },
    { id: 2, name: 'Live Sandbox Compiler', ready: true },
    { id: 3, name: 'Terminal Execution Pipeline', ready: true },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Codgar Sandbox Live</h2>
              <p className="text-xs text-emerald-400 font-mono">Status: {status}</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60">
            React 18 + Tailwind
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Interactive Click Counter</p>
              <h3 className="text-2xl font-black text-white font-mono">{count}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCount(c => c - 1)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center"
              >
                -
              </button>
              <button
                onClick={() => setCount(c => c + 1)}
                className="px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center justify-center shadow-md shadow-blue-600/30"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-xs text-slate-400 mb-2 font-mono">Workspace Pipeline Checks</p>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-emerald-400 font-mono font-bold">✓ READY</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
          timestamp: Date.now(),
        });
      }
      setIsPreviewOpen(true);
    }
  };

  // Permission & Agent Config
  const [policy, setPolicy] = useState<PermissionPolicy>({
    requireApprovalForCommands: false,
    requireApprovalForFileWrite: false,
    requireApprovalForGitCommit: false,
    allowedCommands: ['npm', 'node', 'python3', 'git', 'ls', 'cat', 'cargo', 'go'],
  });

  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    maxOutputTokens: 8192,
    systemPromptAdditions: '',
    autoCompactContext: true,
    bashTimeoutSeconds: 30,
    verboseTelemetry: true,
    soundtrackAutoPlay: false,
    typewriterSpeed: 5,
  });

  // System & Workspace Data Fetcher
  const refreshWorkspaceData = useCallback(async () => {
    try {
      const [projRes, gitRes] = await Promise.all([
        fetch('/api/project/info'),
        fetch('/api/git/status'),
      ]);
      const projData = await projRes.json();
      const gitData = await gitRes.json();
      if (projData.success) setProjectInfo(projData.info);
      if (gitData.success) setGitStatus(gitData);
    } catch (err) {
      console.warn('Workspace sync note:', err);
    }
  }, []);

  const getLocalizedWelcome = (lang: Language): string => {
    switch (lang) {
      case 'fa':
        return `سلام! من **کدگر** هستم؛ دستیار هوشمند برنامه‌نویسی شما.\n\nچه پروژه یا فیچری مد نظرتان است؟ درخواست خود را بنویسید یا با دکمه ضبط صدا بیان کنید تا آماده شود.`;
      case 'es':
        return `¡Hola! Soy **Codgar**, tu asistente de programación inteligente.\n\n¿Qué proyecto o función te gustaría desarrollar hoy? Escribe tu solicitud o háblala para comenzar.`;
      case 'fr':
        return `Bonjour ! Je suis **Codgar**, votre assistant de programmation intelligent.\n\nQuel projet ou fonctionnalité souhaitez-vous concevoir aujourd'hui ? Écrivez votre demande ou énoncez-la pour commencer.`;
      case 'ru':
        return `Привет! Я **Codgar**, ваш интеллектуальный помощник по программированию.\n\nКакой проект или функционал вы хотите разработать сегодня? Напишите запрос или продиктуйте его голосом.`;
      case 'zh':
        return `你好！我是 **Codgar**，您的智能编程助手。\n\n今天您想构建或开发什么项目？请在下方输入您的需求或使用语音录音开始。`;
      case 'hi':
        return `नमस्ते! मैं **Codgar** हूँ, आपका बुद्धिमान कोडिंग सहायक।\n\nआज आप कौन सा प्रोजेक्ट या फीचर बनाना चाहते हैं? अपना अनुरोध लिखें یا माइक से बोलें।`;
      case 'pt':
        return `Olá! Eu sou o **Codgar**, seu assistente de programação inteligente.\n\nQual projeto ou funcionalidade você gostaria de construir hoje? Digite sua solicitação ou fale para começar.`;
      case 'en':
      default:
        return `Hello! I am **Codgar**, your intelligent coding assistant.\n\nWhat would you like to build or work on today? Type your request or speak to get started.`;
    }
  };

  // Real-Time Chat Translation State
  const [isTranslatingHistory, setIsTranslatingHistory] = useState(false);

  // Save Language Preference & Translate Existing Chat History in Place
  const handleSelectLanguage = async (newLang: Language) => {
    if (newLang === language) return;
    setLanguage(newLang);
    localStorage.setItem('codgar_lang', newLang);

    // If chat only contains the welcome message, swap it cleanly
    if (messages.length <= 1 && (messages.length === 0 || messages[0]?.id === 'msg-welcome')) {
      setMessages([
        {
          id: 'msg-welcome',
          role: 'agent',
          content: getLocalizedWelcome(newLang),
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // Translate full active conversation in place across any language (fa -> en -> es -> ru -> fr -> etc.)
    setIsTranslatingHistory(true);
    try {
      const res = await fetch('/api/translate/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content || m.text || '' })),
          targetLanguage: newLang,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.translatedMessages) && data.translatedMessages.length > 0) {
        const transMap = new Map<string, string>();
        data.translatedMessages.forEach((tm: any) => {
          if (tm.id && typeof tm.content === 'string') {
            transMap.set(String(tm.id), tm.content);
          }
        });
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === 'msg-welcome') {
              const wel = getLocalizedWelcome(newLang);
              return { ...m, content: wel, text: wel };
            }
            if (transMap.has(m.id)) {
              const trans = transMap.get(m.id)!;
              return { ...m, content: trans, text: trans };
            }
            return m;
          })
        );
      }
    } catch (translateErr) {
      console.warn('Chat translation note:', translateErr);
    } finally {
      setIsTranslatingHistory(false);
    }
  };

  // Initial Data Fetching & Welcome Message (only on mount)
  useEffect(() => {
    refreshWorkspaceData();
    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: 'msg-welcome',
            role: 'agent',
            content: getLocalizedWelcome(language),
            timestamp: Date.now(),
          },
        ];
      }
      return prev;
    });
  }, [refreshWorkspaceData]);

  // Quick client-side check to detect coding intent for immediate UI feedback
  const [activeTaskIntent, setActiveTaskIntent] = useState<'chat' | 'coding'>('chat');

  // Handle Send Message to AI Agent
  const handleSendMessage = async (
    text: string,
    options?: { mode?: AgentMode; approvedCoding?: boolean; pendingCodingPrompt?: string } | AgentMode
  ) => {
    if (!text.trim() || isExecuting) return;

    const approvedCoding = typeof options === 'object' && options !== null ? Boolean(options.approvedCoding) : false;
    const pendingCodingPrompt = typeof options === 'object' && options !== null ? options.pendingCodingPrompt : undefined;
    const requestedMode = typeof options === 'string' ? options : (options?.mode || 'auto');

    // Intent detection: only considered a confirmed coding prompt if explicitly approved or in formal dev mode
    const isCodingPrompt = approvedCoding || requestedMode === 'agent' || requestedMode === 'plan' || requestedMode === 'review' || requestedMode === 'debug';

    setActiveTaskIntent(isCodingPrompt ? 'coding' : 'chat');

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      isCodingTask: isCodingPrompt,
      taskType: isCodingPrompt ? 'coding' : 'chat',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsExecuting(true);
    setAgentState(isCodingPrompt ? 'planning' : 'writing');
    setActiveWorker(isCodingPrompt ? 'coder' : 'writer');

    try {
      const response = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          language,
          mode: requestedMode,
          approvedCoding,
          pendingCodingPrompt,
          history: messages.slice(-10),
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (parseErr: any) {
        const rawText = await response.text().catch(() => '');
        throw new Error(rawText || `Server returned invalid response (status ${response.status})`);
      }

      if (data && data.success) {
        setAgentState('writing');
        const responseContent =
          data.text ||
          data.response ||
          (typeof data.message === 'string' ? data.message : data.message?.content || data.message?.text) ||
          '';

        const assistantMsg: Message = {
          id: `msg-asst-${Date.now()}`,
          role: 'agent',
          content: responseContent,
          timestamp: Date.now(),
          isCodingTask: data.isCodingTask !== undefined ? data.isCodingTask : isCodingPrompt,
          taskType: data.taskType || (isCodingPrompt ? 'coding' : 'chat'),
          requiresCodingPermission: Boolean(data.requiresCodingPermission),
          pendingCodingPrompt: data.pendingCodingPrompt || text,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        playSoftChimeSound();

        // If backend returned an artifact, update active artifact and automatically open the preview modal
        if (data.artifact) {
          setActiveArtifact(data.artifact);
          if (isCodingPrompt) {
            setIsPreviewOpen(true);
          }
        }

        setAgentState('completed');
        refreshWorkspaceData();
      } else {
        throw new Error(data?.error || 'Execution failed');
      }
    } catch (err: any) {
      console.error('Agent execution error:', err);
      setAgentState('failed');
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'agent',
          content: isFa
            ? `⚠️ خطا در اجرای فرمان: ${err.message || 'مشکل ارتباطی با سرور'}`
            : `⚠️ Execution error: ${err.message || 'Server connection failed'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => {
        setAgentState('idle');
        setActiveWorker(null);
      }, 2000);
    }
  };

  // Voice Recognition Handler
  const toggleVoiceRecording = () => {
    if (siriVisualActive) {
      voiceAgent.stopListening();
      setIsRecordingVoice(false);
      setSiriVisualActive(false);
    } else {
      setIsRecordingVoice(true);
      setSiriVisualActive(true);
    }
  };

  return (
    <div
      dir={isFa ? 'rtl' : 'ltr'}
      className="relative min-h-screen w-full text-slate-800 flex flex-col font-sans overflow-hidden select-none"
    >
      {/* Dynamic Visual Canvas Background */}
      <LiquidGlassBackground />

      {/* Top Application Bar (Luxury Ice-Blue Liquid Glass Hero Bar) */}
      <header className="relative z-30 py-3 px-4 sm:px-6 min-h-[68px] bg-gradient-to-r from-sky-100/50 via-blue-50/60 to-indigo-100/40 backdrop-blur-3xl border-b border-blue-200/60 shadow-[0_8px_32px_rgba(37,99,235,0.07)] flex items-center justify-between transition-all">
        {/* Left: Spacer to keep center alignment */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 w-28" />

        {/* Center: Hero Product Showcase Branding (کُدگر / CODGAR) */}
        <div className="flex items-center justify-center my-auto py-1 px-3 select-none group cursor-pointer">
          <div className="flex items-center gap-2.5 sm:gap-3.5 transition-all duration-300">
            {/* Glossy 3D Blue Bot Agent Icon Badge with 3 Micro Dots Beneath */}
            <div
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl p-[2px] border-2 border-white/95 transition-all duration-700 group-hover:scale-105 active:scale-95 shrink-0 ${
                isExecuting
                  ? 'animate-codgar-thinking'
                  : 'bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 shadow-[0_0_22px_rgba(56,189,248,0.4),0_8px_18px_rgba(37,99,235,0.2)]'
              }`}
            >
              <div className="w-full h-full bg-white rounded-[13px] sm:rounded-[14px] flex flex-col items-center justify-center gap-0.5 shadow-inner relative overflow-hidden pt-0.5">
                <Bot
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-700 ${
                    isExecuting
                      ? 'animate-codgar-icon'
                      : 'text-blue-600 drop-shadow-[0_2px_4px_rgba(37,99,235,0.3)]'
                  }`}
                />
                {/* 3 Micro Dots Under Bot inside Icon */}
                <div className="flex items-center gap-0.5 pb-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#fb7185] shadow-[0_0_3px_#fb7185]" />
                  <span className="w-1 h-1 rounded-full bg-[#94a3b8] shadow-[0_0_3px_#94a3b8]" />
                  <span className="w-1 h-1 rounded-full bg-[#38bdf8] shadow-[0_0_3px_#38bdf8]" />
                </div>
              </div>
            </div>

            {/* 3D Ice-Blue & Crystal-Cyan High-Contrast Title (کدگر / CODGAR) */}
            <div className="relative min-h-[50px] flex items-center justify-center overflow-visible">
              <h1 className="tracking-tight text-3xl sm:text-4xl md:text-[34px] flex items-center leading-none relative">
                {isFa ? (
                  <span className="codgar-3d-persian-logo select-none">
                    کدگر
                  </span>
                ) : (
                  <span className="codgar-3d-latin-logo select-none">
                    CODGAR
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Enhanced Language Selector with Flag & Code */}
          <button
            onClick={() => setIsLanguageOpen(true)}
            className="h-9 px-3 rounded-xl bg-white/95 hover:bg-white border border-sky-200/90 hover:border-sky-400 text-slate-800 hover:text-blue-600 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
            title={t.language}
          >
            <span className="text-base leading-none flex items-center justify-center select-none translate-y-[1px]">{currentLangObj.flag}</span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider leading-none flex items-center">{currentLangObj.code}</span>
          </button>

          {/* Profile Modal Trigger */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="h-9 px-2.5 rounded-xl bg-white/95 hover:bg-white border border-sky-200/90 hover:border-sky-400 text-slate-800 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-95 flex items-center gap-2 group relative"
            title={isFa ? 'پروفایل کاربری' : 'User Profile'}
          >
            {/* User Avatar Mini Squircle */}
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center text-white font-black text-[11px] shadow-xs">
              K
            </div>

            <span className="text-xs font-bold text-slate-800 hidden md:inline">
              {isFa ? 'پروفایل' : 'Profile'}
            </span>
          </button>

          {/* Settings Modal */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-9 w-9 rounded-xl bg-white/95 hover:bg-white border border-sky-200/90 hover:border-sky-400 text-slate-800 hover:text-blue-600 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 flex items-center justify-center"
            title={t.settings}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="relative z-20 flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          onOpenQueue={() => setIsQueueOpen(!isQueueOpen)}
          onOpenTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
          onOpenPreview={toggleLivePreview}
          onOpenBilling={() => setIsProfileOpen(true)}
          onOpenFuel={() => setIsFuelActive(!isFuelActive)}
          isQueueActive={isQueueOpen}
          isTerminalActive={isTerminalOpen}
          isFuelActive={isFuelActive}
          isPreviewActive={isPreviewOpen}
          isExecuting={isExecuting}
          language={language}
        />

        {/* Central Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {isFuelActive ? (
            <FuelApiKeyView
              onBackToChat={() => setIsFuelActive(false)}
              userEmail="arminsh00@gmail.com"
              language={language}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden w-full">
              <CodedAiChatCard
                messages={messages}
                onSendMessage={handleSendMessage}
                isExecuting={isExecuting}
                taskIntent={activeTaskIntent}
                onOpenCodeDrawer={() => setIsCodeDrawerOpen(true)}
                onOpenTerminal={() => setIsTerminalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenSiriVoice={toggleVoiceRecording}
                isRecordingVoice={isRecordingVoice}
                inputText={inputText}
                onInputTextChange={setInputText}
                language={language}
                onTogglePreview={toggleLivePreview}
                isPreviewOpen={isPreviewOpen}
                isTranslatingHistory={isTranslatingHistory}
              />
            </div>
          )}
        </main>
      </div>

      {/* Live Artifact Preview (Interactive App/Code Runner) */}
      {isPreviewOpen && activeArtifact && (
        <LiveArtifactPreview
          artifact={activeArtifact}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          language={language}
        />
      )}

      {/* Animated Code Drawer / Monaco Workspace */}
      <AnimatedCodeDrawer
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
        language={language}
        initialTab={codeDrawerTab}
        messages={messages}
        onRefreshWorkspace={refreshWorkspaceData}
      />

      {/* Terminal Panel */}
      {isTerminalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-6xl h-[88vh] bg-[#070b16] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <TerminalPanel
              isOpen={true}
              language={language}
              messages={messages}
              onToggle={() => setIsTerminalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* File Explorer Modal */}
      <FileExplorer
        isOpen={isFileExplorerOpen}
        onClose={() => setIsFileExplorerOpen(false)}
        onSelectFileForContext={(path) => {
          setInputText((prev) => `${prev} @${path} `);
          setIsFileExplorerOpen(false);
        }}
      />

      {/* Git Diff Viewer Modal */}
      <DiffViewerModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        onRefreshGitStatus={refreshWorkspaceData}
      />

      {/* Workspaces Modal */}
      <FreebuffWorkspacesModal
        isOpen={isWorkspacesOpen}
        onClose={() => setIsWorkspacesOpen(false)}
        language={language}
      />

      {/* Task Queue Drawer */}
      <FreebuffQueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        language={language}
        onEnqueueTask={(prompt) => handleSendMessage(prompt, 'agent')}
        isExecuting={isExecuting}
      />

      {/* Skills Modal */}
      <SkillsModal
        isOpen={isSkillsOpen}
        onClose={() => setIsSkillsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        projectInfo={projectInfo}
        policy={policy}
        onUpdatePolicy={setPolicy}
        agentConfig={agentConfig}
        onUpdateAgentConfig={setAgentConfig}
        language={language}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        language={language}
        currentProject={projectInfo?.name || 'codgar-agent'}
      />

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        currentLanguage={language}
        onSelectLanguage={handleSelectLanguage}
      />

      {/* Local OS Terminal Bridge Modal */}
      <LocalBridgeModal
        isOpen={isLocalBridgeOpen}
        onClose={() => setIsLocalBridgeOpen(false)}
        language={language}
      />

      {/* Siri Voice Visual Overlay */}
      {siriVisualActive && (
        <SiriLiveSpeakerOverlay
          isOpen={siriVisualActive}
          currentInputText={inputText}
          onUpdateInputText={(text) => {
            setInputText(text);
          }}
          onClose={() => {
            setSiriVisualActive(false);
            setIsRecordingVoice(false);
            voiceAgent.stopListening();
          }}
          onSendTranscript={(text) => {
            setInputText('');
            handleSendMessage(text);
            setSiriVisualActive(false);
            setIsRecordingVoice(false);
          }}
          language={language}
        />
      )}
    </div>
  );
}
