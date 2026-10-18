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
  ChevronDown,
  FileCode,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, ExecutionStep } from '../types';
import './PromptPanel.css';

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

function StepStatusIcon({ status }: { status?: 'running' | 'error' }) {
  if (status === 'running') return <LoaderCircle className="animate-spin" />;
  if (status === 'error') return <AlertCircle />;
  return <CircleCheck />;
}

function TraceStep({ step, streaming }: { step: ExecutionStep; streaming: boolean }) {
  const running = step.status === 'running' || (streaming && step.status !== 'completed' && step.status !== 'error');
  const failed = step.status === 'error';
  const status = running ? 'running' : failed ? 'error' : undefined;
  const [open, setOpen] = useState(running);

  useEffect(() => {
    if (running) setOpen(true);
  }, [running]);

  const title = step.type === 'tool'
    ? running ? `Running ${step.title}` : failed ? `Failed: ${step.title}` : step.title.replace(/^Ran /, '')
    : step.title || (step.type === 'planning' ? 'Planning next steps' : 'Working');

  return (
    <div className={`nb-trace-step ${status ? `is-${status}` : ''}`}>
      <button
        type="button"
        className="nb-trace-step-trigger"
        onClick={() => step.detail && setOpen((value) => !value)}
        aria-expanded={step.detail ? open : undefined}
        disabled={!step.detail}
      >
        <span className="nb-trace-icon"><StepStatusIcon status={status} /></span>
        <span className="nb-trace-step-title">{title}</span>
        {step.detail && <ChevronDown className={`nb-trace-chevron ${open ? 'is-open' : ''}`} />}
      </button>
      {step.detail && open && (
        <div className="nb-trace-detail">
          {step.type === 'tool' ? (
            <pre>{step.detail}</pre>
          ) : (
            <p>{step.detail}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChainOfThought({
  steps,
  streaming,
  answering,
}: {
  steps: ExecutionStep[];
  streaming: boolean;
  answering: boolean;
}) {
  const [open, setOpen] = useState<boolean | undefined>(undefined);
  const running = streaming && !answering;
  const failed = steps.filter((step) => step.status === 'error').length;
  const status = running ? 'running' : failed > 0 ? 'error' : undefined;

  return (
    <section className="nb-trace" aria-label="Agent activity">
      <button
        type="button"
        className={`nb-trace-summary ${status ? `is-${status}` : ''}`}
        onClick={() => setOpen((value) => !(value ?? running))}
        aria-expanded={open ?? running}
      >
        <span className="nb-trace-icon"><StepStatusIcon status={status} /></span>
        <span className="nb-trace-summary-title">
          {running ? 'Working through your request' : `Completed ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}${failed ? ` · ${failed} failed` : ''}`}
        </span>
        <ChevronDown className={`nb-trace-chevron ${(open ?? running) ? 'is-open' : ''}`} />
      </button>
      {(open ?? running) && (
        <div className="nb-trace-steps">
          {steps.map((step) => (
            <TraceStep key={step.id} step={step} streaming={streaming} />
          ))}
        </div>
      )}
    </section>
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

  // Follow streamed output only while the reader is already near the bottom.
  // This avoids repeatedly pulling users away from older messages while they read.
  useEffect(() => {
    const transcript = endOfMessagesRef.current?.parentElement;
    if (!transcript) return;
    const distanceFromBottom = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
    if (distanceFromBottom < 140) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
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
    <div className="nb-chat flex flex-col h-full bg-surface">
      {/* Conversation header */}
      <div className="nb-chat-header flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm text-text-primary">NovaAI</div>
          </div>
          <div className="text-xs text-text-secondary truncate">
            {messages.length ? 'Project conversation' : 'Describe what you want to build.'}
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isStreaming}
          className="nb-chat-reset p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. MESSAGES STREAM */}
      <div className="nb-chat-transcript flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center select-none">
            <div className="nb-chat-empty-icon"><MessageCircleDashed className="w-5 h-5" /></div>
            <div className="text-base font-semibold text-text-primary mb-1">
              What are we building?
            </div>
            <p className="text-xs text-text-secondary max-w-[250px] leading-relaxed">
              Describe a feature, ask a question, or tell the agent what to change. Your project context stays connected.
            </p>
            <div className="nb-chat-suggestions">
              <button type="button" onClick={() => setPrompt('Explain the structure of this project.')}>Explain this project</button>
              <button type="button" onClick={() => setPrompt('Find and fix the most important bug in this project.')}>Find a bug</button>
            </div>
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
                  <div className="nb-chat-user-bubble max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
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
                className="nb-chat-assistant w-full flex flex-col space-y-3"
              >
                {/* 1. EXECUTION STEPS / TRACE */}
                {steps.length > 0 && (
                  <ChainOfThought
                    steps={steps}
                    streaming={isStreamingThis}
                    answering={displayContent.length > 0}
                  />
                )}

                {/* 2. ACTIVE PROGRESS FALLBACK */}
                {isStreamingThis && !steps.some((s) => s.status === 'running') && (
                  <div className="nb-chat-progress flex items-center gap-2 py-2 px-3 rounded-xl text-xs text-text-secondary">
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
                    <span className="truncate">{currentStatus || 'Working on your request...'}</span>
                  </div>
                )}

                {/* 3. CREATED / MODIFIED FILES PILLS */}
                {hasFiles && (
                  <div className="nb-chat-artifacts p-2.5 rounded-xl border flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary pl-1">
                      Changed files
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
                  <div className="nb-chat-response text-text-primary leading-relaxed">
                    {displayContent ? (
                      <MarkdownContent content={displayContent} />
                    ) : (
                      <span className="nb-chat-thinking text-xs">
                        {currentStatus || 'Preparing a response…'}
                      </span>
                    )}
                    {isStreamingThis && (
                      <span className="nb-chat-cursor inline-block w-1.5 h-4 ml-1 align-middle" />
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
      <div className="nb-chat-composer-wrap px-3 pb-3 pt-2 shrink-0">
        <form ref={formRef} onSubmit={handleSubmit} className="w-full">
          <div className="nb-chat-composer rounded-2xl border border-border bg-surface-elevated focus-within:border-accent transition-all p-3 flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask NovaAI to change your code…"
              aria-label="Message"
              rows={2}
              className="nb-chat-textarea w-full bg-transparent resize-none outline-none text-sm text-text-primary placeholder:text-text-secondary min-h-[66px] max-h-40 custom-scrollbar leading-relaxed"
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
                  className="nb-chat-add p-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
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
                className="nb-chat-send w-8 h-8 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
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
