import React from 'react';
import Editor from '@monaco-editor/react';
import { ProjectFile } from '../types';
import { Code2 } from 'lucide-react';

interface CodeEditorProps {
  activeFile: ProjectFile | null;
  onChangeContent: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ activeFile, onChangeContent }) => {
  if (!activeFile) {
    return (
      <div className="flex-1 bg-[#0e0f12] flex flex-col items-center justify-center text-gray-500 select-none">
        <Code2 className="w-12 h-12 mb-3 text-gray-600" />
        <p className="text-sm font-medium">Select a file from the explorer or generate a new app</p>
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
    <div className="flex-1 flex flex-col h-full bg-[#0e0f12]">
      {/* Tab Header */}
      <div className="h-9 bg-[#12141a] border-b border-[#242731] flex items-center px-4">
        <span className="text-xs font-mono text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded border border-pink-500/20">
          {activeFile.filePath}
        </span>
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
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            lineNumbers: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};
