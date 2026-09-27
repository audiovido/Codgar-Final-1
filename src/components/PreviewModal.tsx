import React, { useState, useEffect } from 'react';
import AudioVidoUniversalStudio from './AudioVidoUniversalStudio';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact?: {
    id?: string;
    title?: string;
    type?: string;
    content?: string;
  } | null;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, artifact }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'runner'>('preview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-6xl h-[88vh] bg-[#0e111a] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* نوار هدر با اولویت کلیک فوق‌العاده بالا */}
        <div className="relative z-50 flex items-center justify-between px-6 py-3.5 bg-[#141824] border-b border-slate-800 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-500/30">
              AV
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">AudioVido Multiplatform Studio</h3>
              <p className="text-[10px] text-blue-400 font-mono">REACT 18 • Native Studio Sandbox</p>
            </div>
          </div>

          {/* تب‌ها */}
          <div className="flex items-center bg-[#090b10] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👁 Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'code' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              &lt;/&gt; Code
            </button>
            <button
              onClick={() => setActiveTab('runner')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'runner' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              &gt;_ Runner
            </button>
          </div>

          {/* دکمه بستن */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition shadow-md"
            title="بستن (Esc)"
          >
            ✕
          </button>
        </div>

        {/* بدنه محتوا: رندر ۱۰۰٪ نیتیو بدون آی‌فریم و بدون خطر لودینگ */}
        <div className="relative z-10 flex-1 w-full h-full bg-[#090b10] p-4 overflow-hidden">
          {activeTab === 'preview' && (
            <div className="w-full h-full">
              <AudioVidoUniversalStudio />
            </div>
          )}

          {activeTab === 'code' && (
            <div className="w-full h-full p-6 overflow-auto font-mono text-xs text-slate-300 bg-[#0c0e16] rounded-xl border border-slate-800">
              <pre className="whitespace-pre-wrap select-text">{artifact?.content || '// AudioVido Universal Studio Code'}</pre>
            </div>
          )}

          {activeTab === 'runner' && (
            <div className="w-full h-full p-6 font-mono text-xs text-emerald-400 bg-[#0c0e16] rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <p>&gt; AudioVido Universal Engine v4.5 Synced</p>
                <p>&gt; 5 Spatial Realms Active [OK]</p>
                <p>&gt; Native React 18 Rendering Active (Zero iframe dependency) [OK]</p>
                <p>&gt; Android TV D-Pad Navigator Ready</p>
              </div>
              <p className="text-slate-500 text-[10px]">وضعیت: عملیاتی و آماده کار</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PreviewModal;
