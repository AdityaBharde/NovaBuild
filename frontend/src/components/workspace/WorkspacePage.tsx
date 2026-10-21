import React, { useState, useEffect, useRef } from 'react';
import './WorkspacePage.css';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Project,
  ProjectFile,
  ChatMessage,
  SandboxStatus,
  StreamEvent,
  ExecutionStep,
} from '../../types';
import {
  getProjectById,
  getProjectFiles,
  getFileContent,
  saveFileContent,
  deleteFile,
  deploySandbox,
  getSandboxStatus,
  getChatHistory,
  CHAT_STREAM_URL,
} from '../../api/client';
import { CodeEditor } from '../CodeEditor';
import { PromptPanel } from '../PromptPanel';
import { PreviewWindow } from '../PreviewWindow';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import {
  ChevronLeft,
  Play,
  Loader2,
  Save,
  Monitor,
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  FileCode,
  FileJson,
  FileText,
  Trash2,
  X,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface WorkspacePageProps {
  onBack?: () => void;
  onProjectLoaded?: (p: Project) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  onBack,
  onProjectLoaded,
}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [openTabs, setOpenTabs] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Layout view controls
  const [showFileTree, setShowFileTree] = useState(() => window.innerWidth > 860);
  const [showChat, setShowChat] = useState(() => window.innerWidth > 860);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(248);
  const [chatPanelWidth, setChatPanelWidth] = useState(360);
  const resizeTarget = useRef<'files' | 'chat' | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!resizeTarget.current) return;
      if (resizeTarget.current === 'files') {
        setLeftPanelWidth(Math.min(360, Math.max(190, event.clientX - (document.querySelector('.novabuild-workspace')?.getBoundingClientRect().left || 0))));
      } else {
        setChatPanelWidth(Math.min(520, Math.max(300, window.innerWidth - event.clientX)));
      }
    };
    const stopResize = () => { resizeTarget.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopResize);
      stopResize();
    };
  }, []);

  const beginResize = (target: 'files' | 'chat') => (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeTarget.current = target;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // File tree filter & create
  const [fileFilter, setFileFilter] = useState('');
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const chatAbortController = useRef<AbortController | null>(null);

  const activeProjectId = routeProjectId || (project ? String(project.id) : '');

  useEffect(() => {
    if (activeProjectId) {
      loadWorkspace(activeProjectId);
    }
  }, [activeProjectId]);

  // Keyboard shortcut for saving Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCurrentFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, activeProjectId]);

  const loadWorkspace = async (projId: string) => {
    setIsLoadingWorkspace(true);
    try {
      // 1. Fetch project meta
      const p = await getProjectById(projId);
      if (p) {
        setProject(p);
        if (onProjectLoaded) onProjectLoaded(p);
      } else {
        // Fallback meta
        setProject({ id: projId, name: `Project ${projId}`, userId: '1' });
      }

      // 2. Fetch project files
      const paths = await getProjectFiles(projId);
      const initialFiles = paths.map((f) => ({ filePath: f.path, content: '' }));
      setFiles(initialFiles);

      if (initialFiles.length > 0) {
        const target =
          initialFiles.find((f) => f.filePath === 'index.html' || f.filePath.endsWith('.html')) ||
          initialFiles.find((f) => f.filePath.includes('App.tsx') || f.filePath.includes('main.tsx')) ||
          initialFiles[0];

        try {
          const content = await getFileContent(projId, target.filePath);
          const fullFile = { ...target, content };
          setFiles((prev) =>
            prev.map((f) => (f.filePath === target.filePath ? fullFile : f))
          );
          setActiveFile(fullFile);
          setOpenTabs([fullFile]);
          if (target.filePath.endsWith('.html')) {
            setShowPreview(true);
          }
        } catch (e) {
          console.warn('Failed to preload file content:', e);
          setActiveFile(target);
          setOpenTabs([target]);
        }
      }

      // 3. Sandbox status
      const status = await getSandboxStatus(projId);
      setSandboxStatus(status);
      if (status && status.status === 'RUNNING') {
        setShowPreview(true);
      }

      // 4. Chat history
      const history = await getChatHistory(projId);
      if (history && Array.isArray(history)) {
        setMessages(
          history.map((h: any, index: number) => ({
            id: String(h.id ?? `history-${projId}-${index}`),
            role: h.role || 'USER',
            content: h.text || h.content || '',
            ...(Array.isArray(h.steps) ? { steps: h.steps } : {}),
            ...(Array.isArray(h.fileChanges) ? { fileChanges: h.fileChanges } : {}),
            ...(Array.isArray(h.filesCreated) ? { filesCreated: h.filesCreated } : {}),
          }))
        );
      }
    } catch (e) {
      console.error('Error loading workspace:', e);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleSelectFile = async (file: ProjectFile) => {
    // Add to open tabs if not present
    if (!openTabs.find((t) => t.filePath === file.filePath)) {
      setOpenTabs((prev) => [...prev, file]);
    }

    if (!file.content) {
      try {
        const content = await getFileContent(activeProjectId, file.filePath);
        const updated = { ...file, content };
        setFiles((prev) =>
          prev.map((f) => (f.filePath === file.filePath ? updated : f))
        );
        setOpenTabs((prev) =>
          prev.map((t) => (t.filePath === file.filePath ? updated : t))
        );
        setActiveFile(updated);
      } catch (e) {
        console.error('Failed to fetch file content', e);
        setActiveFile(file);
      }
    } else {
      setActiveFile(file);
    }
  };

  const handleCloseTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t.filePath !== filePath);
    setOpenTabs(remaining);

    if (activeFile?.filePath === filePath) {
      if (remaining.length > 0) {
        setActiveFile(remaining[remaining.length - 1]);
      } else {
        setActiveFile(null);
      }
    }
  };

  const handleEditorChange = (newContent: string) => {
    if (!activeFile) return;
    const updated = { ...activeFile, content: newContent, isModified: true };
    setActiveFile(updated);
    setHasUnsavedChanges(true);
    setFiles((prev) =>
      prev.map((f) => (f.filePath === activeFile.filePath ? updated : f))
    );
    setOpenTabs((prev) =>
      prev.map((t) => (t.filePath === activeFile.filePath ? updated : t))
    );
  };

  const handleSaveCurrentFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await saveFileContent(activeProjectId, activeFile.filePath, activeFile.content);
      const saved = { ...activeFile, isModified: false };
      setActiveFile(saved);
      setHasUnsavedChanges(false);
      setFiles((prev) =>
        prev.map((f) => (f.filePath === activeFile.filePath ? saved : f))
      );
      setOpenTabs((prev) =>
        prev.map((t) => (t.filePath === activeFile.filePath ? saved : t))
      );
    } catch (e) {
      alert('Failed to save file content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    const path = newFilePath.trim().replace(/^\/+/, '');
    try {
      await saveFileContent(activeProjectId, path, '');
      const newFileObj = { filePath: path, content: '' };
      setFiles((prev) => [...prev, newFileObj]);
      setOpenTabs((prev) => [...prev, newFileObj]);
      setActiveFile(newFileObj);
      setNewFileModalOpen(false);
      setNewFilePath('');
    } catch (e) {
      alert('Failed to create file');
    }
  };

  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete || isDeletingFile) return;

    setIsDeletingFile(true);
    try {
      await deleteFile(activeProjectId, fileToDelete);
      setFiles((prev) => prev.filter((f) => f.filePath !== fileToDelete));
      setOpenTabs((prev) => prev.filter((t) => t.filePath !== fileToDelete));
      if (activeFile?.filePath === fileToDelete) {
        setActiveFile(null);
      }
      setFileToDelete(null);
    } catch (e) {
      alert('Failed to delete file');
    } finally {
      setIsDeletingFile(false);
    }
  };

  const handleDeployPreview = async () => {
    setIsDeploying(true);
    try {
      const status = await deploySandbox(activeProjectId);
      setSandboxStatus(status);
      setShowPreview(true);
    } catch (e) {
      console.error('Deploy failed', e);
    } finally {
      setIsDeploying(false);
    }
  };

  // Real AI streaming with incremental protocol parsing
  const handleSendPrompt = async (promptText: string) => {
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'USER',
      content: promptText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setCurrentStatus('Planning next steps...');

    const assistantMsgId = String(Date.now() + 1);
    const executionSteps: ExecutionStep[] = [];
    const createdFilesSet = new Set<string>();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'ASSISTANT',
        content: '',
        steps: executionSteps,
        filesCreated: [],
      },
    ]);

    try {
      const token = localStorage.getItem('novabuild_token') || '';
      const controller = new AbortController();
      chatAbortController.current = controller;
      const response = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: promptText, projectId: activeProjectId }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(detail || `AI request failed (${response.status})`);
      }
      if (!response.body) throw new Error('No readable stream received from server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let messageContent = '';

      const updateAssistantMessage = () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: messageContent,
                  steps: [...executionSteps],
                  filesCreated: Array.from(createdFilesSet),
                  ...(executionSteps.some((step) => step.status === 'error') ? { error: true } : {}),
                }
              : m
          )
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
                      const s = data.status;
                      setCurrentStatus(s);

                      if (s.toLowerCase().startsWith('planning:')) {
                        const existingPlan = executionSteps.find((x) => x.type === 'planning');
                        const detailText = s.replace(/^planning:\s*/i, '');
                        if (existingPlan) {
                          existingPlan.detail = detailText;
                          existingPlan.status = 'completed';
                        } else {
                          executionSteps.push({
                            id: 'plan-' + Date.now(),
                            type: 'planning',
                            title: 'Planning Architecture',
                            detail: detailText,
                            status: 'completed',
                            timestamp: Date.now(),
                          });
                        }
                      } else if (s.toLowerCase().startsWith('generating ')) {
                        const genPath = s.replace(/^generating\s*/i, '').replace(/\.\.\.*$/, '').trim();
                        // Mark file generating in sidebar immediately
                        setFiles((prev) => {
                          const idx = prev.findIndex((f) => f.filePath === genPath);
                          if (idx >= 0) {
                            const clone = [...prev];
                            clone[idx] = { ...clone[idx], isGenerating: true };
                            return clone;
                          }
                          return [...prev, { filePath: genPath, content: '', isGenerating: true }];
                        });

                        const existingFileStep = executionSteps.find((x) => x.id === 'gen-' + genPath);
                        if (!existingFileStep) {
                          executionSteps.push({
                            id: 'gen-' + genPath,
                            type: 'file',
                            title: `Generating ${genPath}...`,
                            status: 'running',
                            timestamp: Date.now(),
                          });
                        }
                      } else if (s.toLowerCase().startsWith('saving ')) {
                        const savePath = s.replace(/^saving\s*/i, '').replace(/\.\.\.*$/, '').trim();
                        const existingStep = executionSteps.find((x) => x.id === 'gen-' + savePath);
                        if (existingStep) {
                          existingStep.title = `Saving ${savePath}...`;
                        }
                      } else if (s.toLowerCase().startsWith('saved ')) {
                        const savedPath = s.replace(/^saved\s*/i, '').trim();
                        const existingStep = executionSteps.find((x) => x.id === 'gen-' + savedPath);
                        if (existingStep) {
                          existingStep.title = `Saved ${savedPath}`;
                          existingStep.status = 'completed';
                        }
                      } else {
                        // Add status activity step if meaningful
                        if (!executionSteps.some((x) => x.title === s)) {
                          executionSteps.push({
                            id: 'status-' + Date.now(),
                            type: 'status',
                            title: s,
                            status: 'completed',
                            timestamp: Date.now(),
                          });
                        }
                      }
                      updateAssistantMessage();
                    }
                    break;

                  case 'tool_start':
                    if (data.tool) {
                      const toolName = data.tool;
                      const toolLabel = toolName.toLowerCase();
                      let friendlyTitle = 'Running a project tool';
                      if (toolLabel.includes('structure') || toolLabel.includes('tree')) {
                        friendlyTitle = 'Analyzing project structure & files';
                      } else if (toolLabel.includes('read')) {
                        friendlyTitle = 'Reading project context';
                      } else if (toolLabel.includes('save') || toolLabel.includes('create')) {
                        friendlyTitle = 'Updating project files';
                      }

                      setCurrentStatus(friendlyTitle);
                      executionSteps.push({
                        id: `tool-${toolName}-${Date.now()}`,
                        type: 'tool',
                        title: friendlyTitle,
                        detail: 'Tool arguments are hidden because they may contain project data or secrets.',
                        status: 'running',
                        timestamp: Date.now(),
                      });
                      updateAssistantMessage();
                    }
                    break;

                  case 'tool_result':
                    if (data.tool) {
                      const runningTool = executionSteps
                        .filter((x) => x.type === 'tool' && x.status === 'running')
                        .pop();
                      if (runningTool) {
                        runningTool.status = 'completed';
                      }
                      setCurrentStatus('Finished tool execution');
                      updateAssistantMessage();
                    }
                    break;

                  case 'text_delta':
                    if (data.text) {
                      messageContent += data.text;
                      updateAssistantMessage();
                    }
                    break;

                  case 'file_changed':
                    if (data.path && data.content !== undefined) {
                      const changedPath = data.path;
                      const changedContent = data.content;
                      createdFilesSet.add(changedPath);

                      const newFileObj: ProjectFile = {
                        filePath: changedPath,
                        content: changedContent,
                        isGenerating: false,
                      };

                      setFiles((prev) => {
                        const existingIdx = prev.findIndex((f) => f.filePath === changedPath);
                        if (existingIdx >= 0) {
                          const updated = [...prev];
                          updated[existingIdx] = newFileObj;
                          return updated;
                        }
                        return [...prev, newFileObj];
                      });

                      setActiveFile(newFileObj);

                      // Ensure tab is open
                      setOpenTabs((prev) => {
                        if (!prev.find((t) => t.filePath === changedPath)) {
                          return [...prev, newFileObj];
                        }
                        return prev.map((t) => (t.filePath === changedPath ? newFileObj : t));
                      });

                      // Mark file step completed
                      const fStep = executionSteps.find((x) => x.id === 'gen-' + changedPath);
                      if (fStep) {
                        fStep.title = `Created ${changedPath}`;
                        fStep.status = 'completed';
                      } else {
                        executionSteps.push({
                          id: 'gen-' + changedPath,
                          type: 'file',
                          title: `Created ${changedPath}`,
                          status: 'completed',
                          timestamp: Date.now(),
                        });
                      }

                      if (changedPath.endsWith('.html')) {
                        setShowPreview(true);
                      }
                      updateAssistantMessage();
                    }
                    break;

                  case 'message_complete':
                    executionSteps.forEach((s) => {
                      if (s.status === 'running') s.status = 'completed';
                    });
                    setFiles((prev) => prev.map((f) => ({ ...f, isGenerating: false })));
                    setCurrentStatus(null);
                    updateAssistantMessage();
                    break;

                  case 'error':
                    const errMsg = data.error || 'Failed';
                    setCurrentStatus(`Error: ${errMsg}`);
                    const activeStep = executionSteps.filter((x) => x.status === 'running').pop();
                    if (activeStep) {
                      activeStep.status = 'error';
                      activeStep.detail = errMsg;
                    }
                    updateAssistantMessage();
                    break;
                }
              }
            } catch (e) {
              // Ignore partial chunk parsing
            }
          }
        }
      }

      // Refresh files after generation
      try {
        const paths = await getProjectFiles(activeProjectId);
        setFiles((prev) => {
          const updated = [...prev];
          paths.forEach((p) => {
            if (!updated.find((f) => f.filePath === p.path)) {
              updated.push({ filePath: p.path, content: '' });
            }
          });
          return updated;
        });
      } catch (err) {
        console.warn('Could not refresh files after generation:', err);
      }
    } catch (e: any) {
      const wasAborted = e?.name === 'AbortError';
      if (!wasAborted) console.error('Streaming error:', e);
      setCurrentStatus(null);
      setFiles((prev) => prev.map((f) => ({ ...f, isGenerating: false })));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: m.content || (wasAborted ? 'Generation stopped.' : `Failed to generate response: ${e.message || 'Network error'}`),
                ...(wasAborted ? {} : { error: true }),
              }
            : m
        )
      );
    } finally {
      chatAbortController.current = null;
      setIsStreaming(false);
      setCurrentStatus(null);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.filePath.toLowerCase().includes(fileFilter.toLowerCase())
  );

  const htmlFile =
    activeFile && activeFile.filePath.endsWith('.html') && activeFile.content
      ? activeFile
      : files.find((f) => f.filePath.endsWith('.html') && f.content);

  const getFileIcon = (filePath: string) => {
    if (
      filePath.endsWith('.tsx') ||
      filePath.endsWith('.ts') ||
      filePath.endsWith('.jsx') ||
      filePath.endsWith('.js')
    ) {
      return <FileCode className="w-3.5 h-3.5 text-accent shrink-0" />;
    }
    if (filePath.endsWith('.json')) {
      return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-text-secondary shrink-0" />;
  };

  return (
    <div className="novabuild-workspace flex flex-col h-full w-full bg-background font-sans text-text-primary overflow-hidden">
      {/* Workspace Action Bar */}
      <div className="h-11 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 text-xs">
        {/* Left: Project & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary p-1 rounded hover:bg-surface-elevated transition-colors"
            title="Back to Projects"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 font-semibold text-text-primary truncate max-w-[200px]">
            <FolderGit2 className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">{project?.name || 'Workspace'}</span>
          </div>
          <Badge variant="outline" size="sm">
            {files.length} files
          </Badge>
        </div>

        {/* Center: Save Status */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSaveCurrentFile}
            disabled={!activeFile || isSaving}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-elevated border border-border hover:bg-surface text-text-primary transition-colors disabled:opacity-40"
            title="Save File (Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin text-accent" />
            ) : (
              <Save className="w-3 h-3 text-accent" />
            )}
            <span>Save</span>
          </button>
        </div>

        {/* Right: Layout & Preview Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showPreview
                ? 'bg-accent/15 border-accent text-accent'
                : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            disabled={isDeploying}
            onClick={handleDeployPreview}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
            title="Deploy Live Sandbox Pod"
          >
            {isDeploying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>Run Sandbox</span>
          </button>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Panel toggles */}
          <button
            onClick={() => {
              if (window.innerWidth <= 860 && !showFileTree) setShowChat(false);
              setShowFileTree(!showFileTree);
            }}
            className={`p-1 rounded transition-colors ${
              showFileTree
                ? 'text-accent bg-surface-elevated'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title={showFileTree ? 'Hide File Explorer' : 'Show File Explorer'}
          >
            {showFileTree ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => {
              if (window.innerWidth <= 860 && !showChat) setShowFileTree(false);
              setShowChat(!showChat);
            }}
            className={`p-1 rounded transition-colors ${
              showChat
                ? 'text-accent bg-surface-elevated'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title={showChat ? 'Hide AI Agent' : 'Show AI Agent'}
          >
            {showChat ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3-Panel Content Area */}
      <div className="workspace-panels flex-1 flex min-h-0 h-full overflow-hidden">
        {/* PANEL 1: File Explorer */}
        {showFileTree && (
          <aside className="workspace-files-panel border-r border-border bg-surface flex flex-col shrink-0 h-full overflow-hidden" style={{ width: leftPanelWidth }}>
            <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between text-xs font-semibold text-text-secondary">
              <span className="uppercase tracking-wider text-[10px]">Files</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNewFileModalOpen(true)}
                  className="p-1 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                  title="New File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => loadWorkspace(activeProjectId)}
                  className="p-1 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                  title="Refresh Files"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="p-2 border-b border-border/50">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-surface-elevated border border-border/60 rounded text-[11px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto py-1 custom-scrollbar text-xs">
              {filteredFiles.length === 0 ? (
                <div className="p-4 text-center text-text-secondary text-xs">
                  {fileFilter ? 'No files match' : 'No files generated yet'}
                </div>
              ) : (
                filteredFiles.map((f) => {
                  const isActive = activeFile?.filePath === f.filePath;
                  return (
                    <div
                      key={f.filePath}
                      onClick={() => handleSelectFile(f)}
                      className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-accent/15 text-accent font-medium border-l-2 border-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getFileIcon(f.filePath)}
                        <span className="truncate">{f.filePath}</span>
                        {f.isGenerating && (
                          <span className="flex items-center gap-1 text-[10px] text-accent animate-pulse font-normal">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            Writing...
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileToDelete(f.filePath);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/10 text-text-secondary hover:text-rose-400 transition-opacity"
                        title="Delete file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {showFileTree && <div className="workspace-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize file explorer" onMouseDown={beginResize('files')} />}

        {/* PANEL 2: Central Code Editor & Tabs */}
        <div className="workspace-editor-panel flex-1 flex flex-col min-w-0 h-full bg-background relative overflow-hidden">
          {/* Tabs Bar */}
          <div className="h-9 border-b border-border bg-surface flex items-center px-1 overflow-x-auto custom-scrollbar shrink-0">
            {openTabs.map((tab) => {
              const isActive = activeFile?.filePath === tab.filePath;
              return (
                <div
                  key={tab.filePath}
                  onClick={() => handleSelectFile(tab)}
                  className={`flex items-center gap-2 px-3 py-1 h-full border-r border-border text-xs cursor-pointer select-none transition-colors ${
                    isActive
                      ? 'bg-background text-text-primary font-medium border-t-2 border-t-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  {getFileIcon(tab.filePath)}
                  <span className="truncate max-w-[140px]">
                    {tab.filePath.split('/').pop()}
                  </span>
                  {tab.isModified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                  <button
                    onClick={(e) => handleCloseTab(tab.filePath, e)}
                    className="p-0.5 rounded hover:bg-surface-elevated text-text-secondary hover:text-text-primary ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Editor & Split Preview Container */}
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 flex flex-col h-full ${showPreview && !previewFullscreen ? 'w-1/2' : 'w-full'}`}>
              <CodeEditor
                activeFile={activeFile}
                onChangeContent={handleEditorChange}
              />
            </div>

            {/* Split Live Preview Window */}
            {showPreview && (
              <div
                className={`border-l border-border bg-surface flex flex-col transition-all ${
                  previewFullscreen
                    ? 'absolute inset-0 z-30'
                    : 'w-1/2 h-full'
                }`}
              >
                <div className="h-9 px-3 border-b border-border bg-surface-elevated flex items-center justify-between text-xs text-text-secondary shrink-0">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-accent" />
                    <span className="font-semibold text-text-primary">Live Preview</span>
                    {sandboxStatus?.previewUrl && (
                      <span className="text-[10px] text-[#c4b5fd] font-medium">
                        Sandbox Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewFullscreen(!previewFullscreen)}
                      className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                      title={previewFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {previewFullscreen ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                      title="Close Preview"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-white overflow-hidden">
                  <PreviewWindow
                    status={sandboxStatus}
                    htmlContent={htmlFile?.content}
                    previewTitle={project?.name}
                    onDeploy={handleDeployPreview}
                    isDeploying={isDeploying}
                    onClose={() => setShowPreview(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {showChat && <div className="workspace-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize AI chat" onMouseDown={beginResize('chat')} />}

        {/* PANEL 3: AI Agent Chat */}
        {showChat && (
          <aside className="workspace-chat-panel border-l border-border bg-surface flex flex-col shrink-0 h-full overflow-hidden" style={{ width: chatPanelWidth }}>
            <PromptPanel
              messages={messages}
              isStreaming={isStreaming}
              currentStatus={currentStatus}
              onSendPrompt={handleSendPrompt}
              onStopGeneration={() => chatAbortController.current?.abort()}
              onRetry={(message) => {
                const messageIndex = messages.findIndex((item) => item.id === message.id);
                const previousMessage = messageIndex > 0 ? messages[messageIndex - 1] : undefined;
                if (previousMessage?.role === 'USER' && !isStreaming) {
                  setMessages((current) => current.filter((item) => item.id !== message.id));
                  void handleSendPrompt(previousMessage.content);
                }
              }}
              onResetChat={() => {
                if (!isStreaming) {
                  setMessages([]);
                  setCurrentStatus(null);
                }
              }}
              onSelectFile={(path) => {
                const target = files.find((f) => f.filePath === path);
                if (target) {
                  handleSelectFile(target);
                }
              }}
            />
          </aside>
        )}
      </div>

      {/* New File Modal */}
      <Modal
        isOpen={newFileModalOpen}
        onClose={() => setNewFileModalOpen(false)}
        title="Create New File"
      >
        <form onSubmit={handleCreateNewFile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              File Path
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. src/components/Hero.tsx or styles.css"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={() => setNewFileModalOpen(false)}
              className="px-3.5 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newFilePath.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg disabled:opacity-50"
            >
              Create File
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete File Confirmation */}
      <ConfirmDialog
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteFileConfirm}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete}"? This file will be removed from MinIO storage and workspace tree.`}
        confirmText="Delete File"
        isDestructive={true}
        isLoading={isDeletingFile}
      />
    </div>
  );
};
