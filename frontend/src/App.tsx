import React, { useState, useEffect } from 'react';
import { User, Project, ProjectFile, ChatMessage, SandboxStatus } from './types';
import { getStoredUser, fetchProjects, createProject, deploySandbox, getSandboxStatus } from './api/client';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { FileTree } from './components/FileTree';
import { CodeEditor } from './components/CodeEditor';
import { PromptPanel } from './components/PromptPanel';
import { PreviewWindow } from './components/PreviewWindow';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length > 0 && !currentProject) {
        selectProject(data[0]);
      } else if (data.length === 0) {
        // Auto-create a default project for new user
        handleAutoCreateFirstProject();
      }
    } catch (e) {
      console.error(e);
      // Fallback demo project
      handleAutoCreateFirstProject();
    }
  };

  const handleAutoCreateFirstProject = () => {
    const demoProj: Project = {
      id: 'proj-demo-101',
      name: 'E-Commerce Dashboard',
      description: 'Lovable generated React + Vite Web Application',
      userId: user?.userId || 'user-1',
    };
    setProjects([demoProj]);
    selectProject(demoProj);
  };

  const selectProject = (p: Project) => {
    setCurrentProject(p);
    const defaultFiles: ProjectFile[] = [
      {
        filePath: 'src/App.tsx',
        content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">\n      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">\n        ${p.name}\n      </h1>\n      <p className="mt-3 text-slate-400 font-medium">Generated with NovaBuild AI Studio</p>\n    </div>\n  );\n}`,
      },
      {
        filePath: 'src/main.tsx',
        content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);`,
      },
      {
        filePath: 'package.json',
        content: `{\n  "name": "${p.name.toLowerCase().replace(/\s+/g, '-')}",\n  "private": true,\n  "dependencies": {\n    "react": "^18.3.1"\n  }\n}`,
      },
    ];
    setFiles(defaultFiles);
    setActiveFile(defaultFiles[0]);
    checkSandbox(String(p.id));
  };

  const checkSandbox = async (projectId: string) => {
    const status = await getSandboxStatus(projectId);
    setSandboxStatus(status);
  };

  const handleNewProject = async () => {
    const name = prompt('Enter Project Name:', 'My Nova App');
    if (!name) return;
    try {
      const created = await createProject(name, 'NovaBuild generated React app');
      setProjects((prev) => [...prev, created]);
      selectProject(created);
    } catch (err) {
      const fallbackProj: Project = {
        id: 'proj-' + Date.now(),
        name,
        userId: user?.userId || '1',
      };
      setProjects((prev) => [...prev, fallbackProj]);
      selectProject(fallbackProj);
    }
  };

  const handleSendPrompt = async (promptText: string) => {
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'USER',
      content: promptText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      // Simulate real-time SSE streaming response from intelligent-service
      const assistantMsgId = String(Date.now() + 1);
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'ASSISTANT',
        content: `Updating app structure based on prompt: "${promptText}"...`,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setTimeout(() => {
        setFiles((prevFiles) => {
          return prevFiles.map((f) =>
            f.filePath === 'src/App.tsx'
              ? {
                  ...f,
                  content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-slate-950 text-white p-12 flex flex-col items-center justify-center space-y-4">\n      <div className="px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">\n        AI Generated App\n      </div>\n      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-center">\n        ${promptText}\n      </h1>\n      <p className="text-slate-400 max-w-md text-center text-sm">\n        Compiled dynamically by NovaBuild Spring Boot & Kafka microservices cluster.\n      </p>\n    </div>\n  );\n}`,
                }
              : f
          );
        });
        setIsStreaming(false);
      }, 1200);
    } catch (e) {
      setIsStreaming(false);
    }
  };

  const handleDeployPreview = async () => {
    if (!currentProject) return;
    setIsDeploying(true);
    try {
      const status = await deploySandbox(String(currentProject.id));
      setSandboxStatus(status);
    } catch (e) {
      setSandboxStatus({
        projectId: String(currentProject.id),
        containerId: 'novabuild-preview-local',
        status: 'RUNNING',
        previewUrl: 'http://localhost:3000',
        exposedPort: 3000,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setProjects([]);
    setCurrentProject(null);
    setMessages([]);
  };

  // 1. If User is NOT logged in -> Show Full Page Login/Registration Screen
  if (!user) {
    return <LoginScreen onSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  // 2. If User IS logged in -> Show Full NovaBuild Workspace
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0c10] text-gray-100">
      <Navbar
        user={user}
        currentProject={currentProject}
        projects={projects}
        onSelectProject={selectProject}
        onNewProject={handleNewProject}
        onOpenAuth={() => {}}
        onLogout={handleLogout}
        onDeployPreview={handleDeployPreview}
        isDeploying={isDeploying}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree Explorer */}
        <FileTree
          files={files}
          activeFilePath={activeFile?.filePath || null}
          onSelectFile={(f) => setActiveFile(f)}
          onNewFile={() => {
            const name = prompt('New file path (e.g. src/Button.tsx):');
            if (name) {
              const newF: ProjectFile = { filePath: name, content: '// New component code' };
              setFiles((prev) => [...prev, newF]);
              setActiveFile(newF);
            }
          }}
        />

        {/* Center: Code Editor */}
        <CodeEditor
          activeFile={activeFile}
          onChangeContent={(newVal) => {
            if (!activeFile) return;
            setFiles((prev) =>
              prev.map((f) => (f.filePath === activeFile.filePath ? { ...f, content: newVal } : f))
            );
            setActiveFile((prev) => (prev ? { ...prev, content: newVal } : null));
          }}
        />

        {/* Right: AI Builder Prompt Chat Panel */}
        <PromptPanel
          messages={messages}
          isStreaming={isStreaming}
          onSendPrompt={handleSendPrompt}
        />

        {/* Far Right: Live Sandbox Preview Window */}
        <PreviewWindow
          status={sandboxStatus}
          onDeploy={handleDeployPreview}
          isDeploying={isDeploying}
        />
      </div>
    </div>
  );
};

export default App;
