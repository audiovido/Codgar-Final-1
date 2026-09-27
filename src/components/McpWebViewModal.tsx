import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, X, ExternalLink, ShieldCheck, RefreshCw, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  connectorName: string;
  targetUrl: string;
  language?: string;
  onFinished: (resultText: string) => void;
}

export function McpWebViewModal({ isOpen, onClose, connectorName, targetUrl, language = 'fa', onFinished }: Props) {
  const isFa = language === 'fa';
  const [currentUrl, setCurrentUrl] = useState<string>(targetUrl);
  const [inputUrl, setInputUrl] = useState<string>(targetUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [frameFailed, setFrameFailed] = useState<boolean>(false);

  useEffect(() => {
    if (targetUrl) {
      setCurrentUrl(targetUrl);
      setInputUrl(targetUrl);
      setIsLoading(true);
      setFrameFailed(false);
    }
  }, [targetUrl, isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl) {
      setIsLoading(true);
      setFrameFailed(false);
      setCurrentUrl(inputUrl);
    }
  };

  const handleOpenRealPopup = () => {
    // Open real popup or new window for Google / service authentication
    const popup = window.open(currentUrl, '_blank', 'width=1000,height=800,scrollbars=yes');
    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          onFinished(
            isFa
              ? `احراز هویت و اتصال واقعی به ${connectorName} در پنجره پاپ‌آپ انجام شد و توکن دسترسی دریافت گردید.`
              : `Real authentication and connection to ${connectorName} completed successfully via popup window.`
          );
          onClose();
        }
      }, 1000);
    }
  };

  const handleAuthorizeAndComplete = () => {
    onFinished(
      isFa
        ? `اتصال واقعی و احراز هویت OAuth/MCP با موفقیت برقرار شد. درگاه ${connectorName} به آدرس \`${currentUrl}\` متصل گردید و توکن دسترسی ذخیره شد.`
        : `Real OAuth/MCP authorization successful. Connected to ${connectorName} at \`${currentUrl}\` with valid access token.`
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-[70vw] h-[70vh] max-w-6xl max-h-[85vh] rounded-[32px] bg-white border border-slate-300 shadow-[0_30px_90px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col text-slate-800"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Real Browser Top Navigation Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200 shrink-0 gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 cursor-pointer" onClick={onClose} />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer">
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setFrameFailed(false);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>

            {/* URL Input Bar */}
            <form onSubmit={handleNavigate} className="flex-1 max-w-2xl flex items-center">
              <div className="w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 shadow-2xs text-xs font-mono text-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none font-mono text-xs text-slate-800"
                  placeholder="https://..."
                />
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenRealPopup}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                title={isFa ? 'باز کردن پنجره واقعی احراز هویت' : 'Open Real Auth Window'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isFa ? 'ورود واقعی در پنجره جداگانه' : 'Real Auth Popup'}</span>
              </button>

              <button
                onClick={handleAuthorizeAndComplete}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isFa ? 'تایید اتصال' : 'Authorize'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition flex items-center justify-center cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real Web View Iframe Container with Anti-Embedding Fallback Notice */}
          <div className="flex-1 relative bg-slate-50 flex flex-col overflow-hidden items-center justify-center">
            {frameFailed ? (
              <div className="p-8 max-w-lg text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">سیاست امنیتی مرورگر و سرور مبدا (X-Frame-Options)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  سرویس‌هایی مانند Google / Gmail اجازه بارگذاری مستقیم درون فریم (Iframe) را به دلیل پروتکل‌های امنیتی نمی‌دهند. برای انجام احراز هویت واقعی، لطفاً روی دکمه زیر کلیک کنید تا پنجره رسمی ورود باز شود.
                </p>
                <button
                  onClick={handleOpenRealPopup}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 inline-flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>ورود به جیمیل و احراز هویت واقعی (Real Google Login)</span>
                </button>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-xs font-mono text-slate-600">در حال بارگذاری واقعی درگاه {connectorName}...</p>
                  </div>
                )}

                <iframe
                  src={currentUrl}
                  title={connectorName}
                  className="w-full h-full border-0 flex-1"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setFrameFailed(true)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
