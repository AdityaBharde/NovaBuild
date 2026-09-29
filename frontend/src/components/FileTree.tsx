import React from 'react';
import { ProjectFile } from '../types';
import { FileCode, Folder, Plus, FileText, Code } from 'lucide-react';

interface FileTreeProps {
  files: ProjectFile[];
  activeFilePath: string | null;
  onSelectFile: (file: ProjectFile) => void;
  onNewFile: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onNewFile,
}) => {
  const getIcon = (filePath: string) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      return <FileCode className="w-4 h-4 text-pink-400 shrink-0" />;
    }
    if (filePath.endsWith('.json') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
      return <Code className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  return (
    <div className="w-60 bg-[#12141a] border-r border-[#242731] flex flex-col h-full select-none">
      <div className="p-3 border-b border-[#242731] flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Folder className="w-4 h-4 text-pink-500" />
          <span>Explorer</span>
        </div>
        <button
          onClick={onNewFile}
          className="p-1 hover:bg-[#1e212b] rounded text-gray-400 hover:text-white transition"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-500">
            No files in project. Generate code with prompt panel.
          </div>
        ) : (
          files.map((file) => {
            const isActive = activeFilePath === file.filePath;
            return (
              <button
                key={file.filePath}
                onClick={() => onSelectFile(file)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 transition ${
                  isActive
                    ? 'bg-pink-500/10 text-pink-400 border-l-2 border-pink-500 font-medium'
                    : 'text-gray-300 hover:bg-[#191c24]'
                }`}
              >
                {getIcon(file.filePath)}
                <span className="truncate">{file.filePath}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
