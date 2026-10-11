import React, { useMemo } from 'react';
import { ProjectFile } from '../types';
import { FileCode, FileJson, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FileTreeProps {
  files: ProjectFile[];
  activeFilePath: string | null;
  onSelectFile: (file: ProjectFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onSelectFile,
}) => {
  const getIcon = (filePath: string) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      return <FileCode className="w-3.5 h-3.5 text-accent shrink-0" />;
    }
    if (filePath.endsWith('.json')) {
      return <FileJson className="w-3.5 h-3.5 text-[#eab308] shrink-0" />; // yellow
    }
    return <FileText className="w-3.5 h-3.5 text-text-secondary shrink-0" />;
  };

  // Simple flat rendering for now, could be hierarchical
  return (
    <div className="flex flex-col select-none py-2 h-full">
      {files.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-text-secondary">
          No files generated yet.
        </div>
      ) : (
        <div className="space-y-0.5">
          {files.map((file) => {
            const isActive = activeFilePath === file.filePath;
            // Extract just the name or structure
            const segments = file.filePath.split('/');
            const name = segments[segments.length - 1];
            const indent = segments.length - 1;

            return (
              <button
                key={file.filePath}
                onClick={() => onSelectFile(file)}
                style={{ paddingLeft: `${indent * 12 + 12}px` }}
                className={twMerge(
                  "w-full text-left pr-3 py-1 text-sm flex items-center gap-2 transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent font-medium relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                )}
              >
                {getIcon(name)}
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
