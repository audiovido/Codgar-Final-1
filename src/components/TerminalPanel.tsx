import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  Clock,
  CornerDownLeft,
  FileCode2,
  Code2,
  CheckCircle2,
  WrapText,
  X,
  Layers,
} from 'lucide-react';
import { Message } from '../types';

interface Props {
  isOpen: boolean;
  onToggle?: () => void;
  language?: string;
  messages?: Message[];
}

export interface CodeChangeItem {
  id: string;
  prompt?: string;
  title: string;
  filePath: string;
  code: string;
  language: string;
  timestamp: number;
  status: 'success' | 'error';
  executionLogs?: string;
  linesCount: number;
}

export interface CommandLog {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timestamp: number;
}

export function TerminalPanel({ isOpen, language = 'fa', messages = [], onToggle }: Props) {
  const isFa = language === 'fa';
  const [command, setCommand] = useState('');
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [codeHistory, setCodeHistory] = useState<CodeChangeItem[]>([]);
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'code' | 'commands'>('all');

  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch persistent code history
  const fetchCodeHistory = async () => {
    try {
      const res = await fetch('/api/code/history');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          setCodeHistory(data.history);
        }
      }
    } catch {
      // Fallback
    }
  };

  // 2. Parse code blocks from chat messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      const parsedItems: CodeChangeItem[] = [];

      messages.forEach((msg, idx) => {
        if (msg.role === 'agent' && msg.content) {
          const codeBlockRegex = /```(?:tsx|typescript|jsx|javascript|html|python|go|rust|swift)?\s*([\s\S]*?)```/g;
          let match;
          let blockIdx = 0;

          while ((match = codeBlockRegex.exec(msg.content)) !== null) {
            const code = match[1]?.trim();
            if (code && code.length > 50) {
              const isReact = code.includes('import React') || code.includes('useState') || code.includes('export default');
              const lines = code.split('\n').length;
              parsedItems.push({
                id: `msg_code_${msg.id}_${blockIdx}`,
                prompt: `کد مرحله ${idx + 1}`,
                title: isReact ? 'App.tsx' : 'main.ts',
                filePath: isReact ? 'apps/web/App.tsx' : 'apps/main.ts',
                code,
                language: isReact ? 'tsx' : 'typescript',
                timestamp: msg.timestamp || Date.now(),
                status: 'success',
                executionLogs: `Exit 0 (Compiled successfully)`,
                linesCount: lines,
              });
              blockIdx++;
            }
          }
        }
      });

      if (parsedItems.length > 0) {
        setCodeHistory((prev) => {
          const combined = [...prev];
          parsedItems.forEach((newItem) => {
            if (!combined.some((c) => c.code.slice(0, 100) === newItem.code.slice(0, 100))) {
              combined.unshift(newItem);
            }
          });
          return combined;
        });
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchCodeHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (codeHistory.length > 0 && (!selectedCodeId || !codeHistory.some((c) => c.id === selectedCodeId))) {
      setSelectedCodeId(codeHistory[0].id);
    }
  }, [codeHistory, selectedCodeId]);

  const activeCodeItem = useMemo(() => {
    if (codeHistory.length === 0) return null;
    return codeHistory.find((c) => c.id === selectedCodeId) || codeHistory[0];
  }, [codeHistory, selectedCodeId]);

  const codeLines = useMemo(() => {
    if (!activeCodeItem?.code) return [];
    return activeCodeItem.code.split('\n');
  }, [activeCodeItem]);

  const handleExecute = async (cmdToRun?: string) => {
    const targetCmd = (cmdToRun || command).trim();
    if (!targetCmd || running) return;

    setHistory((prev) => [...prev.filter((c) => c !== targetCmd), targetCmd]);
    setHistoryIdx(-1);
    setCommand('');
    setRunning(true);

    const startTime = Date.now();
    const tempId = `cmd_${startTime}`;
    setCurrentExecutionId(tempId);

    try {
      const res = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: targetCmd, executionId: tempId }),
      });

      const data = await res.json();
      const durationMs = Date.now() - startTime;

      const newLog: CommandLog = {
        id: tempId,
        command: targetCmd,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: typeof data.exitCode === 'number' ? data.exitCode : data.success ? 0 : 1,
        durationMs,
        timestamp: startTime,
      };

      setCommandLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorLog: CommandLog = {
        id: tempId,
        command: targetCmd,
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        durationMs,
        timestamp: startTime,
      };
      setCommandLogs((prev) => [errorLog, ...prev]);
    } finally {
      setRunning(false);
      setCurrentExecutionId(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCancel = async () => {
    if (!currentExecutionId) return;
    try {
      await fetch('/api/terminal/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId: currentExecutionId }),
      });
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    setCommandLogs([]);
    setCodeHistory([]);
    setSelectedCodeId(null);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const parts: string[] = [];
    if (codeHistory.length > 0) {
      parts.push('=== CODE FILES ===\n');
      codeHistory.forEach((c) => {
        parts.push(`// ${c.filePath}\n${c.code}\n`);
      });
    }
    if (commandLogs.length > 0) {
      parts.push('\n=== COMMAND LOGS ===\n');
      commandLogs.forEach((l) => {
        parts.push(`$ ${l.command} (exit ${l.exitCode})\n${l.stdout || ''}${l.stderr || ''}\n`);
      });
    }
    navigator.clipboard.writeText(parts.join('\n'));
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setCommand(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setCommand('');
      } else {
        setHistoryIdx(nextIdx);
        setCommand(history[nextIdx]);
      }
    }
  };

  const quickCommands = [
    { label: 'npm test', cmd: 'npm test' },
    { label: 'git status', cmd: 'git status' },
    { label: 'ls -la', cmd: 'ls -la' },
    { label: 'node -v', cmd: 'node -v' },
  ];

  const totalEntries = codeHistory.length + commandLogs.length;

  if (!isOpen) return null;

  return (
    <div
      id="codgar-integrated-terminal"
      className="h-full w-full flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden bg-[#070b16] font-mono text-xs select-none relative"
      dir="ltr"
    >
      {/* Top Ambient Glow Rim */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 pointer-events-none z-30" />

      {/* Clean Compact Header (NO Traffic Light Dots, Concise Layout) */}
      <div className="px-3.5 py-2.5 bg-[#0d1424] text-slate-300 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 shrink-0 z-20">
        {/* Left: Terminal Icon & Clean Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
            <TerminalIcon className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs sm:text-sm tracking-wide font-sans">
              {isFa ? 'ترمینال و تغییرات کد' : 'Terminal & Code Changes'}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {totalEntries > 0 ? `${totalEntries}` : (isFa ? 'آماده' : 'Ready')}
            </span>
          </div>
        </div>

        {/* Center: Clean Filter Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold transition cursor-pointer ${
              activeTab === 'all' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'همه' : 'All'} ({totalEntries})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'code' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>{isFa ? 'کدها' : 'Code'} ({codeHistory.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commands')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'commands' ? 'bg-blue-500 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TerminalIcon className="w-3 h-3" />
            <span>{isFa ? 'دستورات' : 'Commands'} ({commandLogs.length})</span>
          </button>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={totalEntries === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] transition cursor-pointer disabled:opacity-30 active:scale-95"
            title={isFa ? 'کپی تمام لاگ‌ها و کدها' : 'Copy All'}
          >
            {copiedId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-sans text-[11px]">{copiedId === 'all' ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی همه' : 'Copy All')}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={totalEntries === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition cursor-pointer disabled:opacity-30 active:scale-95"
            title={isFa ? 'پاک‌سازی' : 'Clear'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 ml-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
              title={isFa ? 'بستن' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 bg-[#070b16] text-slate-200 space-y-3.5 leading-relaxed min-h-0 select-text font-mono">
        {totalEntries === 0 ? (
          /* Concise Empty State */
          <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 gap-3 py-6 px-4" dir={isFa ? 'rtl' : 'ltr'}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <TerminalIcon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs sm:text-sm text-slate-200 font-sans">
                {isFa ? 'آماده اجرای دستورات و نمایش تغییرات کد' : 'Ready for Commands & Code Changes'}
              </h4>
            </div>

            {/* Quick Commands Bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1" dir="ltr">
              {quickCommands.map((qc) => (
                <button
                  key={qc.cmd}
                  type="button"
                  onClick={() => handleExecute(qc.cmd)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/30 text-[11px] text-slate-300 hover:text-emerald-300 font-mono transition cursor-pointer active:scale-95"
                >
                  $ {qc.cmd}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 1. Code Changes Box */}
            {(activeTab === 'all' || activeTab === 'code') && activeCodeItem && (
              <div className="rounded-xl bg-[#090f1d] border border-emerald-500/30 overflow-hidden shadow-xl transition-all">
                {/* Code Tabs Header */}
                <div className="px-3 py-1.5 bg-[#0d1527] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                    <span className="text-[11px] font-sans font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1" dir={isFa ? 'rtl' : 'ltr'}>
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isFa ? 'فایل‌ها:' : 'Files:'}</span>
                    </span>

                    {codeHistory.map((item, idx) => {
                      const isSelected = item.id === activeCodeItem.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedCodeId(item.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-xs font-bold'
                              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          <FileCode2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">{item.filePath || item.title || `Code ${idx + 1}`}</span>
                          <span className={`text-[10px] px-1 rounded font-sans ${isSelected ? 'bg-emerald-950/80 text-emerald-300' : 'bg-black/30 text-slate-500'}`}>
                            {item.linesCount}L
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Code Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => setWrapLines(!wrapLines)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-sans flex items-center gap-1 transition cursor-pointer border ${
                        wrapLines
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                          : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
                      }`}
                      title={isFa ? 'شکست خودکار خطوط' : 'Toggle Wrap'}
                    >
                      <WrapText className="w-3.5 h-3.5" />
                      <span>{wrapLines ? 'Wrap' : 'No Wrap'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(activeCodeItem.id, activeCodeItem.code)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-sans flex items-center gap-1 transition cursor-pointer border border-emerald-500/30 active:scale-95"
                    >
                      {copiedId === activeCodeItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === activeCodeItem.id ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                    </button>
                  </div>
                </div>

                {/* File Meta Info */}
                <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{activeCodeItem.filePath}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.2 rounded border border-emerald-800/40 flex items-center gap-1 font-sans">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>OK</span>
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/50 px-2 py-0.2 rounded border border-cyan-800/40 font-mono uppercase">
                      {activeCodeItem.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(activeCodeItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>{activeCodeItem.linesCount} lines</span>
                  </div>
                </div>

                {/* Code Body with Line Numbers */}
                <div className="relative bg-[#070b16] text-[11px] text-slate-200 font-mono leading-relaxed select-text flex max-h-[380px] overflow-y-auto">
                  <div className="select-none py-2.5 px-2 text-right text-slate-600 bg-black/40 border-r border-white/5 font-mono text-[11px] leading-5 shrink-0 min-w-[36px]">
                    {codeLines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  <div className="flex-1 min-w-0 py-2.5 px-3 overflow-hidden">
                    <pre
                      className={`font-mono text-[11px] leading-5 text-slate-200 ${
                        wrapLines ? 'whitespace-pre-wrap break-all sm:break-normal' : 'whitespace-pre overflow-x-auto scrollbar-thin'
                      }`}
                    >
                      {activeCodeItem.code}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Command Execution Logs */}
            {(activeTab === 'all' || activeTab === 'commands') && commandLogs.length > 0 && (
              <div className="space-y-2 pt-1">
                {commandLogs.map((log) => (
                  <div key={log.id} className="rounded-xl bg-black/50 p-2.5 border border-white/10 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-1">
                      <span className="text-cyan-400 font-semibold flex items-center gap-1.5 font-mono">
                        <span className="text-emerald-400">kian@codgar:~$</span> {log.command}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            log.exitCode === 0
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          exit {log.exitCode}
                        </span>
                        <span className="text-slate-500 text-[10px] font-sans">
                          {log.durationMs}ms
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy = `${log.command}\n${log.stdout || ''}${log.stderr || ''}`.trim();
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedId(log.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="px-1.5 py-0.2 rounded bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white transition cursor-pointer text-[10px] flex items-center gap-1 font-mono border border-white/10 active:scale-95"
                          title="Copy output"
                        >
                          {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    {log.stdout && (
                      <pre className="text-slate-300 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                        {log.stdout}
                      </pre>
                    )}
                    {log.stderr && (
                      <pre className="text-rose-400 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                        {log.stderr}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={outputEndRef} />
      </div>

      {/* Terminal Command Input Bar */}
      <div className="p-2 bg-[#0d1424] border-t border-white/10 flex items-center gap-2 shrink-0 select-none">
        <span className="text-emerald-400 font-bold pl-2 font-mono text-xs whitespace-nowrap">
          kian@codgar:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isFa ? 'اجرای دستور (npm test, git status, ls -la)...' : 'Run command (npm test, git status)...'}
          className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 outline-none text-xs font-mono select-text"
        />
        {running ? (
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold font-mono shadow-md cursor-pointer active:scale-95 transition"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleExecute()}
            disabled={!command.trim()}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold font-mono cursor-pointer shadow-md disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition"
          >
            <span>Exec</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
