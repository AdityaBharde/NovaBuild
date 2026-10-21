import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUp,
  CircleCheck,
  LoaderCircle,
  MessageCircleDashed,
  RotateCw,
  ChevronDown,
  FileCode,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Square,
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
  onStopGeneration?: () => void;
  onRetry?: (message: ChatMessage) => void;
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
  const parts = content.split(/(```[\s\S]*?(?:```|$))/g);

  return (
    <div className="space-y-2 leading-relaxed text-xs">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const rawBlock = part.slice(3).replace(/```$/, '');
          const lines = rawBlock.replace(/^\n/, '').replace(/\n$/, '').split('\n');
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
              {(language || code) && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-surface-elevated/70 border-b border-border/60 text-[10px] text-text-secondary uppercase font-semibold">
                  <span>{language}</span>
                  <CodeCopyButton code={code} />
                </div>
              )}
              <pre className="p-3 overflow-x-auto custom-scrollbar text-text-primary whitespace-pre">
                <code>{highlightCode(code)}</code>
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

function highlightCode(code: string): React.ReactNode {
  const tokenPattern = /(\/\/[^\n]*|\b(?:const|let|var|function|return|if|else|class|new|import|from|export|default|async|await|public|private|static|void|int|string|boolean|true|false|null|undefined|package|interface|type|extends|implements|try|catch|throw|switch|case|break)\b|"[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b)/g;
  const tokens = code.split(tokenPattern);
  return tokens.map((token, index) => {
    if (/^\/\//.test(token)) return <span key={index} className="nb-code-comment">{token}</span>;
    if (/^["']/.test(token)) return <span key={index} className="nb-code-string">{token}</span>;
    if (/^\d/.test(token)) return <span key={index} className="nb-code-number">{token}</span>;
    if (/^(const|let|var|function|return|if|else|class|new|import|from|export|default|async|await|public|private|static|void|int|string|boolean|true|false|null|undefined|package|interface|type|extends|implements|try|catch|throw|switch|case|break)$/.test(token)) {
      return <span key={index} className="nb-code-keyword">{token}</span>;
    }
    return token;
  });
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className="nb-code-copy" onClick={handleCopy} aria-label="Copy code">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function FileChangeReview({ change, onSelectFile }: {
  change: NonNullable<ChatMessage['fileChanges']>[number];
  onSelectFile?: (path: string) => void;
}) {
  return (
    <details className="nb-file-change">
      <summary>
        <span className={`nb-file-action is-${change.action}`}>{change.action}</span>
        <code>{change.path}</code>
      </summary>
      <div className="nb-file-diff">
        <div>
          <div className="nb-file-diff-label">Before</div>
          <pre>{change.previousContent ?? '(No previous content available)'}</pre>
        </div>
        <div>
          <div className="nb-file-diff-label">After</div>
          <pre>{change.action === 'deleted' ? '(File deleted)' : change.content ?? '(Updated content not included in stream)'}</pre>
        </div>
      </div>
      {change.action !== 'deleted' && onSelectFile && (
        <button type="button" className="nb-file-open" onClick={() => onSelectFile(change.path)}>
          Open in editor
        </button>
      )}
    </details>
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
  onStopGeneration,
  onRetry,
}) => {
  const [prompt, setPrompt] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  }, [prompt]);

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
            const fileChanges = msg.fileChanges || [];
            const canRetry = msg.error && !isStreaming && onRetry;

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

                {fileChanges.length > 0 && (
                  <section className="nb-file-review" aria-label="Changed file review">
                    <div className="nb-file-review-heading">File changes · {fileChanges.length}</div>
                    {fileChanges.map((change, changeIndex) => (
                      <FileChangeReview key={`${change.path}-${changeIndex}`} change={change} onSelectFile={onSelectFile} />
                    ))}
                  </section>
                )}

                {canRetry && (
                  <button type="button" className="nb-chat-retry" onClick={() => onRetry?.(msg)}>
                    <RotateCw className="w-3.5 h-3.5" />
                    Retry response
                  </button>
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
              rows={1}
              className="nb-chat-textarea w-full bg-transparent resize-none outline-none text-sm text-text-primary placeholder:text-text-secondary min-h-[28px] max-h-40 custom-scrollbar leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />

            <div className="flex items-center justify-between pt-1">
              {/* Send Button */}
              {isStreaming ? (
                <button type="button" onClick={onStopGeneration} disabled={!onStopGeneration} className="nb-chat-stop w-8 h-8 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-text-primary flex items-center justify-center transition-colors ml-auto" title="Stop generation" aria-label="Stop generation">
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : <button
                type="submit"
                disabled={!canSend}
                className="nb-chat-send w-8 h-8 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </button>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
