import React, { useState, useEffect, useRef } from 'react';
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
  const activeRequestRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string | null>(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    loadWorkspaceData();
  }, [project.id]);

  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await saveFileContent(String(project.id), activeFile.filePath, activeFile.content);
      setActiveFile(prev => prev?.filePath === activeFile.filePath ? { ...prev, isModified: false } : prev);
      setFiles(prev => prev.map(file => file.filePath === activeFile.filePath ? { ...file, isModified: false } : file));
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

  const handleStopGeneration = () => {
    activeRequestRef.current?.abort();
  };

  const handleSendPrompt = async (promptText: string, isRetry = false) => {
    const normalizedPrompt = promptText.trim();
    if (!normalizedPrompt || requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    activeRequestRef.current = new AbortController();
    if (!isRetry) lastPromptRef.current = normalizedPrompt;

    const userMsg: ChatMessage | null = isRetry ? null : {
      id: crypto.randomUUID(),
      role: 'USER',
      content: normalizedPrompt,
      timestamp: new Date().toISOString(),
    };
    if (userMsg) setMessages(prev => [...prev, userMsg]);

    const assistantMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'ASSISTANT', content: '' }]);
    setIsStreaming(true);
    setCurrentStatus('Connecting…');

    let messageContent = '';
    let accumulated = '';
    let streamUpdateFrame: number | null = null;
    let receivedComplete = false;
    let streamError: string | null = null;
    const fileChanges: NonNullable<ChatMessage['fileChanges']> = [];

    const updateAssistant = (patch: Partial<ChatMessage>) => {
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, ...patch } : m));
    };
    const scheduleMessageUpdate = () => {
      if (streamUpdateFrame !== null) return;
      streamUpdateFrame = requestAnimationFrame(() => {
        streamUpdateFrame = null;
        updateAssistant({ content: messageContent });
      });
    };
    const flushMessageUpdate = () => {
      if (streamUpdateFrame !== null) {
        cancelAnimationFrame(streamUpdateFrame);
        streamUpdateFrame = null;
      }
      updateAssistant({ content: messageContent });
    };
    const processEvent = (data: StreamEvent) => {
      const eventType = data.type || (data.text ? 'text_delta' : 'status');
      switch (eventType) {
        case 'status':
          if (data.status) setCurrentStatus(data.status);
          break;
        case 'tool_start':
          setCurrentStatus(data.tool ? `Running ${data.tool}…` : 'Inspecting project…');
          break;
        case 'tool_result':
          setCurrentStatus(data.success === false ? 'A project operation failed' : 'Project inspected');
          break;
        case 'text_delta':
          if (data.text) {
            messageContent += data.text;
            scheduleMessageUpdate();
          }
          break;
        case 'file_changed': {
          if (!data.path) break;
          const changedPath = data.path;
          const action = data.action || (files.some(f => f.filePath === changedPath) ? 'updated' : 'created');
          const previousContent = files.find(f => f.filePath === changedPath)?.content;
          fileChanges.push({ path: changedPath, action, previousContent, content: data.content });
          if (data.action === 'deleted') {
            setFiles(prev => prev.filter(f => f.filePath !== changedPath));
            setActiveFile(prev => prev?.filePath === changedPath ? null : prev);
          } else if (data.content !== undefined) {
            const newFileObj: ProjectFile = { filePath: changedPath, content: data.content, isModified: false };
            setFiles(prev => {
              const existing = prev.find(f => f.filePath === changedPath);
              if (existing?.isModified) return prev;
              return existing
                ? prev.map(f => f.filePath === changedPath ? newFileObj : f)
                : [...prev, newFileObj];
            });
            setActiveFile(prev => {
              if (!prev || prev.filePath !== changedPath) return prev;
              return prev.isModified ? prev : newFileObj;
            });
            if (changedPath.endsWith('.html')) setShowPreview(true);
          }
          updateAssistant({ fileChanges: [...fileChanges], filesCreated: [...new Set(fileChanges.filter(f => f.action !== 'deleted').map(f => f.path))] });
          break;
        }
        case 'message_complete':
          receivedComplete = true;
          setCurrentStatus(null);
          break;
        case 'error':
          streamError = data.error || 'The server could not complete the request.';
          setCurrentStatus(streamError);
          updateAssistant({ content: messageContent || streamError, error: true });
          break;
      }
    };

    try {
      const token = localStorage.getItem('novabuild_token') || '';
      const response = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: normalizedPrompt, projectId: project.id }),
        signal: activeRequestRef.current.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Your session may have expired. Sign in again, then retry.');
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(detail || `Request failed (HTTP ${response.status}).`);
      }
      if (!response.body) throw new Error('The server returned no readable stream.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = accumulated.indexOf('\n')) !== -1) {
            const line = accumulated.slice(0, newlineIndex).replace(/\r$/, '');
            accumulated = accumulated.slice(newlineIndex + 1);
            if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (!dataStr || dataStr === '[DONE]') continue;
              try {
                processEvent(JSON.parse(dataStr) as StreamEvent);
              } catch (error) {
                if (error instanceof SyntaxError) {
                  console.warn('Ignoring malformed NovaAI stream event.');
                } else {
                  throw error;
                }
              }
            }
          }
        }
        accumulated += decoder.decode();
        if (accumulated.trim().startsWith('data:')) {
          const tail = accumulated.trim().slice(5).trim();
          if (tail && tail !== '[DONE]') {
            try { processEvent(JSON.parse(tail) as StreamEvent); } catch { /* Ignore incomplete trailing event. */ }
          }
        }
      } finally {
        reader.releaseLock();
      }

      flushMessageUpdate();
      if (streamError) {
        updateAssistant({ content: messageContent || streamError, error: true, fileChanges: [...fileChanges] });
      } else if (!receivedComplete) {
        const interruption = 'The connection ended before NovaAI confirmed completion. You can retry this request.';
        updateAssistant({ content: messageContent ? `${messageContent}\n\n_${interruption}_` : interruption, error: true, fileChanges: [...fileChanges] });
      } else {
        updateAssistant({ content: messageContent, error: false, fileChanges: [...fileChanges] });
      }

      // Refresh the tree after generation without replacing the editor's current buffer.
      try {
        const paths = await getProjectFiles(String(project.id));
        setFiles(prev => {
          const next = [...prev];
          paths.forEach(({ path }) => {
            if (!next.some(f => f.filePath === path)) next.push({ filePath: path, content: '' });
          });
          return next.filter(file => paths.some(({ path }) => path === file.filePath));
        });
      } catch (refreshError) {
        console.warn('Could not refresh project file list:', refreshError);
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      const errorMessage = aborted
        ? 'Generation stopped.'
        : error instanceof Error ? error.message : 'Network error while generating a response.';
      updateAssistant({
        content: messageContent ? `${messageContent}\n\n_${errorMessage}_` : errorMessage,
        error: !aborted,
        fileChanges: [...fileChanges],
      });
      if (!aborted) setCurrentStatus(errorMessage);
    } finally {
      flushMessageUpdate();
      activeRequestRef.current = null;
      requestInFlightRef.current = false;
      setIsStreaming(false);
      setCurrentStatus(null);
    }
  };

  const handleRetry = (message: ChatMessage) => {
    const prompt = lastPromptRef.current;
    if (!prompt || requestInFlightRef.current) return;
    setMessages(prev => prev.filter(item => item.id !== message.id));
    void handleSendPrompt(prompt, true);
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
                setFiles(prev => prev.map(f => f.filePath === activeFile.filePath ? { ...f, content: newVal, isModified: true } : f));
                setActiveFile(prev => prev ? { ...prev, content: newVal, isModified: true } : null);
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
            onStopGeneration={handleStopGeneration}
            onRetry={handleRetry}
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
