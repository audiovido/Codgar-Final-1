import React, { useState, useEffect, useRef } from 'react';

interface LiveArtifactPreviewProps {
  code?: string;
  artifact?: any;
  isOpen?: boolean;
  onClose?: () => void;
  language?: string;
}

export const LiveArtifactPreview: React.FC<LiveArtifactPreviewProps> = ({ 
  code: incomingCode = '', 
  artifact, 
  onClose 
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  
  // استخراج قطعی کد از تمام منابع ممکن
  const initialSource = (
    incomingCode || 
    artifact?.code || 
    artifact?.content || 
    artifact?.html || 
    `import React, { useState } from 'react';

export default function App() {
  const [counter, setCounter] = useState(0);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#080a11] text-zinc-100 p-6">
      <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
        <h1 className="text-xl font-bold text-emerald-400 mb-2">Live React Sandbox Active</h1>
        <p className="text-xs text-zinc-400 mb-6">سیستم آماده رندر آنی کدهای هوش مصنوعی است.</p>
        <button 
          onClick={() => setCounter(c => c + 1)} 
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-sm"
        >
          کلیک تعاملی: {counter}
        </button>
      </div>
    </div>
  );`
  ).trim();

  const [currentCode, setCurrentCode] = useState<string>(initialSource);
  const [renderedDoc, setRenderedDoc] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (incomingCode && incomingCode.trim() && incomingCode.trim() !== currentCode) {
      setCurrentCode(incomingCode.trim());
    }
  }, [incomingCode]);

  useEffect(() => {
    let src = currentCode.trim();
    if (!src) return;

    let active = true;
    setIsCompiling(true);
    setErrorMsg(null);

    // ۱. استخراج بلاک کد در صورت وجود فنس مارک‌داون
    const match = src.match(/```(?:tsx|jsx|typescript|javascript|react)?\s*([\s\S]*?)```/);
    if (match && match[1]) {
      src = match[1].trim();
    }

    // ۲. ارسال برای ترنسپایل
    fetch('http://127.0.0.1:3000/api/sandbox/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: src })
    })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.compiledCode) {
          const doc = [
            '<!DOCTYPE html>',
            '<html class="dark w-full h-full">',
            '<head>',
            '  <meta charset="utf-8"/>',
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
            '  <script src="https://cdn.tailwindcss.com"></script>',
            '  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>',
            '  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>',
            '  <style>',
            '    body { background-color: #080a11; color: #f4f4f5; margin: 0; padding: 0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
            '    #root { width: 100%; min-height: 100vh; }',
            '  </style>',
            '</head>',
            '<body class="bg-[#080a11]">',
            '  <div id="root"></div>',
            '  <script>',
            '    window.onerror = function(msg) {',
            '      document.getElementById("root").innerHTML = "<div style=\"color:#f87171;padding:20px;font-family:monospace;\">Runtime Error: " + msg + "</div>";',
            '    };',
            '    try {',
            '      const { useState, useEffect, useRef, useMemo, useCallback } = React;',
            '      ' + data.compiledCode,
            '      const Target = window.__CurrentApp || (typeof App !== "undefined" ? App : null);',
            '      if (Target) {',
            '        ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Target));',
            '      } else {',
            '        throw new Error("Component App export not found");',
            '      }',
            '    } catch(err) {',
            '      document.getElementById("root").innerHTML = "<div style=\"color:#f87171;padding:20px;font-family:monospace;font-size:12px;background:rgba(239,68,68,0.1);margin:16px;border-radius:12px;\">Execution Notice: " + err.message + "</div>";',
            '    }',
            '  </script>',
            '</body>',
            '</html>'
          ].join('\n');
          setRenderedDoc(doc);
        } else {
          setErrorMsg(data.error || 'خطا در بارگذاری خروجی');
        }
      })
      .catch(err => {
        if (active) setErrorMsg(err.message);
      })
      .finally(() => {
        if (active) setIsCompiling(false);
      });

    return () => { active = false; };
  }, [currentCode]);

  const containerWidth = 
    viewMode === 'mobile' ? 'max-w-[390px]' : 
    viewMode === 'tablet' ? 'max-w-[768px]' : 'w-full';

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0f19] text-zinc-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-10 px-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className={"w-2.5 h-2.5 rounded-full " + (isCompiling ? "bg-amber-400 animate-ping" : "bg-emerald-500")}></span>
          <span className="text-xs font-mono font-medium text-zinc-300">Live Component Preview</span>
          <div className="flex bg-zinc-950 p-0.5 rounded-md border border-zinc-800 ml-2">
            <button 
              onClick={() => setTab('preview')}
              className={"px-2 py-0.5 text-[10px] font-mono rounded " + (tab === 'preview' ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
            >
              UI Preview
            </button>
            <button 
              onClick={() => setTab('code')}
              className={"px-2 py-0.5 text-[10px] font-mono rounded " + (tab === 'code' ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
            >
              Code Source
            </button>
          </div>
        </div>

        {/* Viewport Modes */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80">
          {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={"px-2.5 py-1 text-[11px] font-medium capitalize rounded transition-all " + (viewMode === mode ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200")}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded border border-zinc-700/60 transition-all"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 w-full overflow-hidden p-4 flex justify-center items-center bg-[#080a11]">
        <div className={"w-full h-full transition-all duration-300 ease-out border border-zinc-800/60 rounded-xl overflow-hidden shadow-2xl flex flex-col " + containerWidth}>
          {tab === 'code' ? (
            <textarea
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="w-full h-full p-4 bg-[#05070d] text-emerald-400 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="Paste or edit React TSX code here..."
              spellCheck={false}
            />
          ) : errorMsg ? (
            <div className="p-6 text-zinc-400 font-mono text-xs bg-zinc-900/40 m-4 rounded-xl border border-zinc-800 text-center">
              {errorMsg}
            </div>
          ) : renderedDoc ? (
            <iframe
              ref={iframeRef}
              srcDoc={renderedDoc}
              title="Codgar Sandbox Frame"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-none bg-transparent"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-500 font-sans">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin"></div>
              <p className="text-xs font-mono text-zinc-400">آماده‌‌سازی سندباکس...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveArtifactPreview;
