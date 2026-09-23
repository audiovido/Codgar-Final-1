import React, { useEffect, useState, useRef } from 'react';
import { voiceAgent, VoiceState } from '../services/voiceAgent';
import {
  Mic,
  Send,
  X,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscript: (text: string) => void;
  onUpdateInputText: (text: string) => void;
  currentInputText?: string;
  language: string;
}

export function SiriLiveSpeakerOverlay({
  isOpen,
  onClose,
  onSendTranscript,
  onUpdateInputText,
  currentInputText = '',
  language = 'fa',
}: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isSpeaking: false,
    isListening: false,
    audioLevel: 0,
  });
  const [sessionSpeech, setSessionSpeech] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const baseTextRef = useRef('');
  const isFa = language === 'fa';

  // Initialize session: capture existing input text as base and listen
  useEffect(() => {
    if (!isOpen) {
      voiceAgent.clearTranscript();
      voiceAgent.stopListening();
      return;
    }

    // Capture current input text so new speech appends to it cleanly
    const initialBase = (currentInputText || '').trim();
    baseTextRef.current = initialBase;
    setSessionSpeech('');
    setInterimSpeech('');
    voiceAgent.clearTranscript();

    const unsub = voiceAgent.subscribe((st) => {
      setVoiceState(st);
    });

    voiceAgent.startListening(
      language,
      (text: string, isFinal: boolean) => {
        const cleanText = text.trim();
        if (isFinal) {
          setSessionSpeech(cleanText);
          setInterimSpeech('');
          // Update parent input box in real time
          const fullText = baseTextRef.current
            ? `${baseTextRef.current} ${cleanText}`
            : cleanText;
          onUpdateInputText(fullText);
        } else {
          setInterimSpeech(cleanText);
          // Stream interim updates to parent input box
          const fullText = baseTextRef.current
            ? `${baseTextRef.current} ${cleanText}`
            : cleanText;
          onUpdateInputText(fullText);
        }
      },
      (err) => {
        console.warn('Codgar Voice Recorder Error:', err);
      },
      '' // Start fresh session buffer
    );

    return () => {
      unsub();
      voiceAgent.clearTranscript();
      voiceAgent.stopListening();
    };
  }, [isOpen, language]);

  // Keyboard Shortcuts (Enter = Send, Escape = Close & Keep Text)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleDoneAndClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendDirectly();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sessionSpeech, interimSpeech]);

  if (!isOpen) return null;

  const currentSpokenDisplay = interimSpeech || sessionSpeech;
  const fullComposedText = baseTextRef.current
    ? currentSpokenDisplay
      ? `${baseTextRef.current} ${currentSpokenDisplay}`
      : baseTextRef.current
    : currentSpokenDisplay;

  // Done button: finalize text in chat input and close recorder
  const handleDoneAndClose = () => {
    if (fullComposedText.trim()) {
      onUpdateInputText(fullComposedText.trim());
    }
    voiceAgent.clearTranscript();
    voiceAgent.stopListening();
    onClose();
  };

  // Send button: send immediately to Codgar AI & purge all drafts for clean next session
  const handleSendDirectly = () => {
    const textToSend = fullComposedText.trim();
    if (textToSend) {
      baseTextRef.current = '';
      setSessionSpeech('');
      setInterimSpeech('');
      voiceAgent.clearTranscript();
      voiceAgent.stopListening();
      onUpdateInputText('');
      onSendTranscript(textToSend);
      onClose();
    }
  };

  // Sound amplitude dynamic physics
  const powerLevel = voiceState.isListening ? Math.max(0.15, voiceState.audioLevel) : 0;
  const pulseScale = 1 + Math.min(0.4, powerLevel * 0.7);
  const glowOpacity = Math.min(0.9, 0.4 + powerLevel * 0.6);

  return (
    <div
      id="gemini-voice-recorder-overlay"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[94%] sm:w-[400px] rounded-[26px] bg-gradient-to-b from-white/98 via-sky-50/90 to-blue-50/95 backdrop-blur-3xl border border-white/95 shadow-[0_20px_50px_rgba(37,99,235,0.22),inset_0_1.5px_2px_rgba(255,255,255,1)] p-4 select-none dir-auto font-sans animate-fadeIn"
    >
      {/* Top Header: Responsive Live Mic Aura, Status & Close */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-blue-200/50">
        <div className="flex items-center gap-2.5">
          {/* Animated 3D Reactive Glowing Mic Circle */}
          <div className="relative flex items-center justify-center">
            <span
              className="absolute w-8 h-8 rounded-full bg-blue-500/30 blur-xs transition-transform duration-75"
              style={{
                transform: `scale(${pulseScale})`,
                opacity: glowOpacity,
              }}
            />
            <div
              className={`relative w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all duration-75 shadow-xs ${
                voiceState.isListening
                  ? 'bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Mic className="w-4 h-4 animate-none" />
            </div>
          </div>

          {/* Voice Spectrum Visualizer Bars */}
          <div className="flex items-center gap-1 h-3.5">
            {[0.4, 0.9, 1.4, 1.0, 0.5].map((factor, idx) => {
              const barHeight = Math.max(
                3.5,
                Math.min(14, voiceState.isListening ? 3.5 + powerLevel * 14 * factor : 3.5)
              );
              return (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-gradient-to-t from-blue-600 via-sky-500 to-teal-400 transition-all duration-75"
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>

          {/* Status Text */}
          <span className="text-[11px] font-sans font-bold text-blue-950">
            {isFa ? 'در حال شنیدن و تایپ خودکار...' : 'Listening & Auto-Typing...'}
          </span>
        </div>

        {/* Minimal Close Button */}
        <button
          onClick={handleDoneAndClose}
          className="p-1 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-white shadow-2xs transition active:scale-95 cursor-pointer"
          title={isFa ? 'تایید و بستن' : 'Done & Close'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Voice Transcript Display Box (Real-time live typing preview) */}
      <div
        className="w-full my-2 px-3.5 py-3 rounded-2xl bg-white/90 border border-blue-100/90 text-right min-h-[56px] max-h-[110px] overflow-y-auto flex items-center justify-start shadow-[inset_0_1.5px_3px_rgba(37,99,235,0.04)] custom-scrollbar"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {fullComposedText ? (
          <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-relaxed break-words font-sans w-full">
            {fullComposedText}
            {voiceState.isListening && (
              <span className="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 mr-1 animate-pulse align-middle rounded-xs" />
            )}
          </p>
        ) : (
          <p className="text-xs text-slate-400 font-sans font-normal text-center w-full py-1">
            {isFa ? '🎤 صحبت کنید... کلمات هم‌زمان در کادر پیام تایپ می‌شوند' : '🎤 Speak now... Your words type directly into the chat input'}
          </p>
        )}
      </div>

      {/* Action Footer: Simplified Clean Gemini Controls */}
      <div className="flex items-center gap-2 pt-2 border-t border-blue-100/70">
        {/* 1. Done & Save to Input Box */}
        <button
          onClick={handleDoneAndClose}
          className="flex-1 h-9 px-3 rounded-xl bg-gradient-to-b from-white to-sky-50/90 hover:from-white hover:to-sky-100 border border-sky-200/80 text-blue-950 font-sans font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
          title={isFa ? 'تایید و درج در کادر پیام' : 'Done & keep in input'}
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isFa ? 'تایید و بستن' : 'Done'}</span>
        </button>

        {/* 2. Direct Send to Codgar */}
        <button
          onClick={handleSendDirectly}
          disabled={!fullComposedText.trim()}
          className="flex-1 h-9 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-40 transition cursor-pointer active:scale-95 whitespace-nowrap"
          title={isFa ? 'ارسال مستقیم پیام به کُدگر' : 'Send message'}
        >
          <span>{isFa ? 'ارسال پیام' : 'Send'}</span>
          <Send className={`w-3.5 h-3.5 shrink-0 ${isFa ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  );
}
