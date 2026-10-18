import React, { useState, useEffect } from 'react';
import { Project, ProjectFile, ChatMessage, SandboxStatus, StreamEvent } from '../types';
import { FileTree } from './FileTree';
import { CodeEditor } from './CodeEditor';
import { PromptPanel } from './PromptPanel';
import { PreviewWindow } from './PreviewWindow';
import { getProjectFiles, getFileContent, saveFileContent, deploySandbox, getSandboxStatus, getChatHistory, CHAT_STREAM_URL } from '../api/client';
import { Layers, ChevronLeft, Play, Loader2, Save, Monitor } from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onBack }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadWorkspaceData();
  }, [project.id]);

  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await saveFileContent(String(project.id), activeFile.filePath, activeFile.content);
    } catch (e) {
      console.error('Failed to save file', e);
      alert('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const loadWorkspaceData = async () => {
    setIsLoadingFiles(true);
    try {
      // 1. Fetch file tree
      const paths = await getProjectFiles(String(project.id));
      const initialFiles = paths.map(p => ({ filePath: p.path, content: '' }));
      setFiles(initialFiles);

      if (initialFiles.length > 0) {
        // Prefer index.html or first file
        const htmlTarget = initialFiles.find(f => f.filePath === 'index.html' || f.filePath.endsWith('.html'));
        const target = htmlTarget || initialFiles[0];
        try {
          const content = await getFileContent(String(project.id), target.filePath);
          const fullFile = { ...target, content };
          setFiles(prev => prev.map(f => f.filePath === target.filePath ? fullFile : f));
          setActiveFile(fullFile);
          if (target.filePath.endsWith('.html')) {
            setShowPreview(true);
          }
        } catch (err) {
          console.warn('Could not preload active file content:', err);
          setActiveFile(target);
        }
      }

      // 2. Fetch sandbox status
      const status = await getSandboxStatus(String(project.id));
      setSandboxStatus(status);
      if (status && status.status === 'RUNNING') {
        setShowPreview(true);
      }

      // 3. Fetch chat history
      const history = await getChatHistory(String(project.id));
      if (history && Array.isArray(history)) {
        setMessages(history.map((h: any) => ({
          id: String(h.id || Date.now()),
          role: h.role || 'USER',
          content: h.text || h.content || ''
        })));
      }
    } catch (e) {
      console.error('Failed to load workspace data', e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectFile = async (file: ProjectFile) => {
    if (!file.content) {
      try {
        const content = await getFileContent(String(project.id), file.filePath);
        const updated = { ...file, content };
        setFiles(prev => prev.map(f => f.filePath === file.filePath ? updated : f));
        setActiveFile(updated);
      } catch (e) {
        console.error('Failed to fetch file content', e);
        setActiveFile(file);
      }
    } else {
      setActiveFile(file);
    }
  };

  const handleDeployPreview = async () => {
    setIsDeploying(true);
    try {
      const status = await deploySandbox(String(project.id));
      setSandboxStatus(status);
      setShowPreview(true);
    } catch (e) {
      console.error('Deploy failed', e);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSendPrompt = async (promptText: string) => {
    const userMsg: ChatMessage = { id: String(Date.now()), role: 'USER', content: promptText };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setCurrentStatus('Thinking...');

    const assistantMsgId = String(Date.now() + 1);
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'ASSISTANT', content: '' }]);

    try {
      const token = localStorage.getItem('novabuild_token') || '';
      const response = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: promptText, projectId: project.id })
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      if (!response.body) throw new Error('No readable stream received from server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let messageContent = '';
      let streamUpdateFrame: number | null = null;

      // Coalesce rapid text deltas into at most one transcript update per frame.
      const scheduleMessageUpdate = () => {
        if (streamUpdateFrame !== null) return;
        streamUpdateFrame = requestAnimationFrame(() => {
          streamUpdateFrame = null;
          setMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, content: messageContent } : m)
          );
        });
      };
      const flushMessageUpdate = () => {
        if (streamUpdateFrame !== null) {
          cancelAnimationFrame(streamUpdateFrame);
          streamUpdateFrame = null;
        }
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, content: messageContent } : m)
        );
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = accumulated.indexOf('\n')) !== -1) {
          const line = accumulated.slice(0, newlineIndex);
          accumulated = accumulated.slice(newlineIndex + 1);

          if (line.startsWith('data:')) {
            try {
              const dataStr = line.slice(5).trim();
              if (dataStr) {
                const data: StreamEvent = JSON.parse(dataStr);
                const eventType = data.type || (data.text ? 'text_delta' : 'status');

                switch (eventType) {
                  case 'status':
                    if (data.status) {
                      setCurrentStatus(data.status);
                    }
                    break;

                  case 'tool_start':
                    setCurrentStatus(`Inspecting project structure...`);
                    break;

                  case 'tool_result':
                    setCurrentStatus(`Inspected project structure`);
                    break;

                  case 'text_delta':
                    if (data.text) {
                      messageContent += data.text;
                      scheduleMessageUpdate();
                    }
                    break;

                  case 'file_changed':
                    if (data.path && data.content !== undefined) {
                      const changedPath = data.path;
                      const changedContent = data.content;
                      const newFileObj: ProjectFile = { filePath: changedPath, content: changedContent };

                      setFiles(prev => {
                        const existingIdx = prev.findIndex(f => f.filePath === changedPath);
                        if (existingIdx >= 0) {
                          const updated = [...prev];
                          updated[existingIdx] = newFileObj;
                          return updated;
                        }
                        return [...prev, newFileObj];
                      });

                      setActiveFile(newFileObj);

                      if (changedPath.endsWith('.html')) {
                        setShowPreview(true);
                      }
                    }
                    break;

                  case 'message_complete':
                    setCurrentStatus(null);
                    break;

                  case 'error':
                    console.error('Server reported error in stream:', data.error);
                    setCurrentStatus(`Error: ${data.error || 'Failed'}`);
                    if (!messageContent) {
                      messageContent = `Error: ${data.error || 'Operation failed.'}`;
                      setMessages(prev =>
                        prev.map(m => m.id === assistantMsgId ? { ...m, content: messageContent } : m)
                      );
                    }
                    break;
                }
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      // Flush the last partial frame so the final streamed text is never lost.
      flushMessageUpdate();

      // Refresh files list after generation to guarantee persistence state
      try {
        const paths = await getProjectFiles(String(project.id));
        setFiles(prev => {
          const newFiles = [...prev];
          paths.forEach(p => {
            if (!newFiles.find(f => f.filePath === p.path)) {
              newFiles.push({ filePath: p.path, content: '' });
            }
          });
          return newFiles;
        });

        if (paths.length > 0) {
          const targetPath = activeFile?.filePath || paths.find(p => p.path.endsWith('.html'))?.path || paths[0].path;
          if (targetPath) {
            try {
              const content = await getFileContent(String(project.id), targetPath);
              const fullFile: ProjectFile = { filePath: targetPath, content };
              setActiveFile(fullFile);
              setFiles(prev => prev.map(f => f.filePath === targetPath ? fullFile : f));
              if (targetPath.endsWith('.html')) {
                setShowPreview(true);
              }
            } catch (err) {
              console.warn('Failed to load file content after refresh:', err);
            }
          }
        }
      } catch (err) {
        console.warn('Could not refresh project files:', err);
      }

    } catch (e: any) {
      console.error('Streaming error:', e);
      setCurrentStatus(null);
      setMessages(prev =>
        prev.map(m => m.id === assistantMsgId
          ? { ...m, content: m.content || `Failed to generate response: ${e.message || 'Network error'}` }
          : m
        )
      );
    } finally {
      setIsStreaming(false);
      setCurrentStatus(null);
    }
  };

  // Find preview HTML content if present
  const htmlFile = (activeFile && activeFile.filePath.endsWith('.html') && activeFile.content)
    ? activeFile
    : files.find(f => f.filePath.endsWith('.html') && f.content);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans text-text-primary">
      {/* Workspace Header */}
      <header className="h-12 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">{project.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveFile}
            disabled={isSaving || !activeFile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-border text-text-primary text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save File
          </button>
          
          <button 
            onClick={() => setShowPreview(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              showPreview
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-elevated hover:bg-border text-text-primary'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree */}
        <div className="w-60 border-r border-border flex flex-col bg-surface">
          <div className="h-9 border-b border-border flex items-center px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Files
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoadingFiles ? (
              <div className="p-4 text-center text-text-secondary text-sm flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin"/>
              </div>
            ) : (
              <FileTree 
                files={files} 
                activeFilePath={activeFile?.filePath || null} 
                onSelectFile={handleSelectFile} 
              />
            )}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-background">
          {activeFile ? (
            <CodeEditor 
              activeFile={activeFile}
              onChangeContent={(newVal) => {
                if (!activeFile) return;
                setFiles(prev => prev.map(f => f.filePath === activeFile.filePath ? { ...f, content: newVal } : f));
                setActiveFile(prev => prev ? { ...prev, content: newVal } : null);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              Select a file to start editing
            </div>
          )}
        </div>

        {/* Right: AI Assistant */}
        <div className="w-80 border-r border-border flex flex-col bg-surface h-full overflow-hidden">
          <PromptPanel 
            messages={messages}
            isStreaming={isStreaming}
            currentStatus={currentStatus}
            onSendPrompt={handleSendPrompt}
            onResetChat={() => {
              if (!isStreaming) {
                setMessages([]);
                setCurrentStatus(null);
              }
            }}
          />
        </div>

        {/* Far Right: Preview Window */}
        {showPreview && (
          <div className="w-96 flex flex-col bg-background">
            <PreviewWindow
              status={sandboxStatus}
              htmlContent={htmlFile?.content || null}
              previewTitle={htmlFile?.filePath || 'Preview'}
              onDeploy={handleDeployPreview}
              isDeploying={isDeploying}
              onClose={() => setShowPreview(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
