import React, { useState } from 'react';
import { SandboxStatus } from '../types';
import { RefreshCw, ExternalLink, Play, Loader2, Monitor, Code, X } from 'lucide-react';

interface PreviewWindowProps {
  status: SandboxStatus | null;
  htmlContent?: string | null;
  previewTitle?: string;
  onDeploy: () => void;
  isDeploying: boolean;
  onClose?: () => void;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  status,
  htmlContent,
  previewTitle,
  onDeploy,
  isDeploying,
  onClose,
}) => {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else if (status?.previewUrl) {
      window.open(status.previewUrl, '_blank');
    }
  };

  const hasStaticHtml = Boolean(htmlContent && htmlContent.trim().length > 0);
  const isContainerRunning = Boolean(status?.previewUrl && status.status === 'RUNNING');

  return (
    <div className="flex-1 flex flex-col h-full bg-background border-l border-border relative">
      {/* Header controls */}
      <div className="h-9 border-b border-border bg-surface px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
          {hasStaticHtml ? (
            <>
              <Code className="w-3.5 h-3.5 text-accent" />
              <span className="text-text-primary font-medium truncate">{previewTitle || 'index.html'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold">HTML</span>
            </>
          ) : isContainerRunning ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span className="text-text-primary font-medium">Live Container</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7950e8]/15 text-[#c4b5fd] font-semibold border border-[#7950e8]/30">Running</span>
            </>
          ) : (
            <>
              <Monitor className="w-3.5 h-3.5 text-text-secondary" />
              <span>Preview</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {(hasStaticHtml || isContainerRunning) && (
            <>
              <button
                onClick={handleRefresh}
                className="p-1 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
                title="Refresh Preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleOpenExternal}
                className="p-1 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full bg-white relative">
        {hasStaticHtml ? (
          <iframe
            key={iframeKey}
            srcDoc={htmlContent || ''}
            className="w-full h-full border-0"
            title="Static HTML Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          />
        ) : isContainerRunning ? (
          <iframe
            key={iframeKey}
            src={status?.previewUrl}
            className="w-full h-full border-0"
            title="App Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center mb-4 shadow-sm">
              <Monitor className="w-5 h-5 text-text-secondary" />
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-1">Preview Environment</h3>
            <p className="text-xs text-text-secondary max-w-xs mb-6 leading-relaxed">
              Generate an HTML page or deploy a runner container to preview your changes.
            </p>
            <button
              onClick={onDeploy}
              disabled={isDeploying}
              className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Container
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
