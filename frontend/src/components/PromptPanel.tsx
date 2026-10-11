import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  FileCheck,
  Brain,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, ExecutionStep } from '../types';

interface PromptPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStatus?: string | null;
  onSendPrompt: (prompt: string) => void;
  onSelectFile?: (filePath: string) => void;
}

function sanitizeMessageText(content: string): string {
  if (!content) return '';

  // Extract completed message if present
  const completedMatch = content.match(/<message\b[^>]*\bphase="completed"[^>]*>([\s\S]*?)<\/message>/i);
  if (completedMatch && completedMatch[1]?.trim()) {
    return completedMatch[1].trim();
  }

  // Strip internal protocol tags
  let cleaned = content
    .replace(/<tool_result\b[^>]*>[\s\S]*?<\/tool_result>/gi, '')
    .replace(/<message\b[^>]*\bphase=['"]?(planning|start)['"]?[^>]*>[\s\S]*?<\/message>/gi, '')
    .replace(/<tool\b[^>]*>[\s\S]*?<\/tool>/gi, '')
    .replace(/<tool\b[^>]*\/>/gi, '')
    .replace(/<file\b[^>]*>[\s\S]*?<\/file>/gi, '')
    .replace(/<\/?message\b[^>]*>/gi, '')
    .trim();

  return cleaned;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  messages,
  isStreaming,
  currentStatus,
  onSendPrompt,
  onSelectFile,
}) => {
  const [prompt, setPrompt] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, currentStatus]);

  const toggleSteps = (msgId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === undefined ? false : !prev[msgId],
    }));
  };

  const isStepExpanded = (msgId: string, isCurrentlyStreamingMsg: boolean) => {
    if (expandedSteps[msgId] !== undefined) {
      return expandedSteps[msgId];
    }
    // Default: expanded while streaming, collapsed when completed
    return isCurrentlyStreamingMsg;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    onSendPrompt(prompt.trim());
    setPrompt('');
  };

  const getStepIcon = (type: string, status: string) => {
    if (status === 'running') {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
    switch (type) {
      case 'planning':
        return <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'tool':
        return <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'file':
        return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm font-semibold text-text-primary">How can I help you build?</p>
            <p className="text-xs text-center px-4 text-text-secondary max-w-xs">
              Ask me to build a hero section, create forms, inspect files, or add full responsive pages.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isLastMsg = i === messages.length - 1;
            const isStreamingThis = isStreaming && isLastMsg && msg.role === 'ASSISTANT';
            const displayContent =
              msg.role === 'ASSISTANT' ? sanitizeMessageText(msg.content) : msg.content;

            const hasSteps = msg.steps && msg.steps.length > 0;
            const hasFiles = msg.filesCreated && msg.filesCreated.length > 0;
            const stepsExpanded = isStepExpanded(msg.id, isStreamingThis);

            return (
              <div
                key={msg.id || i}
                className={`flex flex-col space-y-1.5 ${
                  msg.role === 'USER' ? 'items-end' : 'items-start'
                }`}
              >
                {/* USER BUBBLE */}
                {msg.role === 'USER' ? (
                  <div className="max-w-[85%] p-3 rounded-xl text-xs bg-accent text-white rounded-br-sm shadow-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                ) : (
                  /* ASSISTANT CARD */
                  <div className="w-full max-w-[95%] space-y-2">
                    {/* 1. EXECUTION STEPS TIMELINE (LIVE PROGRESS) */}
                    {(hasSteps || isStreamingThis) && (
                      <div className="rounded-xl bg-surface-elevated border border-border overflow-hidden text-xs transition-all">
                        {/* Steps Header Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleSteps(msg.id)}
                          className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-surface transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isStreamingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-semibold text-text-primary truncate">
                              {isStreamingThis
                                ? currentStatus || 'Working on your request...'
                                : `Completed in ${msg.steps?.length || 1} step${
                                    (msg.steps?.length || 1) > 1 ? 's' : ''
                                  }`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary shrink-0">
                            <span>{stepsExpanded ? 'Hide steps' : 'View details'}</span>
                            {stepsExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>

                        {/* Steps Detailed Timeline */}
                        {stepsExpanded && (
                          <div className="px-3.5 pb-3 pt-1 border-t border-border/50 space-y-2">
                            {msg.steps?.map((step) => (
                              <div
                                key={step.id}
                                className="flex items-start gap-2.5 text-[11px] leading-tight"
                              >
                                <div className="mt-0.5 shrink-0">
                                  {getStepIcon(step.type, step.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`font-medium truncate ${
                                        step.status === 'running'
                                          ? 'text-accent font-semibold'
                                          : 'text-text-primary'
                                      }`}
                                    >
                                      {step.title}
                                    </span>
                                    {step.status === 'running' && (
                                      <span className="text-[10px] text-accent animate-pulse font-medium">
                                        In progress
                                      </span>
                                    )}
                                  </div>
                                  {step.detail && (
                                    <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-2">
                                      {step.detail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}

                            {isStreamingThis && !msg.steps?.length && (
                              <div className="flex items-center gap-2 text-[11px] text-text-secondary py-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                                <span>{currentStatus || 'Initializing agent workflow...'}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. CREATED / MODIFIED FILES PILLS */}
                    {hasFiles && (
                      <div className="p-2.5 rounded-xl bg-surface-elevated/70 border border-border/80 flex flex-wrap items-center gap-2">
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
                            <span className="truncate max-w-[160px]">{filePath}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-text-secondary ml-0.5" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 3. ASSISTANT TEXT BUBBLE (CONVERSATIONAL EXPLANATION) */}
                    {(displayContent || (!hasSteps && isStreamingThis)) && (
                      <div className="p-3.5 rounded-xl text-xs bg-surface-elevated text-text-primary border border-border rounded-bl-sm shadow-sm leading-relaxed">
                        <div className="whitespace-pre-wrap break-words font-sans">
                          {displayContent}
                          {isStreamingThis && (
                            <span className="inline-block w-1.5 h-3.5 ml-1 bg-accent animate-pulse align-middle" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Prompt Form */}
      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask AI to create or modify files..."
            rows={2}
            className="w-full bg-background border border-border rounded-xl p-3 pr-12 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none custom-scrollbar shadow-sm transition-colors"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
