import React from 'react';
import Editor from '@monaco-editor/react';
import { ProjectFile } from '../types';
import { Code2, FileCode } from 'lucide-react';

interface CodeEditorProps {
  activeFile: ProjectFile | null;
  onChangeContent: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ activeFile, onChangeContent }) => {
  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary select-none">
        <Code2 className="w-10 h-10 mb-3 text-border" />
        <p className="text-sm">Select a file to view code</p>
      </div>
    );
  }

  const getLanguage = (path: string) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.html')) return 'html';
    return 'plaintext';
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Tab Header */}
      <div className="h-9 border-b border-border bg-surface flex items-center px-1 shrink-0 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 px-3 py-1.5 h-full bg-background border-t-2 border-t-accent border-r border-l border-border rounded-t-sm text-sm text-text-primary min-w-fit">
          <FileCode className="w-3.5 h-3.5 text-accent" />
          <span className="truncate">{activeFile.filePath.split('/').pop()}</span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={getLanguage(activeFile.filePath)}
          value={activeFile.content}
          onChange={(val) => onChangeContent(val || '')}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            lineNumbers: 'on',
            automaticLayout: true,
            padding: { top: 16 },
            // Customize the dark theme colors slightly via options if possible, or just use vs-dark
          }}
          loading={
            <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
};
