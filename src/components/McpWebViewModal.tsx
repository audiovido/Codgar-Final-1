import React, { useState } from 'react';
import { AudioVidoUniversalStudio } from './AudioVidoUniversalStudio';

export interface McpWebViewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  [key: string]: any;
}

export const McpWebViewModal: React.FC<McpWebViewModalProps> = ({ isOpen = true, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'runner'>('preview');

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0c0d14] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-11 bg-neutral-900/90 border-b border-white/10 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 font-mono text-sm">⚛️ App.tsx</span>
            <span className="text-slate-400 text-xs">● REACT Interactive Sandbox</span>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center space-x-1 bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md transition font-medium ${activeTab === 'preview' ? 'bg-cyan-500 text-black shadow font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              👁️ Preview
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md transition font-medium ${activeTab === 'code' ? 'bg-cyan-500 text-black shadow font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {'</>'} Code
            </button>
            <button 
              onClick={() => setActiveTab('runner')}
              className={`px-3 py-1 rounded-md transition font-medium ${activeTab === 'runner' ? 'bg-cyan-500 text-black shadow font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              ▶ Runner
            </button>
          </div>

          {/* Window Close Control */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => { if (typeof onClose === 'function') onClose(); }}
              className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white flex items-center justify-center transition text-xs font-bold"
              title="بستن پنجره"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden relative bg-[#07070b]">
          {activeTab === 'preview' && (
            <div className="w-full h-full">
              <AudioVidoUniversalStudio />
            </div>
          )}

          {activeTab === 'code' && (
            <div className="w-full h-full p-4 overflow-auto font-mono text-xs text-cyan-300 bg-[#06070a]">
              <pre className="select-text">
{`// ========================================================
// 🌌 AUDIOVIDO UNIVERSAL STUDIO (React 18 & TypeScript)
// ========================================================
// ۱. Aura Nodes: گراف مرکزی کیهانی با مدارهای چرخان
// ۲. Music World: استودیو آکوستیک وینیل با کیفیت FLAC 96kHz
// ۳. Movie World: سینمای خانگی 4K IMAX با فید چت زنده مخاطبان
// ۴. Aura Connect: کنترلر سخت‌افزاری ساندبار و دیمر نور محیط
// ۵. Community: رویدادها، استریم‌های زنده و اتاق‌های صوتی
// ویژگی‌ها: سوئیچ ۱۶:۹ دسکتاپ و ۹ فریم آیفون + D-Pad تلویزیون`}
              </pre>
            </div>
          )}

          {activeTab === 'runner' && (
            <div className="w-full h-full p-4 overflow-auto font-mono text-xs text-emerald-400 bg-black/90 space-y-1">
              <div>[Runner] ✅ React 18 Sandbox Mounted Successfully.</div>
              <div>[Runner] 🚀 5 Spatial Realms Initialized.</div>
              <div>[Runner] ⚡ TV D-Pad Keyboard Listener Active.</div>
              <div>[Runner] 🎛️ Aura Bar Master Volume & Dimmer Ready.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default McpWebViewModal;
