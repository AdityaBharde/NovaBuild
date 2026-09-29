import React, { useState } from 'react';
import { SandboxStatus } from '../types';
import { RefreshCw, ExternalLink, Monitor, Play, AlertTriangle } from 'lucide-react';

interface PreviewWindowProps {
  status: SandboxStatus | null;
  onDeploy: () => void;
  isDeploying: boolean;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({ status, onDeploy, isDeploying }) => {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex-1 bg-[#0b0c10] border-l border-[#242731] flex flex-col h-full">
      {/* Control Bar */}
      <div className="h-9 bg-[#12141a] border-b border-[#242731] flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <Monitor className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-gray-300">Live App Preview</span>
          {status && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                status.status === 'RUNNING'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}
            >
              {status.status}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {status?.previewUrl && (
            <>
              <button
                onClick={handleRefresh}
                className="p-1 hover:bg-[#1f222c] rounded text-gray-400 hover:text-white transition"
                title="Refresh Preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <a
                href={status.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:bg-[#1f222c] rounded text-gray-400 hover:text-white transition"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 relative bg-white">
        {status?.previewUrl && status.status === 'RUNNING' ? (
          <iframe
            key={iframeKey}
            src={status.previewUrl}
            className="w-full h-full border-0"
            title="App Preview"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0e0f12] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200 mb-1">Sandbox Preview Environment</h3>
            <p className="text-xs text-gray-500 max-w-xs mb-4">
              Deploy your project code into isolated preview environment.
            </p>
            <button
              onClick={onDeploy}
              disabled={isDeploying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isDeploying ? 'Starting Container...' : 'Spin Up Preview Container'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
