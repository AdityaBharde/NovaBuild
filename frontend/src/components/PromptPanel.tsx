import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUp,
  CircleCheck,
  Globe,
  LoaderCircle,
  MessageCircleDashed,
  Paperclip,
  Plus,
  RotateCw,
  Telescope,
  Terminal,
  ChevronDown,
  ChevronRight,
  FileCode,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, ExecutionStep } from '../types';

export interface PromptPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStatus?: string | null;
  onSendPrompt: (prompt: string) => void;
  onSelectFile?: (filePath: string) => void;
  onResetChat?: () => void;
}

function sanitizeMessageText(content: string): string {
  if (!content) return '';

  // Extract completed message if present
  const completedMatch = content.match(
    /<message\b[^>]*\bphase="completed"[^>]*>([\s\S]*?)<\/message>/i
  );
  if (completedMatch && completedMatch[1]?.trim()) {
    return completedMatch[1].trim();
  }

  // Strip internal protocol tags
  let cleaned = content
    .replace(/<tool_result\b[^>]*>[\s\S]*?<\/tool_result>/gi, '')
    .replace(
      /<message\b[^>]*\bphase=['"]?(planning|start)['"]?[^>]*>[\s\S]*?<\/message>/gi,
      ''
    )
    .replace(/<tool\b[^>]*>[\s\S]*?<\/tool>/gi, '')
    .replace(/<tool\b[^>]*\/>/gi, '')
    .replace(/<file\b[^>]*>[\s\S]*?<\/file>/gi, '')
    .replace(/<\/?message\b[^>]*>/gi, '')
    .trim();

  return cleaned;
}

function renderInlineFormatted(text: string): React.ReactNode {
  const segments = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return segments.map((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-text-primary">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border/80 font-mono text-[10px] text-accent"
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    return seg;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 leading-relaxed text-xs">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang =
            !firstLine.includes(' ') && firstLine.length > 0 && lines.length > 1;
          const language = hasLang ? firstLine : '';
          const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={index}
              className="rounded-xl bg-background border border-border overflow-hidden my-2 font-mono text-[11px]"
            >
              {language && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-surface-elevated/70 border-b border-border/60 text-[10px] text-text-secondary uppercase font-semibold">
                  <span>{language}</span>
                </div>
              )}
              <pre className="p-3 overflow-x-auto custom-scrollbar text-text-primary whitespace-pre">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} className="h-1.5" />;
              }

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lineIdx} className="text-xs font-bold text-text-primary pt-1">
                    {renderInlineFormatted(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                return (
                  <h3 key={lineIdx} className="text-xs font-bold text-text-primary pt-1">
                    {renderInlineFormatted(trimmed.replace(/^#+\s*/, ''))}
                  </h3>
                );
              }

              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="text-accent text-sm leading-none mt-0.5">•</span>
                    <span className="flex-1 text-text-primary">
                      {renderInlineFormatted(trimmed.slice(2))}
                    </span>
                  </div>
                );
              }

              return (
                <p key={lineIdx} className="text-text-primary">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

interface StepRowProps {
  step: ExecutionStep;
  streaming: boolean;
}

function StepRow({ step, streaming }: StepRowProps) {
  const isRunning = step.status === 'running' || (streaming && step.status !== 'completed' && step.status !== 'error');
  const [open, setOpen] = useState<boolean>(isRunning);

  // Auto-expand while running, collapse when done
  useEffect(() => {
    if (isRunning) {
      setOpen(true);
    }
  }, [isRunning]);

  if (step.type === 'planning' || step.type === 'status') {
    return (
      <div className="rounded-lg border border-border/70 bg-surface-elevated/40 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-elevated/70 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            {isRunning ? (
              <LoaderCircle className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
            ) : step.status === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <CircleCheck className="w-3.5 h-3.5 text-accent shrink-0" />
            )}
            <span className="font-medium text-text-primary truncate">
              {isRunning ? 'Thinking...' : (step.title || 'Thought')}
            </span>
          </div>
          {step.detail && (
            <div className="text-text-secondary shrink-0 pl-1">
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          )}
        </button>

        {open && step.detail && (
          <div className="px-3 pb-2.5 pt-1 border-t border-border/40 text-[11px] text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
            {step.detail}
          </div>
        )}
      </div>
    );
  }

  if (step.type === 'tool') {
    const isError = step.status === 'error';
    const titleText = isRunning
      ? `Running ${step.title}`
      : isError
      ? `Failed to run ${step.title}`
      : `Ran ${step.title}`;

    return (
      <div className="rounded-lg border border-border/70 bg-surface-elevated/40 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-elevated/70 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            {isRunning ? (
              <LoaderCircle className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
            ) : isError ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-accent shrink-0" />
            )}
            <span className="font-medium text-text-primary truncate">
              {titleText}
            </span>
          </div>
          {step.detail && (
            <div className="text-text-secondary shrink-0 pl-1">
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          )}
        </button>

        {open && step.detail && (
          <div className="px-3 pb-2.5 pt-1 border-t border-border/40">
            <div className="rounded-lg bg-background border border-border/60 p-2 font-mono text-[11px] text-text-secondary overflow-x-auto max-h-48 custom-scrollbar">
              <code>{step.detail}</code>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default / File step
  return (
    <div className="rounded-lg border border-border/70 bg-surface-elevated/40 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-elevated/70 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          {isRunning ? (
            <LoaderCircle className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
          ) : step.status === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <FileCode className="w-3.5 h-3.5 text-accent shrink-0" />
          )}
          <span className="font-medium text-text-primary truncate">
            {step.title}
          </span>
        </div>
        {step.detail && (
          <div className="text-text-secondary shrink-0 pl-1">
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
        )}
      </button>

      {open && step.detail && (
        <div className="px-3 pb-2.5 pt-1 border-t border-border/40 text-[11px] text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
          {step.detail}
        </div>
      )}
    </div>
  );
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  messages,
  isStreaming,
  currentStatus,
  onSendPrompt,
  onSelectFile,
  onResetChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isContextOpen, setIsContextOpen] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, currentStatus]);

  // Close context dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsContextOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const canSend = prompt.trim().length > 0 && !isStreaming;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSend) return;
    onSendPrompt(prompt.trim());
    setPrompt('');
  };

  const handleReset = () => {
    if (isStreaming) return;
    if (onResetChat) {
      onResetChat();
    }
    setPrompt('');
    setIsContextOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* 1. TOP HEADER: New Thread + Reset */}
      <div className="flex items-start justify-between gap-4 p-4 pb-3 border-b border-border shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-sm text-text-primary">New Thread</div>
          <div className="text-xs text-text-secondary">
            Ask the agent to change your code.
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isStreaming}
          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Reset conversation"
          aria-label="Reset conversation"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-text-secondary mb-3 shadow-inner">
              <MessageCircleDashed className="w-6 h-6 text-accent" />
            </div>
            <div className="text-sm font-semibold text-text-primary mb-1">
              What should we build?
            </div>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              The agent can read your code, run commands and make changes. Press send to start.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isLastMsg = i === messages.length - 1;
            const isStreamingThis = isStreaming && isLastMsg && msg.role === 'ASSISTANT';
            const displayContent =
              msg.role === 'ASSISTANT' ? sanitizeMessageText(msg.content) : msg.content;
            const steps = msg.steps || [];
            const hasFiles = msg.filesCreated && msg.filesCreated.length > 0;

            if (msg.role === 'USER') {
              return (
                <motion.div
                  key={msg.id || i}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%] rounded-2xl bg-surface-elevated border border-border/80 px-3.5 py-2.5 text-xs text-text-primary shadow-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id || i}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="w-full flex flex-col space-y-2.5 max-w-[95%]"
              >
                {/* 1. EXECUTION STEPS / TRACE */}
                {steps.length > 0 && (
                  <div className="flex flex-col gap-1.5 w-full">
                    {steps.map((step) => (
                      <StepRow key={step.id} step={step} streaming={isStreamingThis} />
                    ))}
                  </div>
                )}

                {/* 2. ACTIVE PROGRESS FALLBACK */}
                {isStreamingThis && !steps.some((s) => s.status === 'running') && (
                  <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-surface-elevated/50 border border-border/50 text-xs text-text-secondary">
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
                    <span className="truncate">{currentStatus || 'Working on your request...'}</span>
                  </div>
                )}

                {/* 3. CREATED / MODIFIED FILES PILLS */}
                {hasFiles && (
                  <div className="p-2.5 rounded-xl bg-surface-elevated/70 border border-border/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary pl-1">
                      Files Created:
                    </span>
                    {msg.filesCreated?.map((filePath) => (
                      <button
                        key={filePath}
                        type="button"
                        onClick={() => onSelectFile && onSelectFile(filePath)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-accent hover:text-accent text-[11px] font-medium text-text-primary transition-all shadow-sm"
                        title="Open in Monaco Editor"
                      >
                        <FileCode className="w-3.5 h-3.5 text-accent" />
                        <span className="truncate max-w-[150px]">{filePath}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-text-secondary ml-0.5" />
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. ASSISTANT TEXT / MARKDOWN */}
                {(displayContent || (!steps.length && isStreamingThis)) && (
                  <div className="rounded-2xl p-3 bg-surface-elevated/40 border border-border/60 text-text-primary leading-relaxed shadow-sm">
                    {displayContent ? (
                      <MarkdownContent content={displayContent} />
                    ) : (
                      <span className="text-text-secondary text-xs italic">
                        {currentStatus || 'Generating response...'}
                      </span>
                    )}
                    {isStreamingThis && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-accent animate-pulse align-middle" />
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* 3. INPUT FORM AREA */}
      <div className="p-4 pt-0 shrink-0">
        <form ref={formRef} onSubmit={handleSubmit} className="w-full">
          <div className="rounded-2xl border border-border bg-surface-elevated focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all p-2.5 flex flex-col gap-2 shadow-sm">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the agent to change your code..."
              aria-label="Message"
              rows={2}
              className="w-full bg-transparent resize-none outline-none text-xs text-text-primary placeholder:text-text-secondary min-h-[48px] max-h-36 custom-scrollbar leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />

            <div className="flex items-center justify-between pt-1">
              {/* Context Dropdown (+) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label="Add context"
                  onClick={() => setIsContextOpen(!isContextOpen)}
                  className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                  title="Add context"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {isContextOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 rounded-xl bg-surface-elevated border border-border shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsContextOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-text-primary hover:bg-surface text-left transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-accent" />
                      <span>Add Photos & Files</span>
                    </button>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      type="button"
                      onClick={() => {
                        setPrompt((prev) =>
                          prev ? `${prev}\n[Deep Research] ` : '[Deep Research] '
                        );
                        setIsContextOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-text-primary hover:bg-surface text-left transition-colors"
                    >
                      <Telescope className="w-3.5 h-3.5 text-accent" />
                      <span>Deep Research</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrompt((prev) =>
                          prev ? `${prev}\n[Web Search] ` : '[Web Search] '
                        );
                        setIsContextOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-text-primary hover:bg-surface text-left transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-accent" />
                      <span>Web Search</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const fileNames = Array.from(files)
                      .map((f) => f.name)
                      .join(', ');
                    setPrompt((prev) =>
                      prev
                        ? `${prev} [Attached: ${fileNames}]`
                        : `Review files: ${fileNames}`
                    );
                    textareaRef.current?.focus();
                  }
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!canSend}
                className="w-7 h-7 rounded-lg bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ml-auto"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
