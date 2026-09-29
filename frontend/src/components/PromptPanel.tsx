import React, { useState } from 'react';
import { Send, Sparkles, Terminal, CheckCircle2, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface PromptPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendPrompt: (prompt: string) => void;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  messages,
  isStreaming,
  onSendPrompt,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    onSendPrompt(prompt.trim());
    setPrompt('');
  };

  return (
    <div className="w-80 bg-[#12141a] border-l border-[#242731] flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#242731] flex items-center space-x-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <Sparkles className="w-4 h-4 text-pink-500" />
        <span>AI Builder Chat</span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-pink-500/40" />
            <p className="font-medium text-gray-400">Describe what you want to build</p>
            <p className="text-[11px] text-gray-500 px-4">
              "Create a SaaS landing page with hero, features, and pricing table."
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`p-3 rounded-lg border ${
                msg.role === 'USER'
                  ? 'bg-pink-500/10 border-pink-500/30 text-gray-200'
                  : 'bg-[#191c24] border-[#292d3a] text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <span>{msg.role === 'USER' ? 'You' : 'Nova AI Engine'}</span>
              </div>
              <div className="whitespace-pre-wrap font-mono leading-relaxed">{msg.content}</div>
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex items-center space-x-2 text-pink-400 text-xs p-2 bg-pink-500/5 rounded border border-pink-500/20">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Streaming AI code generation...</span>
          </div>
        )}
      </div>

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#242731]">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask Nova AI to add features, fix styling, or build components..."
            rows={3}
            className="w-full bg-[#191c24] border border-[#2b2f3e] rounded-lg p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none custom-scrollbar"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
