import React, { useState, useEffect, useRef } from 'react';

interface LiveArtifactPreviewProps {
  code?: string;
  isStreaming?: boolean;
  onClose?: () => void;
}

export const LiveArtifactPreview: React.FC<LiveArtifactPreviewProps> = ({ code = '', onClose }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [renderedDoc, setRenderedDoc] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const containerWidth = 
    viewMode === 'mobile' ? 'max-w-[390px]' : 
    viewMode === 'tablet' ? 'max-w-[768px]' : 'w-full';

  useEffect(() => {
    const trimmed = (code || '').trim();
    if (!trimmed) {
      setRenderedDoc('');
      setErrorMsg(null);
      return;
    }

    let active = true;
    setIsCompiling(true);
    setErrorMsg(null);

    if (trimmed.includes('<!DOCTYPE html') || (trimmed.includes('<html') && trimmed.includes('</html>'))) {
      setRenderedDoc(trimmed);
      setIsCompiling(false);
      return;
    }

    fetch('http://127.0.0.1:3000/api/sandbox/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed })
    })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.compiledCode) {
          const docParts = [
            '<!DOCTYPE html>',
            '<html class="dark h-full w-full">',
            '<head>',
            '  <meta charset="utf-8"/>',
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
            '  <script src="https://cdn.tailwindcss.com"></script>',
            '  <script type="importmap">',
            '  {',
            '    "imports": {',
            '      "react": "https://esm.sh/react@18.3.1?dev",',
            '      "react-dom": "https://esm.sh/react-dom@18.3.1?dev",',
            '      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client?dev",',
            '      "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime?dev"',
            '    }',
            '  }',
            '  </script>',
            '  <style>',
            '    body { background-color: #080a11; color: #f4f4f5; margin: 0; padding: 0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }',
            '    #root { width: 100%; min-height: 100vh; }',
            '  </style>',
            '</head>',
            '<body class="bg-[#080a11]">',
            '  <div id="root"></div>',
            '  <script type="module">',
            '    import React from "react";',
            '    import { createRoot } from "react-dom/client";',
            '    try {',
            '      const codeString = ' + JSON.stringify(data.compiledCode) + ';',
            '      const blob = new Blob([codeString], { type: "application/javascript" });',
            '      const moduleUrl = URL.createObjectURL(blob);',
            '      const mod = await import(moduleUrl);',
            '      const Component = mod.default || Object.values(mod).find(v => typeof v === "function");',
            '      if (Component) {',
            '        createRoot(document.getElementById("root")).render(React.createElement(Component));',
            '      } else {',
            '        throw new Error("No default component export found.");',
            '      }',
            '    } catch(err) {',
            '      document.getElementById("root").innerHTML = "<div style=\"color:#f87171;padding:24px;font-family:monospace;font-size:13px;background:rgba(239,68,68,0.1);margin:16px;border-radius:12px;\">Render Error: " + err.message + "</div>";',
            '    }',
            '  </script>',
            '</body>',
            '</html>'
          ];
          setRenderedDoc(docParts.join('\n'));
        } else if (data.isEmpty) {
          setRenderedDoc('');
        } else {
          setErrorMsg(data.error || 'خطا در کامپایل کد');
        }
      })
      .catch(err => {
        if (active) setErrorMsg(err.message);
      })
      .finally(() => {
        if (active) setIsCompiling(false);
      });

    return () => { active = false; };
  }, [code]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0f19] text-zinc-100 overflow-hidden select-none">
      <div className="h-10 px-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className={"w-2.5 h-2.5 rounded-full " + (isCompiling ? "bg-amber-400 animate-ping" : "bg-emerald-500")}></span>
          <span className="text-xs font-mono font-medium text-zinc-300">Live Component Preview</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">Dynamic</span>
        </div>

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

      <div className="flex-1 w-full overflow-hidden p-4 flex justify-center items-center bg-[#080a11]">
        <div className={"w-full h-full transition-all duration-300 ease-out border border-zinc-800/60 rounded-xl overflow-hidden shadow-2xl flex flex-col " + containerWidth}>
          {errorMsg ? (
            <div className="p-6 text-rose-400 font-mono text-xs bg-rose-950/20 m-4 rounded-xl border border-rose-900/40">{errorMsg}</div>
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
              <p className="text-xs font-mono text-zinc-400">آماده دریافت پرامپت و رندر کامپوننت...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveArtifactPreview;
