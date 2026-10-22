import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ExecutionStep, ChatFileChange } from '../types';
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

// ---------------------------------------------------------------------------
// 1. Message Sanitization: robust handling of protocol tags & streaming edge cases
// ---------------------------------------------------------------------------
export function sanitizeMessageText(content: string): string {
  if (!content) return '';

  let text = content;

  // 1. Suppress trailing unclosed planning/start tags while streaming
  if (/<message\b[^>]*\bphase=['"]?(planning|start)['"]?[^>]*>(?![\s\S]*?<\/message>)/i.test(text)) {
    text = text.replace(/<message\b[^>]*\bphase=['"]?(planning|start)['"]?[^>]*>[\s\S]*$/i, '');
  }

  // 2. Strip closed planning and start message blocks
  text = text.replace(/<message\b[^>]*\bphase=['"]?(planning|start)['"]?[^>]*>[\s\S]*?<\/message>/gi, '');

  // 3. Strip internal tool results and tool invocation tags
  text = text.replace(/<tool_result\b[^>]*>[\s\S]*?<\/tool_result>/gi, '');
  text = text.replace(/<tool\b[^>]*>[\s\S]*?<\/tool>/gi, '');
  text = text.replace(/<tool\b[^>]*\/>/gi, '');

  // 4. Strip file blocks (both closed and unclosed trailing file writes)
  text = text.replace(/<file\b[^>]*>[\s\S]*?<\/file>/gi, '');
  if (/<file\b[^>]*>(?![\s\S]*?<\/file>)/i.test(text)) {
    text = text.replace(/<file\b[^>]*>[\s\S]*$/i, '');
  }

  // 5. Strip message tags (completed or generic opening/closing)
  text = text.replace(/<\/?message\b[^>]*>/gi, '');

  text = text.trim();

  // 6. Treat backend fallback "Request processed." as empty so the UI can render meaningful states
  if (text.toLowerCase() === 'request processed.' || text.toLowerCase() === 'request processed') {
    return '';
  }

  return text;
}

// ---------------------------------------------------------------------------
// 2. Minimal Inline SVG Icons (strictly zero Lucide dependency)
// ---------------------------------------------------------------------------
function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function RotateCwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`nova-spinner ${className || ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. Syntax Highlighting & Code Block
// ---------------------------------------------------------------------------
function highlightCode(code: string): React.ReactNode {
  const tokenPattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|\b(?:const|let|var|function|return|if|else|class|new|import|from|export|default|async|await|public|private|static|void|int|string|boolean|true|false|null|undefined|package|interface|type|extends|implements|try|catch|throw|switch|case|break|continue|for|while|do)\b|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`|\b\d+(?:\.\d+)?\b)/g;
  const tokens = code.split(tokenPattern);

  return tokens.map((token, index) => {
    if (!token) return null;
    if (token.startsWith('//') || token.startsWith('/*')) {
      return <span key={index} className="nova-code-comment">{token}</span>;
    }
    if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      return <span key={index} className="nova-code-string">{token}</span>;
    }
    if (/^\d/.test(token)) {
      return <span key={index} className="nova-code-number">{token}</span>;
    }
    if (/^(const|let|var|function|return|if|else|class|new|import|from|export|default|async|await|public|private|static|void|int|string|boolean|true|false|null|undefined|package|interface|type|extends|implements|try|catch|throw|switch|case|break|continue|for|while|do)$/.test(token)) {
      return <span key={index} className="nova-code-keyword">{token}</span>;
    }
    return token;
  });
}

const CodeBlock = React.memo(({ code, language }: { code: string; language?: string }) => {
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
    <div className="nova-code-block">
      <div className="nova-code-header">
        <span className="nova-code-lang">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="nova-code-copy"
          aria-label="Copy code to clipboard"
        >
          {copied ? <CheckIcon className="text-emerald-400" /> : <CopyIcon />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="nova-code-pre custom-scrollbar">
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
});

// ---------------------------------------------------------------------------
// 4. Markdown Rendering: Headers, Lists, Links, Inline Code & Paragraphs
// ---------------------------------------------------------------------------
function renderInlineFormatted(text: string): React.ReactNode {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="nova-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="nova-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="nova-em">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      const isSafe = /^https?:\/\//i.test(href) || href.startsWith('/');
      return isSafe ? (
        <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="nova-link">
          {linkMatch[1]}
        </a>
      ) : (
        <span key={idx}>{linkMatch[1]}</span>
      );
    }
    return part;
  });
}

interface MarkdownBlock {
  type: 'code' | 'text';
  language?: string;
  code?: string;
  content?: string;
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)[ \t]*\n?([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      if (text.length > 0) {
        blocks.push({ type: 'text', content: text });
      }
    }
    blocks.push({
      type: 'code',
      language: match[1]?.trim() || '',
      code: match[2].replace(/\n$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    if (remaining.length > 0) {
      blocks.push({ type: 'text', content: remaining });
    }
  }

  return blocks;
}

const MarkdownRenderer = React.memo(({ content }: { content: string }) => {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="nova-markdown space-y-2.5">
      {blocks.map((block, idx) => {
        if (block.type === 'code' && block.code !== undefined) {
          return (
            <CodeBlock
              key={idx}
              language={block.language}
              code={block.code}
            />
          );
        }

        const lines = (block.content || '').split('\n');
        return (
          <div key={idx} className="nova-text-block space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} className="h-1" />;
              }

              // Headings
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={lineIdx} className="nova-h4">
                    {renderInlineFormatted(trimmed.slice(5))}
                  </h4>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={lineIdx} className="nova-h3">
                    {renderInlineFormatted(trimmed.slice(4))}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={lineIdx} className="nova-h2">
                    {renderInlineFormatted(trimmed.slice(3))}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={lineIdx} className="nova-h1">
                    {renderInlineFormatted(trimmed.slice(2))}
                  </h1>
                );
              }

              // Bullet lists
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="nova-list-item">
                    <span className="nova-bullet" aria-hidden="true">•</span>
                    <span className="nova-list-content">
                      {renderInlineFormatted(trimmed.slice(2))}
                    </span>
                  </div>
                );
              }

              // Numbered lists
              const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (orderedMatch) {
                return (
                  <div key={lineIdx} className="nova-list-item">
                    <span className="nova-number" aria-hidden="true">{orderedMatch[1]}.</span>
                    <span className="nova-list-content">
                      {renderInlineFormatted(orderedMatch[2])}
                    </span>
                  </div>
                );
              }

              // Blockquotes
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote key={lineIdx} className="nova-blockquote">
                    {renderInlineFormatted(trimmed.slice(2))}
                  </blockquote>
                );
              }

              // Standard paragraph
              return (
                <p key={lineIdx} className="nova-p">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

// ---------------------------------------------------------------------------
// 5. Activity & Execution Steps Section (Restrained, Collapsible)
// ---------------------------------------------------------------------------
function ActivityStepItem({ step }: { step: ExecutionStep }) {
  const [showDetail, setShowDetail] = useState(false);
  const isRunning = step.status === 'running';
  const isError = step.status === 'error';
  const hasDetail = Boolean(step.detail && step.detail.trim());

  return (
    <div className={`nova-step-item is-${step.status}`}>
      <div className="nova-step-row">
        <span className="nova-step-icon">
          {isRunning ? (
            <SpinnerIcon className="text-accent" />
          ) : isError ? (
            <AlertCircleIcon className="text-red-400" />
          ) : (
            <CheckIcon className="text-emerald-400" />
          )}
        </span>
        <span className="nova-step-title">{step.title}</span>
        {hasDetail && (
          <button
            type="button"
            className="nova-step-detail-toggle"
            onClick={() => setShowDetail((prev) => !prev)}
            aria-expanded={showDetail}
          >
            {showDetail ? 'Hide details' : 'Details'}
          </button>
        )}
      </div>
      {showDetail && hasDetail && (
        <div className="nova-step-detail">
          <pre>{step.detail}</pre>
        </div>
      )}
    </div>
  );
}

function ActivitySection({
  steps,
  isStreaming,
  currentStatus,
}: {
  steps: ExecutionStep[];
  isStreaming: boolean;
  currentStatus?: string | null;
}) {
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const runningStep = steps.find((s) => s.status === 'running');
  const failedSteps = steps.filter((s) => s.status === 'error');
  const hasFailed = failedSteps.length > 0;

  // Auto-expand during streaming so user sees progress; auto-collapse once finished
  const isExpanded = userToggled !== null ? userToggled : isStreaming;

  if (steps.length === 0 && !isStreaming) return null;

  const headerTitle = isStreaming
    ? (currentStatus || runningStep?.title || 'Processing request...')
    : hasFailed
    ? `Completed with ${failedSteps.length} failed ${failedSteps.length === 1 ? 'step' : 'steps'}`
    : `Completed ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`;

  return (
    <section className={`nova-activity ${isStreaming ? 'is-streaming' : ''} ${hasFailed ? 'is-error' : ''}`} aria-label="Execution activity">
      <button
        type="button"
        className="nova-activity-summary"
        onClick={() => setUserToggled(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle execution activity"
      >
        <span className="nova-activity-status-icon">
          {isStreaming ? (
            <SpinnerIcon className="text-accent" />
          ) : hasFailed ? (
            <AlertCircleIcon className="text-red-400" />
          ) : (
            <CheckIcon className="text-emerald-400" />
          )}
        </span>
        <span className="nova-activity-title">{headerTitle}</span>
        <ChevronDownIcon className={`nova-activity-chevron ${isExpanded ? 'is-open' : ''}`} />
      </button>

      {isExpanded && steps.length > 0 && (
        <div className="nova-activity-steps">
          {steps.map((step) => (
            <ActivityStepItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Changed Files Presentation
// ---------------------------------------------------------------------------
function FileChangesSection({
  changes,
  onSelectFile,
}: {
  changes: ChatFileChange[];
  onSelectFile?: (path: string) => void;
}) {
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

  if (!changes || changes.length === 0) return null;

  const toggleDiff = (path: string) => {
    setExpandedDiffs((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="nova-file-changes">
      <div className="nova-file-changes-header">
        <FileTextIcon className="text-accent" />
        <span>Changed files ({changes.length})</span>
      </div>
      <div className="nova-file-changes-list">
        {changes.map((change) => {
          const hasDiff = Boolean(change.previousContent || change.content);
          const isExpanded = Boolean(expandedDiffs[change.path]);

          return (
            <div key={change.path} className="nova-file-change-item">
              <div className="nova-file-change-row">
                <span className={`nova-file-badge is-${change.action}`}>
                  {change.action}
                </span>
                <span className="nova-file-path font-mono" title={change.path}>
                  {change.path}
                </span>
                <div className="nova-file-actions">
                  {hasDiff && (
                    <button
                      type="button"
                      className="nova-file-btn"
                      onClick={() => toggleDiff(change.path)}
                    >
                      {isExpanded ? 'Hide diff' : 'Diff'}
                    </button>
                  )}
                  {onSelectFile && change.action !== 'deleted' && (
                    <button
                      type="button"
                      className="nova-file-btn is-primary"
                      onClick={() => onSelectFile(change.path)}
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && hasDiff && (
                <div className="nova-file-diff-view">
                  {change.previousContent !== undefined && (
                    <div className="nova-diff-column">
                      <div className="nova-diff-label">Original</div>
                      <pre className="custom-scrollbar">{change.previousContent || '(Empty file)'}</pre>
                    </div>
                  )}
                  <div className="nova-diff-column">
                    <div className="nova-diff-label">{change.action === 'deleted' ? 'Deleted' : 'Updated'}</div>
                    <pre className="custom-scrollbar">{change.action === 'deleted' ? '(File deleted)' : (change.content || '(Content not available)')}</pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Individual Message Views (Memoized)
// ---------------------------------------------------------------------------
const UserMessageView = React.memo(({ message }: { message: ChatMessage }) => {
  return (
    <div className="nova-user-row">
      <div className="nova-user-bubble">
        <div className="nova-user-text">{message.content}</div>
        {message.timestamp && <span className="nova-msg-timestamp">{message.timestamp}</span>}
      </div>
    </div>
  );
});

const AssistantMessageView = React.memo(
  ({
    message,
    isStreamingThis,
    currentStatus,
    onSelectFile,
    onRetry,
  }: {
    message: ChatMessage;
    isStreamingThis: boolean;
    currentStatus?: string | null;
    onSelectFile?: (path: string) => void;
    onRetry?: (message: ChatMessage) => void;
  }) => {
    const rawContent = message.content || '';
    const displayContent = sanitizeMessageText(rawContent);
    const steps = message.steps || [];
    const fileChanges = message.fileChanges || [];
    const isError = Boolean(message.error);
    const hasFiles = fileChanges.length > 0;
    const canRetry = isError && !isStreamingThis && Boolean(onRetry);

    // Empty response case: stream finished, no conversational text, no file changes
    const isEmptyResponse = !isStreamingThis && !displayContent && !hasFiles;

    return (
      <div className="nova-assistant-row">
        <div className="nova-assistant-header">
          <div className="nova-assistant-badge">
            <SparklesIcon className="text-accent" />
            <span className="nova-assistant-name">NovaAI</span>
          </div>
          {message.timestamp && <span className="nova-msg-timestamp">{message.timestamp}</span>}
        </div>

        {/* 1. Execution steps / Activity */}
        <ActivitySection
          steps={steps}
          isStreaming={isStreamingThis}
          currentStatus={currentStatus}
        />

        {/* 2. File changes */}
        <FileChangesSection changes={fileChanges} onSelectFile={onSelectFile} />

        {/* 3. Assistant text answer */}
        {displayContent ? (
          <div className="nova-response-content">
            <MarkdownRenderer content={displayContent} />
            {isStreamingThis && <span className="nova-streaming-cursor" aria-hidden="true" />}
          </div>
        ) : isStreamingThis && !steps.length ? (
          <div className="nova-initial-loading" role="status" aria-live="polite">
            <SpinnerIcon className="text-accent" />
            <span>{currentStatus || 'Thinking...'}</span>
          </div>
        ) : null}

        {/* 4. Empty response state */}
        {isEmptyResponse && !isStreamingThis && (
          <div className="nova-empty-response-alert" role="alert">
            <div className="nova-alert-body">
              <AlertCircleIcon className="text-amber-400" />
              <span>NovaAI completed the request without generating a response.</span>
            </div>
            {canRetry && (
              <button
                type="button"
                className="nova-retry-btn"
                onClick={() => onRetry?.(message)}
              >
                <RotateCwIcon />
                <span>Retry request</span>
              </button>
            )}
          </div>
        )}

        {/* 5. Error state with retry action */}
        {isError && !isEmptyResponse && !isStreamingThis && (
          <div className="nova-error-alert" role="alert">
            <div className="nova-alert-body">
              <AlertCircleIcon className="text-red-400" />
              <span>{rawContent.startsWith('Generation failed:') || rawContent.startsWith('Failed to') ? rawContent : 'A problem occurred while completing this request.'}</span>
            </div>
            {canRetry && (
              <button
                type="button"
                className="nova-retry-btn"
                onClick={() => onRetry?.(message)}
              >
                <RotateCwIcon />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// 8. Empty Conversation State
// ---------------------------------------------------------------------------
function EmptyChatView({ onSelectPrompt }: { onSelectPrompt: (text: string) => void }) {
  const suggestions = [
    'Explain the structure and architecture of this project',
    'Review the code and fix potential bugs or errors',
    'Add a modern responsive hero section with a call to action',
  ];

  return (
    <div className="nova-empty-view">
      <div className="nova-empty-icon">
        <SparklesIcon className="w-5 h-5 text-accent" />
      </div>
      <h3 className="nova-empty-title">What would you like to build?</h3>
      <p className="nova-empty-desc">
        Describe a feature, ask questions about your codebase, or instruct NovaAI to make changes.
      </p>
      <div className="nova-suggestions">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="nova-suggestion-chip"
            onClick={() => onSelectPrompt(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. Prompt Composer
// ---------------------------------------------------------------------------
function Composer({
  prompt,
  setPrompt,
  onSend,
  onStop,
  isStreaming,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [prompt]);

  const canSend = prompt.trim().length > 0 && !isStreaming;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend(prompt.trim());
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onSend(prompt.trim());
    }
  };

  return (
    <form className="nova-composer-form" onSubmit={handleFormSubmit}>
      <div className="nova-composer-box">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask NovaAI to build or change code..."
          aria-label="Message prompt for NovaAI"
          rows={1}
          disabled={isStreaming}
          className="nova-composer-textarea custom-scrollbar"
        />

        <div className="nova-composer-footer">
          <span className="nova-composer-hint">
            <kbd className="nova-kbd">Enter</kbd> to send, <kbd className="nova-kbd">Shift+Enter</kbd> for newline
          </span>

          <div className="nova-composer-actions">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="nova-stop-btn"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <StopIcon />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSend}
                className="nova-send-btn"
                title="Send message"
                aria-label="Send message"
              >
                <ArrowUpIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 10. Main PromptPanel Component
// ---------------------------------------------------------------------------
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
  const transcriptRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll only when user is already near bottom to avoid pulling them away while reading
  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    const distanceFromBottom = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
    if (distanceFromBottom < 120) {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isStreaming, currentStatus]);

  const handleSend = (text: string) => {
    onSendPrompt(text);
    setPrompt('');
  };

  return (
    <div className="nova-chat">
      {/* 1. Header */}
      <header className="nova-chat-header">
        <div className="nova-header-info">
          <div className="nova-header-title-row">
            <span className="nova-header-title">NovaAI</span>
            {isStreaming && (
              <span className="nova-header-live-badge">
                <SpinnerIcon className="w-3 h-3 text-accent" />
                <span>Working</span>
              </span>
            )}
          </div>
          <span className="nova-header-sub">
            {messages.length ? `${messages.length} messages` : 'Connected to workspace context'}
          </span>
        </div>

        <button
          type="button"
          onClick={onResetChat}
          disabled={isStreaming || messages.length === 0}
          className="nova-header-reset-btn"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <RotateCwIcon />
        </button>
      </header>

      {/* 2. Messages transcript */}
      <div ref={transcriptRef} className="nova-chat-transcript custom-scrollbar">
        {messages.length === 0 ? (
          <EmptyChatView onSelectPrompt={(text) => setPrompt(text)} />
        ) : (
          messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const isStreamingThis = isStreaming && isLast && msg.role === 'ASSISTANT';

            if (msg.role === 'USER') {
              return <UserMessageView key={msg.id || idx} message={msg} />;
            }

            return (
              <AssistantMessageView
                key={msg.id || idx}
                message={msg}
                isStreamingThis={isStreamingThis}
                currentStatus={isStreamingThis ? currentStatus : null}
                onSelectFile={onSelectFile}
                onRetry={onRetry}
              />
            );
          })
        )}
        <div ref={bottomAnchorRef} />
      </div>

      {/* 3. Composer */}
      <div className="nova-composer-wrap">
        <Composer
          prompt={prompt}
          setPrompt={setPrompt}
          onSend={handleSend}
          onStop={onStopGeneration}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};
