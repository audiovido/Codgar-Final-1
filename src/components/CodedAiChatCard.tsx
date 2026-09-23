import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { AgentMode, Message } from '../types';
import {
  Send,
  Paperclip,
  Mic,
  Sparkles,
  Copy,
  Check,
  Bot,
  User,
  X,
  Terminal,
  Clock,
  Calendar,
  Code2,
  Cpu,
  Zap,
  MessageSquare,
  Sparkle,
  Layers,
  ArrowRight,
  MonitorPlay,
  CheckCircle2,
  FileCode2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TranslationDict, Language, translations } from '../utils/translations';

function CodeBlockWithCopy({
  children,
  onOpenTerminal,
  onOpenPreview,
  isFa = true,
}: {
  children: React.ReactNode;
  onOpenTerminal?: () => void;
  onOpenPreview?: () => void;
  isFa?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showInline, setShowInline] = useState(false);

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && node.props && node.props.children) {
      return extractText(node.props.children);
    }
    return '';
  };

  const rawCode = extractText(children).trim();
  const lineCount = rawCode ? rawCode.split('\n').length : 0;
  const isLargeCode = lineCount > 4;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rawCode) {
      navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If small inline snippet or 1-3 lines, keep it compact
  if (!isLargeCode) {
    return (
      <div className="relative group/code my-2 overflow-hidden rounded-xl bg-slate-900/90 border border-white/20 text-sky-100 font-mono text-xs p-2.5">
        <pre className="overflow-x-auto whitespace-pre-wrap">{children}</pre>
      </div>
    );
  }

  return (
    <div
      className="my-3 rounded-2xl overflow-hidden bg-gradient-to-br from-[#070e1b] via-[#0b1424] to-[#070e1b] border border-emerald-500/40 shadow-xl transition-all select-none text-slate-100"
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Top Banner Card */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/25 shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm">
                {isFa ? 'کدهای پروژه تولید و در ترمینال ثبت گردید' : 'Code Generated & Registered to Terminal'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40 font-bold">
                {lineCount} {isFa ? 'خط کد' : 'lines'}
              </span>
              <span className="text-[10px] text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/40 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3" />
                <span>{isFa ? 'آماده اجرا' : 'Ready'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              {isFa
                ? 'کدها به بخش «ترمینال و تغییرات کد» در سایدبار سمت راست منتقل شدند.'
                : 'Code changes are live in the right sidebar under Terminal & Code Changes.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0" dir="ltr">
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>{isFa ? 'پیش‌نمایش زنده' : 'Live Preview'}</span>
            </button>
          )}

          {onOpenTerminal && (
            <button
              type="button"
              onClick={onOpenTerminal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{isFa ? 'مشاهده تغییرات در ترمینال و تغییرات کد' : 'View in Terminal & Code Changes'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
            title={isFa ? 'کپی کامل کد' : 'Copy Full Code'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowInline(!showInline)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer border border-white/10"
            title={showInline ? (isFa ? 'بستن پیش‌نمایش' : 'Hide') : (isFa ? 'مشاهده خلاصه کد' : 'Peek')}
          >
            {showInline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Preview if user toggles */}
      {showInline && (
        <div className="p-3 bg-black/80 max-h-60 overflow-y-auto border-t border-white/10 text-[11px] font-mono text-slate-300 select-text" dir="ltr">
          <pre className="whitespace-pre-wrap">{children}</pre>
        </div>
      )}
    </div>
  );
}

interface Props {
  messages: Message[];
  onSendMessage: (
    text: string,
    options?: { mode?: AgentMode; approvedCoding?: boolean; pendingCodingPrompt?: string } | AgentMode
  ) => void;
  isExecuting: boolean;
  taskIntent?: 'chat' | 'coding';
  onOpenCodeDrawer?: () => void;
  onOpenTerminal?: () => void;
  onOpenSettings?: () => void;
  onOpenSiriVoice?: () => void;
  isRecordingVoice?: boolean;
  inputText?: string;
  onInputTextChange?: (text: string) => void;
  isStreamingTyping?: boolean;
  streamingText?: string;
  t?: TranslationDict;
  language?: Language;
  onTogglePreview?: () => void;
  isPreviewOpen?: boolean;
  isTranslatingHistory?: boolean;
}

export function CodedAiChatCard({
  messages,
  onSendMessage,
  isExecuting,
  taskIntent = 'chat',
  onOpenCodeDrawer,
  onOpenTerminal,
  onOpenSettings,
  onOpenSiriVoice,
  isRecordingVoice = false,
  inputText: controlledInputText,
  onInputTextChange,
  isStreamingTyping = false,
  streamingText = '',
  t: propT,
  language = 'en',
  onTogglePreview,
  isPreviewOpen = false,
  isTranslatingHistory = false,
}: Props) {
  const t = propT || translations[language] || translations.en;
  const isRTL = language === 'fa';
  const [internalInputText, setInternalInputText] = useState('');
  const inputText = controlledInputText !== undefined ? controlledInputText : internalInputText;
  const setInputText = onInputTextChange || setInternalInputText;

  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-resize textarea when text changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Default single-line height is 24px, auto-expands up to 160px when multi-line text is typed
      const newHeight = Math.min(Math.max(scrollHeight, 24), 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Auto-scroll to bottom on new messages or streaming typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreamingTyping]);

  const handleSend = () => {
    const prompt = inputText.trim();
    if (!prompt || isExecuting) return;

    onSendMessage(prompt);
    setInputText('');
    setAttachedFileName(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      const prefix = inputText ? `${inputText} ` : '';
      setInputText(`${prefix}[File: ${file.name}]`);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      id="grok-chat-container"
      layout="position"
      initial={false}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 260,
          damping: 25,
          mass: 0.9,
        },
        duration: 0.45,
      }}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform, height',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'subpixel-antialiased',
      }}
      className="w-full max-w-[96%] xl:max-w-[1380px] rounded-[32px] ice-glass-window select-none relative z-30 mx-auto border border-white/85 backdrop-blur-3xl flex flex-col justify-between transform-gpu transition-all duration-300 shadow-[0_25px_80px_rgba(37,99,235,0.18)] h-[85vh] max-h-[880px] min-h-[500px] p-4 sm:p-7"
    >
      {/* Translation in Progress Indicator Floating Pill */}
      {isTranslatingHistory && (
        <div className="flex items-center justify-center pb-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-semibold animate-pulse shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>
              {language === 'fa'
                ? 'در حال ترجمه تاریخچه گفتگو...'
                : language === 'es'
                ? 'Traduciendo historial de conversación...'
                : language === 'fr'
                ? 'Traduction de l\'historique...'
                : language === 'ru'
                ? 'Перевод истории сообщений...'
                : language === 'zh'
                ? '正在翻译历史对话...'
                : language === 'hi'
                ? 'बातचीत का इतिहास अनुवाद किया जा रहा है...'
                : language === 'pt'
                ? 'Traduzindo histórico da conversa...'
                : 'Translating chat history...'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Scrollable 1-on-1 Chat Stream */}
      <div className="flex-1 overflow-y-auto my-2 space-y-2.5 sm:space-y-3 pr-2 pl-1 select-text custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user' || msg.sender === 'user';
          const textContent = msg.content || msg.text || '';

          // In Persian/RTL: User message is on the RIGHT (attached to user's blue avatar), Agent message is on the LEFT
          // In English/LTR: User message is on the right, Agent is on the left
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isUser
                  ? isRTL
                    ? 'flex-row justify-start' // In RTL container: start is RIGHT edge, so avatar is on right, bubble is immediately next to it
                    : 'flex-row-reverse justify-start' // In LTR container: user on right
                  : isRTL
                  ? 'flex-row-reverse justify-start' // In RTL container: agent is on LEFT
                  : 'flex-row justify-start' // In LTR container: agent is on LEFT
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* User Avatar (Blue Glossy) */}
              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 via-sky-400 to-blue-300 p-[1px] shadow-[0_4px_12px_rgba(59,130,246,0.22)] shrink-0 mt-0.5">
                  <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center text-white border border-white/50">
                    <User className="w-3.5 h-3.5 text-blue-50" />
                  </div>
                </div>
              )}

              {/* Agent Avatar (Original Codgar Bot Icon) */}
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 p-[1.5px] shadow-[0_2px_8px_rgba(37,99,235,0.2)] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center text-blue-600 shadow-inner">
                    <Bot className="w-3.5 h-3.5 text-blue-600 drop-shadow-[0_1px_2px_rgba(37,99,235,0.25)]" />
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`relative group w-fit max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed transition-all overflow-hidden ${
                  isUser
                    ? 'user-glass-bubble-3d text-white'
                    : 'ice-glass-card text-slate-800 shadow-sm border border-white/90'
                }`}
              >
                <div
                  className={`markdown-body w-full overflow-hidden font-sans select-text ${
                    isUser ? 'text-white font-medium' : 'text-slate-800'
                  }`}
                  dir="auto"
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p
                          className="mb-2 last:mb-0 leading-relaxed font-sans text-xs sm:text-sm break-words overflow-wrap-anywhere dir-auto"
                          dir="auto"
                        >
                          {children}
                        </p>
                      ),
                      pre: ({ children }) => (
                        <CodeBlockWithCopy
                          onOpenTerminal={onOpenTerminal}
                          onOpenPreview={onTogglePreview}
                          isFa={isRTL}
                        >
                          {children}
                        </CodeBlockWithCopy>
                      ),
                      code: ({ inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isBlock = !inline && (match || (typeof children === 'string' && children.includes('\n')));

                        if (isBlock) {
                          return (
                            <code className="font-mono text-xs text-sky-200 break-all block py-1" {...props}>
                              {children}
                            </code>
                          );
                        }

                        return (
                          <code
                            className="px-2 py-0.5 rounded-lg bg-blue-100/95 text-blue-950 border border-blue-300/90 font-mono text-[11px] sm:text-xs dir-ltr inline-block mx-0.5 break-all font-bold shadow-2xs"
                            dir="ltr"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      ul: ({ children }) => (
                        <ul className="list-disc pr-5 my-2 space-y-1 font-sans text-xs sm:text-sm dir-auto" dir="auto">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pr-5 my-2 space-y-1 font-sans text-xs sm:text-sm dir-auto" dir="auto">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed dir-auto" dir="auto">
                          {children}
                        </li>
                      ),
                      h1: ({ children }) => (
                        <h1 className="font-bold text-base sm:text-lg my-2 text-slate-900 border-b border-blue-200/60 pb-1 dir-auto" dir="auto">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="font-bold text-sm sm:text-base my-2 text-slate-900 dir-auto" dir="auto">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="font-semibold text-xs sm:text-sm my-1.5 text-slate-800 dir-auto" dir="auto">
                          {children}
                        </h3>
                      ),
                    }}
                  >
                    {textContent}
                  </ReactMarkdown>
                </div>

                {/* Footer Bar: Date, Timestamp & Copy Whole Message */}
                <div
                  className={`mt-3 pt-2.5 flex items-center justify-between border-t ${
                    isUser ? 'border-white/25 text-blue-100' : 'border-blue-200/60 text-slate-500'
                  } text-[11px] select-none`}
                >
                  {/* Left: Clean Harmonious High-Contrast Date & Time Display (e.g. "۱ مهر ۲۰:۲۶" or "23 September 20:26") */}
                  <div
                    className={`flex items-center text-[11px] font-sans font-bold select-none ${
                      isUser ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <span className="tracking-tight font-bold">
                      {(() => {
                        const date = new Date(msg.timestamp || Date.now());
                        if (isRTL) {
                          const dayMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
                            day: 'numeric',
                            month: 'long',
                          }).format(date);
                          const time = new Intl.DateTimeFormat('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          }).format(date);
                          return `${dayMonth} ${time}`;
                        } else {
                          const day = date.getDate();
                          const month = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language, {
                            month: 'long',
                          }).format(date);
                          const time = new Intl.DateTimeFormat('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          }).format(date);
                          return `${day} ${month} ${time}`;
                        }
                      })()}
                    </span>
                  </div>

                  {/* Right: Copy Whole Answer Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, textContent)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      isUser
                        ? 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
                        : 'bg-blue-50/90 hover:bg-blue-100 text-blue-900 border border-blue-200/90 shadow-2xs'
                    }`}
                    title={isRTL ? 'کپی کامل متن این پاسخ' : 'Copy entire answer text'}
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">{isRTL ? 'کامل کپی شد' : 'Copied All'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isRTL ? 'کپی کل پاسخ' : 'Copy All'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Interactive Coding Mode & Continue Chat Options */}
                {!isUser && msg.id !== 'msg-welcome' && !/حیطه (انجام )?وظایف|outside (the )?scope of my duties|fuera del alcance de mis funciones|dépasse le cadre de mes fonctions|выходит за рамки моих обязанностей|超出了我的职责范围|कार्यक्षेत्र से बाहर|fora do escopo/i.test(textContent) && (
                  <div
                    className="mt-3 pt-3 border-t border-blue-200/60 flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-sky-50/90 p-3 border border-blue-200/80 shadow-xs"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        {language === 'fa'
                          ? 'انتخاب مسیر بعدی:'
                          : language === 'es'
                          ? 'Seleccione el siguiente paso:'
                          : language === 'fr'
                          ? 'Choisissez la suite :'
                          : language === 'ru'
                          ? 'Выберите следующий шаг:'
                          : language === 'zh'
                          ? '选择下一步：'
                          : language === 'hi'
                          ? 'अगला कदम चुनें:'
                          : language === 'pt'
                          ? 'Escolha o próximo passo:'
                          : 'Choose Next Action:'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {/* Option 1: Switch to Coding Mode & Open Sandbox */}
                      <button
                        type="button"
                        onClick={() => {
                          onSendMessage(
                            language === 'fa'
                              ? 'تأیید است؛ لطفاً به حالت کدنویسی برو و این پروژه را بساز.'
                              : language === 'es'
                              ? 'Aprobado; por favor cambia al modo de programación y crea este proyecto.'
                              : language === 'fr'
                              ? 'Approuvé ; veuillez passer en mode programmation et créer ce projet.'
                              : language === 'ru'
                              ? 'Подтверждено; перейдите в режим кодирования и создайте этот проект.'
                              : language === 'zh'
                              ? '确认；请切换到编程模式并构建此项目。'
                              : language === 'hi'
                              ? 'स्वीकार है; कृपया कोडिंग मोड में जाएं और इस प्रोजेक्ट को बनाएं।'
                              : language === 'pt'
                              ? 'Aprovado; por favor alterne para o modo de programação e crie este projeto.'
                              : 'Approved; please switch to coding mode and build this project.',
                            { approvedCoding: true, mode: 'agent', pendingCodingPrompt: msg.pendingCodingPrompt || textContent }
                          );
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>
                          {language === 'fa'
                            ? 'رفتن به حالت کدنویسی'
                            : language === 'es'
                            ? 'Ir al modo de programación'
                            : language === 'fr'
                            ? 'Passer au mode codage'
                            : language === 'ru'
                            ? 'Перейти в режим кодирования'
                            : language === 'zh'
                            ? '进入编程模式'
                            : language === 'hi'
                            ? 'कोडिंग मोड में जाएं'
                            : language === 'pt'
                            ? 'Ir para modo de código'
                            : 'Switch to Coding Mode'}
                        </span>
                      </button>

                      {/* Option 2: Continue Conversation / Consultation */}
                      <button
                        type="button"
                        onClick={() => {
                          onSendMessage(
                            language === 'fa'
                              ? 'فعلاً فقط در قالب گفتگوی متنی و بدون نوشتن کد، توضیحات و برنامه‌ریزی بیشتری ارائه بده.'
                              : language === 'es'
                              ? 'Por ahora, continúa en modo conversación y planifica más sin escribir código.'
                              : language === 'fr'
                              ? 'Pour l\'instant, continuez la discussion et la planification sans coder.'
                              : language === 'ru'
                              ? 'Пока продолжайте в режиме беседы и планирования без кода.'
                              : language === 'zh'
                              ? '暂时仅以文字对话形式继续，不要编写代码。'
                              : language === 'hi'
                              ? 'फिलहाल केवल बातचीत और योजना के रूप में जारी रखें, कोड न लिखें।'
                              : language === 'pt'
                              ? 'Por enquanto continue apenas como conversa sem escrever código.'
                              : 'Continue the conversation and planning without writing code.',
                            { approvedCoding: false, mode: 'chat' }
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {language === 'fa'
                            ? 'ادامه گفتگو'
                            : language === 'es'
                            ? 'Continuar conversación'
                            : language === 'fr'
                            ? 'Continuer la discussion'
                            : language === 'ru'
                            ? 'Продолжить беседу'
                            : language === 'zh'
                            ? '继续对话'
                            : language === 'hi'
                            ? 'बातचीत जारी रखें'
                            : language === 'pt'
                            ? 'Continuar conversa'
                            : 'Continue Chat'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* In English LTR: User Avatar on Right */}
              {!isRTL && isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 via-sky-400 to-blue-300 p-[1px] shadow-[0_4px_12px_rgba(59,130,246,0.22)] shrink-0 mt-0.5">
                  <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center text-white border border-white/50">
                    <User className="w-3.5 h-3.5 text-blue-50" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Streaming Typewriter Bubble */}
        {isStreamingTyping && (
          <div
            className={`flex items-start gap-2.5 ${isRTL ? 'justify-end' : 'justify-start'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {isRTL ? (
              <>
                <div className="order-2 w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 p-[1.5px] shadow-[0_2px_8px_rgba(37,99,235,0.2)] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center text-blue-600 shadow-inner">
                    <Bot className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="order-1 ice-glass-card text-slate-800 rounded-2xl p-3 text-xs sm:text-sm max-w-[88%] sm:max-w-[78%] shadow-sm border border-white/90 text-right">
                  <p className="whitespace-pre-line font-sans leading-relaxed">
                    {streamingText}
                    <span className="inline-block w-1.5 h-3.5 bg-blue-500 mr-1 animate-pulse align-middle" />
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 p-[1.5px] shadow-[0_2px_8px_rgba(37,99,235,0.2)] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center text-blue-600 shadow-inner">
                    <Bot className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="ice-glass-card text-slate-800 rounded-2xl p-3 text-xs sm:text-sm max-w-[88%] sm:max-w-[78%] shadow-sm border border-white/90">
                  <p className="whitespace-pre-line font-sans leading-relaxed">
                    {streamingText}
                    <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-1 animate-pulse align-middle" />
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Active Thinking Indicator State with 3-Circle Fluid Merging Palette */}
        {isExecuting && !isStreamingTyping && (
          <div
            className={`flex items-start gap-2.5 ${isRTL ? 'justify-end' : 'justify-start'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {isRTL ? (
              <>
                {/* Codgar Avatar */}
                <div className="order-2 w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 p-[1.5px] shadow-[0_2px_8px_rgba(37,99,235,0.2)] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center text-blue-600 shadow-inner">
                    <Bot className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  </div>
                </div>

                {/* Sleek Thinking Bubble with 3 Fluid Merging Circles */}
                <div className="order-1 ice-glass-card rounded-2xl px-3.5 py-2.5 shadow-sm border border-white/90 text-right flex items-center gap-2.5">
                  {/* 3 Animated Fluid Merging Circles: Blue, White, Gray, Red */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/60 border border-white/90 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full animate-fluid-circle-1" />
                    <span className="w-2.5 h-2.5 rounded-full animate-fluid-circle-2" />
                    <span className="w-2.5 h-2.5 rounded-full animate-fluid-circle-3" />
                  </div>

                  <span className="font-bold text-slate-800 text-xs font-sans">
                    {language === 'fa'
                      ? 'کُدگر در حال اندیشیدن...'
                      : language === 'es'
                      ? 'Codgar está pensando...'
                      : language === 'fr'
                      ? 'Codgar réfléchit...'
                      : language === 'ru'
                      ? 'Codgar думает...'
                      : language === 'zh'
                      ? 'Codgar 正在思考...'
                      : language === 'hi'
                      ? 'Codgar सोच रहा है...'
                      : language === 'pt'
                      ? 'Codgar está pensando...'
                      : 'Codgar is thinking...'}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Codgar Avatar */}
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-400 to-blue-500 p-[1.5px] shadow-[0_2px_8px_rgba(37,99,235,0.2)] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center text-blue-600 shadow-inner">
                    <Bot className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  </div>
                </div>

                {/* Sleek Thinking Bubble with 3 Fluid Merging Circles */}
                <div className="ice-glass-card rounded-2xl px-3.5 py-2.5 shadow-sm border border-white/90 flex items-center gap-2.5" dir="ltr">
                  {/* 3 Animated Fluid Merging Circles */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/60 border border-white/90 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full animate-fluid-circle-1" />
                    <span className="w-2.5 h-2.5 rounded-full animate-fluid-circle-2" />
                    <span className="w-2.5 h-2.5 rounded-full animate-fluid-circle-3" />
                  </div>

                  <span className="font-bold text-slate-800 text-xs font-sans">
                    {language === 'es'
                      ? 'Codgar está pensando...'
                      : language === 'fr'
                      ? 'Codgar réfléchit...'
                      : language === 'ru'
                      ? 'Codgar думает...'
                      : language === 'zh'
                      ? 'Codgar 正在思考...'
                      : language === 'hi'
                      ? 'Codgar सोच रहा है...'
                      : language === 'pt'
                      ? 'Codgar está pensando...'
                      : 'Codgar is thinking...'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attached file chip if any */}
      {attachedFileName && !isExecuting && (
        <div
          className="mb-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-700 flex items-center justify-between gap-2 max-w-[580px] sm:max-w-[680px] w-full mx-auto shrink-0"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <span className="truncate font-mono">📎 {attachedFileName}</span>
          <button
            type="button"
            onClick={() => setAttachedFileName(null)}
            className="text-blue-500 hover:text-blue-800 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. Harmonious Modern Multi-Line Input Bar with Soft Elevation & Expandable Box */}
      <div
        className={`w-full mx-auto ice-glass-card bg-white/95 backdrop-blur-2xl transition-all duration-300 border border-white/95 shadow-md shadow-blue-900/5 shrink-0 relative focus-within:ring-2 focus-within:ring-blue-400/40 focus-within:border-blue-300 hover:border-blue-200 mt-1 ${
          inputText.includes('\n') || inputText.length > 55
            ? 'max-w-3xl rounded-[22px] sm:rounded-[24px] p-2 sm:p-2.5 flex items-end gap-1.5 sm:gap-2'
            : 'max-w-[580px] sm:max-w-[680px] rounded-full sm:rounded-[22px] py-1 px-2.5 sm:py-1.5 sm:px-3 flex items-center gap-1.5 sm:gap-2'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* File Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 transition cursor-pointer shrink-0 active:scale-95"
          title={t.attachFile}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Multi-line Auto-Expanding Textarea */}
        <div className="flex-1 min-w-0 py-0.5 px-1 flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'fa'
                ? 'پیام خود را بنویسید (درخواست ساخت سایت، رفع باگ، پرسش یا گفتگو)...'
                : language === 'es'
                ? 'Escriba su mensaje (crear app web, corregir errores, preguntas)...'
                : language === 'fr'
                ? 'Écrivez votre message (créer un site web, corriger des bugs, questions)...'
                : language === 'ru'
                ? 'Введите ваше сообщение (создание сайта, исправление ошибок, вопросы)...'
                : language === 'zh'
                ? '输入您的消息（请求构建网站、修复错误、提问或对话）...'
                : language === 'hi'
                ? 'अपना संदेश लिखें (वेबसाइट निर्माण, बग फिक्स, प्रश्न या बातचीत)...'
                : language === 'pt'
                ? 'Digite sua mensagem (solicitar criação de site, corrigir bugs, perguntas)...'
                : 'Type your message (ask questions, build web apps, fix code)...'
            }
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`w-full bg-transparent resize-none overflow-y-auto max-h-[160px] min-h-[24px] h-[24px] text-xs sm:text-sm font-sans font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal outline-none transition-all custom-scrollbar leading-6 py-0 ${
              isRTL ? 'text-right placeholder:text-right' : 'text-left placeholder:text-left'
            }`}
          />
        </div>

        {/* Action Buttons Right/Left Side */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Voice / Siri Mic Button */}
          <button
            type="button"
            onClick={onOpenSiriVoice}
            className={`p-1.5 rounded-full transition cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
              isRecordingVoice
                ? 'w-7.5 h-7.5 bg-gradient-to-tr from-cyan-400 via-pink-500 to-rose-400 text-white shadow-[0_0_16px_rgba(251,113,133,0.7)] animate-spin-slow'
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/80'
            }`}
            title={t.liveVoice}
          >
            {isRecordingVoice ? (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-black/20 backdrop-blur-xs">
                <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() && !attachedFileName}
            className="w-8 h-8 rounded-full coral-pill-btn disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-sm shadow-rose-500/20 transition cursor-pointer shrink-0 active:scale-95"
            title={t.sendMessage}
          >
            <Send className={`w-3.5 h-3.5 fill-current transform ${isRTL ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
