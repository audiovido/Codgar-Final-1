import React, { useState, useEffect } from 'react';
import AudioVidoUniversalStudio from './AudioVidoUniversalStudio';

interface McpWebViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact?: {
    id?: string;
    title?: string;
    type?: string;
    content?: string;
  } | null;
}

export const McpWebViewModal: React.FC<McpWebViewModalProps> = ({ isOpen, onClose, artifact }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'runner'>('preview');
  const [copied, setCopied] = useState(false);

  // بستن قطعی با کلید Escape کیبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const codeText = artifact?.content || `// AudioVido Universal Studio (React 18 + TypeScript)
// 5 Spatial Realms: Aura Nodes, Music World, Movie World, Community, Aura Connect
// Multiplatform: Desktop 16:9, Mobile 9-Views & Android TV D-Pad Synced`;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="w-full max-w-6xl h-[88vh] bg-[#0c0e15] rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* نوار هدر با رویدادهای تضمینی کلیک */}
        <div className="relative z-50 flex items-center justify-between px-6 py-3.5 bg-[#141724] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-500/30">
              AV
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">AudioVido Multiplatform Studio</h3>
              <p className="text-[10px] text-blue-400 font-mono">REACT • Interactive Sandbox</p>
            </div>
          </div>

          {/* تب‌های Preview / Code / Runner */}
          <div className="flex items-center bg-[#090b10] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('preview');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👁 Preview
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('code');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              &lt;/&gt; Code
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('runner');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'runner'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              &gt;_ Runner
            </button>
          </div>

          {/* دکمه‌های سمت راست */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(codeText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              {copied ? '✓ کپی شد' : '📋 کپی کد'}
            </button>

            {/* دکمه قرمز ضربدر با اکشن تضمینی بستن */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-lg ml-2"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* بدنه تب‌ها: رندر کامل اکوسیستم ۵ قلمرو فضایی AudioVido */}
        <div className="relative z-10 flex-1 w-full h-full bg-[#080a10] p-4 overflow-hidden">
          {activeTab === 'preview' && (
            <div className="w-full h-full">
              <AudioVidoUniversalStudio />
            </div>
          )}

          {activeTab === 'code' && (
            <div className="w-full h-full p-6 overflow-auto font-mono text-xs text-slate-300 bg-[#0c0e16] rounded-2xl border border-slate-800">
              <pre className="whitespace-pre-wrap select-text">{codeText}</pre>
            </div>
          )}

          {activeTab === 'runner' && (
            <div className="w-full h-full p-6 font-mono text-xs text-emerald-400 bg-[#0c0e16] rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-white font-bold">&gt; AUDIOVIDO UNIVERSAL SPATIAL STUDIO V4.5</p>
                <p>&gt; [OK] Aura Nodes Orbital Physics Active</p>
                <p>&gt; [OK] Music World: Acoustic Lounge & Hi-Res FLAC 96kHz Ready</p>
                <p>&gt; [OK] Movie Cinema: IMAX 4K Player & Live Community Watch Synced</p>
                <p>&gt; [OK] Aura Connect: Soundbar Master Volume & Ambient Dimmer Active</p>
                <p>&gt; [OK] Mobile 9-Views Grid & Android TV D-Pad Keyboard Listener Active</p>
              </div>
              <p className="text-slate-500 text-[10px]">وضعیت: ۱۰۰٪ عملیاتی و تعاملی</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default McpWebViewModal;
