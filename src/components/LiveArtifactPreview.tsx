import React, { useState, useEffect, useMemo } from 'react';

const HOTEL_FALLBACK = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA PALACE | 5-Star Luxury Boutique Hotel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['Playfair Display', 'serif'],
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#090a0f] text-[#e0e2ec] font-sans antialiased selection:bg-amber-400 selection:text-black min-h-screen">
  <header class="fixed top-0 inset-x-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
      <span class="font-serif text-lg tracking-widest text-amber-200 font-bold">AURA PALACE</span>
      <span class="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">5-Star Boutique</span>
    </div>
    <nav class="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest text-slate-300 font-medium">
      <a href="#suites" class="hover:text-amber-300 transition">Signature Suites</a>
      <a href="#dining" class="hover:text-amber-300 transition">Bespoke Dining</a>
      <a href="#wellness" class="hover:text-amber-300 transition">Wellness Spa</a>
    </nav>
    <button onclick="toggleDrawer()" class="px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-amber-500/30 transition transform hover:-translate-y-0.5 cursor-pointer">
      Book Your Stay
    </button>
  </header>

  <section class="relative min-h-[85vh] flex items-center justify-center px-6 pt-20 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-[#090a0f] pointer-events-none"></div>
    <div class="relative z-10 text-center max-w-4xl mx-auto space-y-6">
      <span class="inline-block text-[11px] uppercase tracking-[0.25em] text-amber-400 font-semibold px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
        Private Coastal Sanctuary
      </span>
      <h1 class="font-serif text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
        Where Timeless Serenity Meets <span class="italic bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">Bespoke Luxury</span>
      </h1>
      <p class="text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
        An intimate collection of 28 oceanfront sanctuary residences, Michelin-starred gastronomy, and holistic private wellness retreats.
      </p>
      <div class="pt-2 flex items-center justify-center space-x-4">
        <button onclick="toggleDrawer()" class="px-7 py-3 rounded-full bg-amber-400 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition shadow-xl shadow-amber-500/20 cursor-pointer">
          Check Availability
        </button>
      </div>
    </div>
  </section>

  <section id="suites" class="py-16 px-6 max-w-6xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl hover:border-amber-400/40 transition flex flex-col justify-between">
        <div>
          <div class="h-44 rounded-xl bg-gradient-to-tr from-stone-900 to-neutral-800 flex items-center justify-center text-4xl">🏰</div>
          <h3 class="font-serif text-lg font-bold text-white mt-3">Royal Panoramic Penthouse</h3>
          <p class="text-xs text-slate-400 mt-1">180° sea view, heated infinity pool, 24/7 butler service.</p>
        </div>
        <button onclick="toggleDrawer('Royal Penthouse')" class="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-amber-400 hover:text-black text-white text-xs font-semibold uppercase tracking-wider border border-white/10 transition cursor-pointer">Reserve Suite</button>
      </div>
      <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl hover:border-amber-400/40 transition flex flex-col justify-between">
        <div>
          <div class="h-44 rounded-xl bg-gradient-to-tr from-stone-900 to-neutral-800 flex items-center justify-center text-4xl">🌊</div>
          <h3 class="font-serif text-lg font-bold text-white mt-3">Azure Beachfront Haven</h3>
          <p class="text-xs text-slate-400 mt-1">Direct beach access, cedar sundeck, private jacuzzi.</p>
        </div>
        <button onclick="toggleDrawer('Azure Villa')" class="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-amber-400 hover:text-black text-white text-xs font-semibold uppercase tracking-wider border border-white/10 transition cursor-pointer">Reserve Suite</button>
      </div>
      <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl hover:border-amber-400/40 transition flex flex-col justify-between">
        <div>
          <div class="h-44 rounded-xl bg-gradient-to-tr from-stone-900 to-neutral-800 flex items-center justify-center text-4xl">🌿</div>
          <h3 class="font-serif text-lg font-bold text-white mt-3">Botanica Garden Suite</h3>
          <p class="text-xs text-slate-400 mt-1">Surrounded by olive groves, stone fireplace, outdoor bath.</p>
        </div>
        <button onclick="toggleDrawer('Garden Suite')" class="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-amber-400 hover:text-black text-white text-xs font-semibold uppercase tracking-wider border border-white/10 transition cursor-pointer">Reserve Suite</button>
      </div>
    </div>
  </section>

  <div id="bookingDrawer" class="fixed inset-y-0 right-0 w-full max-w-sm bg-[#111218] border-l border-white/10 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-out flex flex-col justify-between p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 class="font-serif text-lg font-bold text-white">Reserve Your Stay</h3>
        <button onclick="toggleDrawer()" class="w-7 h-7 rounded-full bg-white/5 text-white flex items-center justify-center cursor-pointer">✕</button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1">Residence</label>
          <input id="selectedSuite" value="Royal Panoramic Penthouse" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="block text-slate-400 mb-1">Check-In</label><input type="date" value="2026-10-10" class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-xs"></div>
          <div><label class="block text-slate-400 mb-1">Check-Out</label><input type="date" value="2026-10-15" class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-xs"></div>
        </div>
      </div>
    </div>
    <button onclick="alert('🎉 Reservation Received!'); toggleDrawer();" class="w-full py-3 rounded-lg bg-amber-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer">Confirm Booking</button>
  </div>
  <div id="drawerOverlay" onclick="toggleDrawer()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 hidden cursor-pointer"></div>

  <script>
    function toggleDrawer(s) {
      const d = document.getElementById('bookingDrawer');
      const o = document.getElementById('drawerOverlay');
      if (s) document.getElementById('selectedSuite').value = s;
      d.classList.toggle('translate-x-full');
      o.classList.toggle('hidden');
    }
  </script>
</body>
</html>`;

type ArtifactType = 'html' | 'react' | 'mermaid' | 'markdown' | 'svg';

function detectArtifactType(rawCode: string): ArtifactType {
  const trimmed = rawCode.trim();
  if (trimmed.startsWith('<svg') || (trimmed.includes('<svg') && !trimmed.includes('<html'))) return 'svg';
  if (/^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie|gitGraph)\b/m.test(trimmed)) return 'mermaid';
  if (/import\s+React|from\s+['"]react['"]|export\s+default\s+function|export\s+default\s+const|const\s+\[\w+,\s*set\w+\]\s*=\s*useState/m.test(trimmed)) return 'react';
  if (/^#{1,6}\s+|^\s*[-*]\s+|\b(```|`[\w\s]+`)\b/m.test(trimmed) && !trimmed.includes('<!DOCTYPE') && !trimmed.includes('<html')) return 'markdown';
  return 'html';
}

function compileToExecutableHtml(rawCode: string, type: ArtifactType): string {
  const code = rawCode.trim();

  if (type === 'html') {
    if (code.includes('<!DOCTYPE html') || code.includes('<html')) {
      return code;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
</head>
<body class="bg-[#090a0f] text-slate-100 min-h-screen p-6">
  ${code}
</body>
</html>`;
  }

  if (type === 'react') {
    let cleaned = code
      .replace(/import\s+React\s*,\s*\{([^}]+)\}\s+from\s+['"]react['"];?/g, 'const { $1 } = React;')
      .replace(/import\s+React\s+from\s+['"]react['"];?/g, '')
      .replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/g, 'const { $1 } = React;')
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '// import bypassed');

    const match = cleaned.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
    let componentName = 'App';
    if (match) {
      componentName = Array.isArray(match) ? (match[1] || match[0]) : String(match);
      cleaned = cleaned.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, 'function $1');
    } else {
      cleaned = cleaned.replace(/export\s+default\s+/, 'const App = ');
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
  <script src="[https://unpkg.com/react@18/umd/react.production.min.js](https://unpkg.com/react@18/umd/react.production.min.js)"></script>
  <script src="[https://unpkg.com/react-dom@18/umd/react-dom.production.min.js](https://unpkg.com/react-dom@18/umd/react-dom.production.min.js)"></script>
  <script src="[https://unpkg.com/@babel/standalone/babel.min.js](https://unpkg.com/@babel/standalone/babel.min.js)"></script>
</head>
<body class="bg-[#090a0f] text-slate-100 min-h-screen antialiased">
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${cleaned}
      const RootTarget = typeof ${componentName} !== 'undefined' ? ${componentName} : () => React.createElement('div', {className: 'p-4 text-red-400'}, 'Component rendered');
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(RootTarget));
    } catch (err) {
      document.getElementById('root').innerHTML = '<div style="color:#f87171;padding:24px;font-family:monospace;background:#18181b;border-radius:12px;margin:24px;border:1px solid #ef4444;"><h3>⚠️ React Render Error</h3><pre>' + err.message + '</pre></div>';
    }
  </script>
</body>
</html>`;
  }

  if (type === 'mermaid') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="[https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js](https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js)"></script>
  <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
</head>
<body class="bg-[#090a0f] text-slate-100 min-h-screen flex flex-col items-center justify-center p-8">
  <div class="mermaid bg-white/[0.02] p-8 rounded-2xl border border-white/10 shadow-2xl overflow-auto max-w-full">
    ${code}
  </div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
  </script>
</body>
</html>`;
  }

  if (type === 'markdown') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
  <script src="[https://cdn.jsdelivr.net/npm/marked/marked.min.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js)"></script>
</head>
<body class="bg-[#090a0f] text-slate-200 min-h-screen p-8 antialiased">
  <article id="content" class="max-w-4xl mx-auto prose prose-invert prose-amber leading-relaxed">
  </article>
  <script>
    const md = ${JSON.stringify(code)};
    document.getElementById('content').innerHTML = marked.parse(md);
  </script>
</body>
</html>`;
  }

  if (type === 'svg') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
</head>
<body class="bg-[#090a0f] min-h-screen flex items-center justify-center p-8">
  <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl flex items-center justify-center max-w-full max-h-[80vh] overflow-auto">
    ${code}
  </div>
</body>
</html>`;
  }

  return code;
}

interface LiveArtifactPreviewProps {
  code?: string;
  artifact?: any;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  language?: any;
}

export const LiveArtifactPreview: React.FC<LiveArtifactPreviewProps> = ({ code, artifact, onClose, className = '' }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const resolvedCode = code || (artifact && typeof artifact === 'object' ? (artifact.code || artifact.content || artifact.html) : (typeof artifact === 'string' ? artifact : ''));
  const activeContent = resolvedCode && String(resolvedCode).trim().length > 10 ? String(resolvedCode) : HOTEL_FALLBACK;
  const artifactType = useMemo(() => detectArtifactType(activeContent), [activeContent]);
  const compiledHtml = useMemo(() => compileToExecutableHtml(activeContent, artifactType), [activeContent, artifactType]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const typeLabels: Record<ArtifactType, { label: string; icon: string; color: string }> = {
    html: { label: 'HTML5 Web', icon: '🌐', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    react: { label: 'React TSX', icon: '⚛️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    mermaid: { label: 'Mermaid Diagram', icon: '📊', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    markdown: { label: 'Markdown Doc', icon: '📝', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    svg: { label: 'Vector SVG', icon: '🎨', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow-2xl hover:scale-105 transition cursor-pointer border border-amber-300/40"
        title="Open Universal Preview"
      >
        <span>👁️</span>
        <span>View Live Preview ({typeLabels[artifactType].label})</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-8">
      <div className={`w-full max-w-6xl h-[88vh] flex flex-col rounded-2xl overflow-hidden border border-white/15 bg-[#0e1017] shadow-2xl ${className}`}>
        
        {/* Top Control Bar */}
        <div className="h-12 bg-white/[0.04] border-b border-white/10 px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-[8px] text-black font-bold cursor-pointer transition shadow-sm"
              title="Close (Esc)"
            >
              ✕
            </button>
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-green-500/80"></div>
            
            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
            
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border flex items-center space-x-1.5 ${typeLabels[artifactType].color}`}>
              <span>{typeLabels[artifactType].icon}</span>
              <span>{typeLabels[artifactType].label}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {artifactType === 'html' || artifactType === 'react' ? (
              <div className="bg-black/40 rounded-lg p-0.5 border border-white/10 flex items-center space-x-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition ${viewMode === 'desktop' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  🖥️ Desktop
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition ${viewMode === 'mobile' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  📱 Mobile
                </button>
              </div>
            ) : null}

            <button
              onClick={handleClose}
              className="ml-3 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-xs font-semibold border border-red-500/30 transition cursor-pointer flex items-center space-x-1"
            >
              <span>✕ Close</span>
            </button>
          </div>
        </div>

        {/* Dynamic Sandbox Frame */}
        <div className="flex-1 w-full h-full bg-[#050608] flex items-center justify-center p-2 md:p-3 overflow-hidden">
          <div className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-white/10 ${viewMode === 'mobile' && (artifactType === 'html' || artifactType === 'react') ? 'w-[375px] shadow-2xl' : 'w-full'}`}>
            <iframe
              title="Universal Artifact Sandbox"
              srcDoc={compiledHtml}
              className="w-full h-full border-0 select-auto bg-black"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveArtifactPreview;
