import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Maximize2,
  Minimize2,
  X,
  RotateCw,
  Code2,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  MonitorPlay,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Play,
  Terminal,
  Download,
  AlertCircle,
  Cpu,
  CheckCircle2,
  Zap,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { PreviewArtifact } from '../types';

interface Props {
  artifact: PreviewArtifact | null;
  onClose: () => void;
  language?: string;
  isOpen?: boolean;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export function LiveArtifactPreview({
  artifact,
  onClose,
  language = 'fa',
  isOpen = true,
}: Props) {
  const isFa = language === 'fa';
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isCopied, setIsCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [runningExecution, setRunningExecution] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Universal Compiler & Auto-Installer States
  const [autoInstall, setAutoInstall] = useState<boolean>(true);
  const [isInstallingTool, setIsInstallingTool] = useState<boolean>(false);
  const [installStatusMsg, setInstallStatusMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'terminal' | 'code' | 'tools'>('preview');
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [selectedLanguageOverride, setSelectedLanguageOverride] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Detect artifact type and language
  const rawCode = artifact?.code || '';

  const isReactCode =
    rawCode.includes('import React') ||
    rawCode.includes('export default function') ||
    rawCode.includes('useState(') ||
    rawCode.includes('useEffect(') ||
    rawCode.includes('<div') ||
    rawCode.includes('className=') ||
    artifact?.type === 'react';

  const isVueCode =
    rawCode.includes('<template>') ||
    rawCode.includes('createApp(') ||
    artifact?.type === 'vue';

  const isPythonCode =
    rawCode.includes('def ') ||
    rawCode.includes('import sys') ||
    rawCode.includes('print(') ||
    artifact?.type === 'python';

  const isSwiftCode =
    rawCode.includes('import SwiftUI') ||
    rawCode.includes('import Foundation') ||
    artifact?.type === 'swift';

  const isGoCode =
    rawCode.includes('package main') ||
    rawCode.includes('func main()') ||
    artifact?.type === 'go';

  const isRustCode =
    rawCode.includes('fn main()') ||
    rawCode.includes('println!') ||
    artifact?.type === 'rust';

  const isCppCode =
    rawCode.includes('#include <iostream>') ||
    rawCode.includes('#include <stdio.h>') ||
    artifact?.type === 'cpp' ||
    artifact?.type === 'c';

  const detectedLanguage =
    selectedLanguageOverride ||
    (isReactCode
      ? 'react'
      : isVueCode
      ? 'vue'
      : isPythonCode
      ? 'python'
      : isSwiftCode
      ? 'swift'
      : isGoCode
      ? 'go'
      : isRustCode
      ? 'rust'
      : isCppCode
      ? 'cpp'
      : artifact?.type === 'html' || rawCode.includes('<!DOCTYPE') || rawCode.includes('<html')
      ? 'html'
      : 'javascript');

  const isWebArtifact =
    detectedLanguage === 'html' ||
    detectedLanguage === 'react' ||
    detectedLanguage === 'vue' ||
    artifact?.type === 'canvas' ||
    artifact?.type === 'dashboard' ||
    artifact?.type === 'app';

  // Fetch tools status on mount
  useEffect(() => {
    fetchToolsStatus();
  }, []);

  const fetchToolsStatus = async () => {
    try {
      const res = await fetch('/api/compiler/tools');
      const data = await res.json();
      if (data.success && data.tools) {
        setToolsList(data.tools);
        if (typeof data.autoInstallEnabled === 'boolean') {
          setAutoInstall(data.autoInstallEnabled);
        }
      }
    } catch {
      // ignore
    }
  };

  // Reset and execute when artifact changes
  useEffect(() => {
    if (artifact) {
      setIframeKey((prev) => prev + 1);
      setExecutionResult(null);
      setSelectedLanguageOverride(null);

      if (!isWebArtifact) {
        setActiveTab('terminal');
        handleRunScript();
      } else {
        setActiveTab('preview');
      }
    }
  }, [artifact?.id]);

  // Handle ESC key press to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && artifact && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [artifact, isOpen, onClose]);

  const handleCopyCode = () => {
    if (!artifact) return;
    navigator.clipboard.writeText(artifact.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!artifact) return;
    const extMap: Record<string, string> = {
      react: 'tsx',
      vue: 'vue',
      python: 'py',
      swift: 'swift',
      go: 'go',
      rust: 'rs',
      cpp: 'cpp',
      javascript: 'js',
      html: 'html',
    };
    const ext = extMap[detectedLanguage] || 'txt';
    const blob = new Blob([artifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title?.toLowerCase().replace(/\s+/g, '_') || 'app'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Universal Script Runner & Builder with Auto-Install
  const handleRunScript = async (lang = detectedLanguage, forceAutoInstall = autoInstall) => {
    if (!artifact) return;
    setRunningExecution(true);
    try {
      const extMap: Record<string, string> = {
        react: 'tsx',
        vue: 'vue',
        python: 'py',
        swift: 'swift',
        go: 'go',
        rust: 'rs',
        cpp: 'cpp',
        javascript: 'js',
        html: 'html',
      };
      const ext = extMap[lang] || 'js';
      const targetFilePath = `apps/${artifact.title?.toLowerCase().replace(/\s+/g, '_') || 'app'}.${ext}`;

      const res = await fetch('/api/compiler/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          code: artifact.code,
          filePath: targetFilePath,
          autoInstall: forceAutoInstall,
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
      fetchToolsStatus();
    } catch (err: any) {
      setExecutionResult({
        success: false,
        installed: false,
        stderr: err.message,
      });
    } finally {
      setRunningExecution(false);
    }
  };

  // 1-Click Tool Auto-Installer
  const handleInstallTool = async (toolId: string) => {
    setIsInstallingTool(true);
    setInstallStatusMsg(isFa ? `در حال نصب پکیج و کامپایلر ${toolId}...` : `Installing compiler ${toolId}...`);
    try {
      const res = await fetch('/api/compiler/install-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      });
      const data = await res.json();
      if (data.success) {
        setInstallStatusMsg(isFa ? `ابزار ${toolId} با موفقیت نصب شد! در حال اجرای مجدد بیلد...` : `Installed ${toolId}! Re-running build...`);
        await fetchToolsStatus();
        setTimeout(() => {
          handleRunScript(detectedLanguage, true);
          setIsInstallingTool(false);
          setInstallStatusMsg('');
        }, 1000);
      } else {
        setInstallStatusMsg(isFa ? `خطا در نصب: ${data.error}` : `Install error: ${data.error}`);
        setIsInstallingTool(false);
      }
    } catch (err: any) {
      setInstallStatusMsg(err.message);
      setIsInstallingTool(false);
    }
  };

  const toggleAutoInstallMode = async () => {
    const nextState = !autoInstall;
    setAutoInstall(nextState);
    try {
      await fetch('/api/compiler/auto-install-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
    } catch {
      // ignore
    }
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    if (!isWebArtifact || activeTab === 'terminal') {
      handleRunScript();
    }
  };

  const handleOpenNewTab = () => {
    if (!artifact) return;
    const blob = new Blob([generateFullHtml(artifact.code)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Universal Live Sandbox HTML Generator (React 18 / Vue / HTML / Tailwind / Lucide Icons)
  const generateFullHtml = (code: string) => {
    if (artifact?.livePreviewHtml && !artifact.livePreviewHtml.includes('Component compiled successfully.')) {
      return artifact.livePreviewHtml;
    }

    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return code;
    }

    // Direct HTML snippet without React wrapper
    if (
      !isReactCode &&
      !isVueCode &&
      (code.trim().startsWith('<') || code.includes('<div') || code.includes('<section') || code.includes('<header'))
    ) {
      return `<!DOCTYPE html>
<html lang="fa" dir="auto" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artifact?.title || 'Live Website'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Vazirmatn', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
  </style>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen">
  ${code}
  <script>
    if (window.lucide) window.lucide.createIcons();
  </script>
</body>
</html>`;
    }

    if (detectedLanguage === 'react' || isReactCode) {
      // Discover main component name from code
      let mainExportName = 'App';
      const defaultFuncMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
      const defaultNamedMatch = code.match(/export\s+default\s+([A-Za-z0-9_]+)/);
      const anyComponentMatch = code.match(/(?:function|const|var|let)\s+([A-Z][A-Za-z0-9_]*)/);

      if (defaultFuncMatch) {
        mainExportName = defaultFuncMatch[1];
      } else if (defaultNamedMatch) {
        mainExportName = defaultNamedMatch[1];
      } else if (anyComponentMatch) {
        mainExportName = anyComponentMatch[1];
      }

      // Clean import statements from raw React code for in-browser Babel Standalone execution
      let cleanedCode = code
        .replace(/import\s+React(?:\s*,\s*\{([^}]+)\})?\s+from\s+['"][^'"]+['"];?/g, (_, hooks) => {
          return hooks ? `const { ${hooks} } = React;` : '';
        })
        .replace(/import\s*\{([^}]+)\}\s*from\s+['"]lucide-react['"];?/g, (_, icons) => {
          return `const { ${icons} } = window.LucideProxy;`;
        })
        .replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'window.__MainAppExport__ = function $1')
        .replace(/export\s+default\s+/g, 'window.__MainAppExport__ = ')
        .replace(/export\s+(?:const|let|var|function|class)\s+/g, '');

      return `<!DOCTYPE html>
<html lang="fa" dir="auto" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artifact?.title || 'React Live Build'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React 18 & ReactDOM 18 -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- Babel Standalone for live in-browser TSX/JSX compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Vazirmatn', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
  </style>
</head>
<body class="bg-[#090d16] text-slate-100 min-h-screen">
  <div id="root"></div>

  <script>
    window.process = { env: { NODE_ENV: 'production' } };
    
    // Universal Lucide Icon component generator
    function makeLucideIcon(iconName) {
      return function DynamicLucideIcon(props) {
        const { size = 18, className = '', color = 'currentColor', strokeWidth = 2, ...rest } = props || {};
        const iconRef = React.useRef(null);
        React.useEffect(() => {
          if (window.lucide && iconRef.current) {
            window.lucide.createIcons();
          }
        });
        const kebab = (iconName || 'activity').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        return React.createElement('i', {
          ref: iconRef,
          'data-lucide': kebab,
          className: 'inline-flex items-center justify-center ' + className,
          style: { width: size, height: size, display: 'inline-flex', verticalAlign: 'middle', color },
          ...rest
        });
      };
    }

    window.LucideProxy = new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') return makeLucideIcon(prop);
        return makeLucideIcon('activity');
      }
    });

    window.require = function(mod) {
      if (mod === 'react') return React;
      if (mod === 'react-dom' || mod === 'react-dom/client') return ReactDOM;
      if (mod === 'lucide-react') return window.LucideProxy;
      return {};
    };
  </script>

  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;
    const { 
      TrendingUp, TrendingDown, DollarSign, Activity, 
      ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Shield, 
      PieChart, BarChart2, Bell, Wallet, ChevronRight, Check, Copy, X, Plus, Minus, Search,
      Star, Home, ShoppingCart, User, Phone, Mail, MapPin, Compass, Play, Pause, Heart,
      ExternalLink, Smartphone, Tablet, Monitor, Lock, Unlock, Moon, Sun, Layers, Sparkles
    } = window.LucideProxy;

    try {
      ${cleanedCode}

      let TargetApp = window.__MainAppExport__;
      
      if (!TargetApp) {
        try {
          if (typeof ${mainExportName} === 'function') {
            TargetApp = ${mainExportName};
          }
        } catch (_) {}
      }

      if (!TargetApp) {
        try {
          if (typeof App === 'function') TargetApp = App;
          else if (typeof Main === 'function') TargetApp = Main;
          else if (typeof LandingPage === 'function') TargetApp = LandingPage;
          else if (typeof Website === 'function') TargetApp = Website;
          else if (typeof Dashboard === 'function') TargetApp = Dashboard;
        } catch (_) {}
      }

      if (TargetApp) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(TargetApp));
        setTimeout(() => {
          if (window.lucide) window.lucide.createIcons();
        }, 100);
      } else {
        document.getElementById('root').innerHTML = '<div class="p-8 text-center text-slate-300 font-sans"><div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-2xl">⚡</div><h2 class="text-xl font-bold text-white mb-2">برنامه با موفقیت بارگذاری شد</h2><p class="text-sm text-slate-400">نمایش زنده در حال اجرا است.</p></div>';
      }
    } catch (renderError) {
      console.error("React Live Render Error:", renderError);
      document.getElementById('root').innerHTML = '<div class="p-6 bg-rose-950/80 border border-rose-500/60 rounded-2xl m-4 text-rose-200 font-mono text-sm"><h3 class="font-bold text-rose-400 mb-2 flex items-center gap-2">⚠️ Compilation Error</h3><pre class="whitespace-pre-wrap bg-black/60 p-3 rounded-lg border border-rose-500/30 text-xs">' + renderError.message + '</pre></div>';
    }
  </script>
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artifact?.title || 'Live Preview'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Vazirmatn', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #090d16;
      color: #f1f5f9;
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-start">
  ${code}
</body>
</html>`;
  };

  if (!artifact || !isOpen) return null;

  return (
    <AnimatePresence>
      {/* Full Backdrop: Clicking outside anywhere gracefully closes the modal */}
      <motion.div
        key="live-preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/75 backdrop-blur-md cursor-pointer select-none"
      >
        {/* Luxury Rounded Glass Modal Card: Stops click propagation so clicking inside does not close */}
        <motion.div
          key="live-preview-modal"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl h-[86vh] sm:h-[88vh] max-h-[880px] rounded-3xl sm:rounded-[32px] bg-gradient-to-b from-[#0e1626]/98 via-[#0a101d]/96 to-[#060a12]/98 border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(56,189,248,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.22)] p-3 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden cursor-default"
        >
          {/* Top Optical Specular Glare Highlight */}
          <div className="absolute top-0 inset-x-8 sm:inset-x-16 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none rounded-full z-20" />

          {/* Subsurface Soft Blue Ambient Glow */}
          <div className="absolute -top-12 left-1/3 w-64 h-32 bg-sky-500/10 blur-3xl pointer-events-none rounded-full -z-10" />

          {/* 1. Header Bar: Clean, Round Buttons and Responsive Tab Selectors */}
          <div
            className="relative z-10 pb-3 mb-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0"
            dir={isFa ? 'rtl' : 'ltr'}
          >
            {/* Left: App Title & Icon */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)] shrink-0 border border-white/30">
                <MonitorPlay className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate font-sans">
                  {artifact.title || (isFa ? 'پیش‌نمایش زنده برنامه' : 'Live Interactive Web App')}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-sky-300/80 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                  <span>{detectedLanguage.toUpperCase()}</span>
                  <span>•</span>
                  <span>{isFa ? 'آماده اجرا و تعاملی' : 'Interactive Sandbox'}</span>
                </div>
              </div>
            </div>

            {/* Center: Navigation Tabs (Preview, Code, Terminal, Tools) */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shrink-0" dir="ltr">
              {isWebArtifact && (
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isFa ? 'پیش‌نمایش' : 'Preview'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{isFa ? 'کد' : 'Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('terminal');
                  if (!executionResult) handleRunScript();
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'terminal'
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isFa ? 'ترمینال' : 'Runner'}</span>
              </button>
            </div>

            {/* Right: Circular Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
              {/* Viewport switcher (Desktop, Tablet, Mobile) in Preview tab */}
              {activeTab === 'preview' && isWebArtifact && (
                <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-full bg-white/5 border border-white/10 mr-1">
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                      viewport === 'desktop' ? 'bg-white/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                      viewport === 'tablet' ? 'bg-white/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                      viewport === 'mobile' ? 'bg-white/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Mobile (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Reload Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={runningExecution || isInstallingTool}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
                title={isFa ? 'تازه‌سازی' : 'Reload'}
              >
                <RotateCw className={`w-3.5 h-3.5 ${runningExecution ? 'animate-spin' : ''}`} />
              </button>

              {/* Open in New Window Tab */}
              {isWebArtifact && (
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
                  title={isFa ? 'باز کردن در تب جدید' : 'Open in new tab'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Download Source Button */}
              <button
                type="button"
                onClick={handleDownloadFile}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
                title={isFa ? 'دانلود فایل سورس' : 'Download code'}
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Close Button: Circular with Rose hover */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 border border-white/15 hover:border-rose-400/40 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs ml-1"
                title={isFa ? 'بستن (Esc)' : 'Close (Esc)'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Main Content Body: Rounded, seamless, no sharp inner borders */}
          <div className="relative z-10 flex-1 rounded-2xl bg-[#090d16] border border-white/10 overflow-hidden my-1 flex items-center justify-center shadow-inner">
            {/* VIEW TAB: Live Sandboxed Iframe with smooth rounded viewport */}
            {activeTab === 'preview' && isWebArtifact ? (
              <div
                className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
                  viewport === 'mobile'
                    ? 'max-w-[385px] my-auto h-[95%] rounded-[32px] border-[3px] border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden bg-slate-900'
                    : viewport === 'tablet'
                    ? 'max-w-[768px] my-auto h-[95%] rounded-[28px] border-[3px] border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden bg-slate-900'
                    : 'w-full h-full'
                }`}
              >
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  srcDoc={generateFullHtml(artifact.code)}
                  title={artifact.title || 'Live Preview'}
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                  className="w-full h-full border-0 bg-transparent rounded-2xl"
                />
              </div>
            ) : activeTab === 'code' ? (
              /* CODE TAB: Raw Code Inspector */
              <div className="w-full h-full p-4 font-mono text-xs text-sky-200 overflow-y-auto bg-[#070b12] select-text custom-scrollbar">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                  <span className="text-xs text-sky-400 font-bold">{detectedLanguage.toUpperCase()} Source Code</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-sky-200 flex items-center gap-1.5 cursor-pointer border border-white/10 active:scale-95 transition"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? (isFa ? 'کپی شد' : 'Copied') : isFa ? 'کپی کد' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed font-mono">{artifact.code}</pre>
              </div>
            ) : (
              /* TERMINAL / UNIVERSAL RUNNER TAB */
              <div className="w-full h-full p-4 font-mono text-xs overflow-y-auto bg-[#070b12] select-text custom-scrollbar flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Runner Header & Language Selector */}
                  <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span className="text-sky-200 text-[11px] font-bold">
                        {executionResult?.filePath ||
                          `apps/${artifact.title?.toLowerCase().replace(/\s+/g, '_') || 'app'}.${
                            detectedLanguage === 'python' ? 'py' : detectedLanguage === 'react' ? 'tsx' : 'js'
                          }`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Manual Language Switcher */}
                      <select
                        value={detectedLanguage}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setSelectedLanguageOverride(newLang);
                          handleRunScript(newLang);
                        }}
                        className="bg-slate-900 border border-white/20 text-sky-300 text-[11px] rounded-full px-3 py-1 font-mono cursor-pointer outline-none"
                      >
                        <option value="react">React (TSX / JSX)</option>
                        <option value="python">Python 3</option>
                        <option value="javascript">Node / TSX</option>
                        <option value="cpp">C / C++ (GCC/G++)</option>
                        <option value="go">Go (Golang)</option>
                        <option value="rust">Rust (rustc)</option>
                        <option value="swift">Swift</option>
                        <option value="html">HTML5 / Canvas</option>
                      </select>

                      {/* Execution Status Badge */}
                      {executionResult?.success ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Success ({executionResult.durationMs}ms)</span>
                        </span>
                      ) : executionResult && !executionResult.installed ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Tool Missing</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRunScript()}
                          disabled={runningExecution}
                          className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white border border-sky-300/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{runningExecution ? (isFa ? 'در حال اجرا...' : 'Running...') : isFa ? 'اجرای کد' : 'Run Code'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auto-Installation in Progress Card */}
                  {isInstallingTool && (
                    <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{installStatusMsg || (isFa ? 'در حال نصب ابزارهای بیلد...' : 'Installing build tools...')}</span>
                    </div>
                  )}

                  {/* Terminal STDOUT */}
                  {executionResult?.stdout && (
                    <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-500/30 text-emerald-300 text-[11px] space-y-1">
                      <div className="text-[9px] text-emerald-500/70 border-b border-emerald-500/20 pb-1 flex items-center justify-between">
                        <span>STDOUT &middot; Exit Code {executionResult.exitCode}</span>
                        <span>{executionResult.durationMs} ms</span>
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed">{executionResult.stdout}</pre>
                    </div>
                  )}

                  {/* Terminal STDERR */}
                  {executionResult?.stderr && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px] space-y-1">
                      <div className="text-[9px] text-rose-400/70 border-b border-rose-500/20 pb-1">STDERR / DIAGNOSTIC</div>
                      <pre className="whitespace-pre-wrap leading-relaxed">{executionResult.stderr}</pre>
                    </div>
                  )}

                  {/* Missing Tool Diagnostic & Permission Card */}
                  {executionResult && !executionResult.installed && executionResult.missingTools?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/50 to-black/90 border border-amber-500/50 text-amber-200 text-[11px] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>
                            {isFa
                              ? `کامپایلر موردنیاز (${executionResult.missingTools[0].name}) نصب نیست`
                              : `Missing toolchain: ${executionResult.missingTools[0].name}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInstallTool(executionResult.missingTools[0].id)}
                          disabled={isInstallingTool}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/60 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{isFa ? 'اجازه و نصب فوری ابزار' : 'Authorize & Install Now'}</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        {isFa
                          ? `برای اجرای خودکار این برنامه به دسترسی نصب ${executionResult.missingTools[0].name} نیاز است.`
                          : `The system needs ${executionResult.missingTools[0].name} to build this code.`}
                      </p>
                    </div>
                  )}

                  {/* Source Preview */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto">
                    <div className="text-[9px] text-slate-500 pb-1 border-b border-white/10 mb-1">Code Snapshot</div>
                    <pre className="whitespace-pre-wrap">{artifact.code.slice(0, 450)}...</pre>
                  </div>
                </div>

                <div className="pt-2 text-[9px] text-sky-400/60 flex items-center justify-between border-t border-white/5 mt-2">
                  <span>Language: {detectedLanguage.toUpperCase()}</span>
                  <span>Autonomous Multi-Language Engine</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
