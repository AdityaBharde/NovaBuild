import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Modal } from '../common/Modal';
import { User, Project, Subscription } from '../../types';
import { createProject } from '../../api/client';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  user: User;
  subscription: Subscription | null;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onProjectCreated: (p: Project) => void;
  onLogout: () => void;
  onRefreshData?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  subscription,
  projects,
  activeProject,
  onSelectProject,
  onProjectCreated,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const newProj = await createProject(projectName.trim(), projectDescription.trim());
      onProjectCreated(newProj);
      setNewProjectModalOpen(false);
      setProjectName('');
      setProjectDescription('');
      navigate(`/workspace/${newProj.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-text-primary antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        user={user}
        subscription={subscription}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProjectId={activeProject?.id}
      />

      {/* Main App Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={user}
          subscription={subscription}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={onSelectProject}
          onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <Outlet />
        </main>
      </div>

      {/* Global New Project Modal */}
      <Modal
        isOpen={newProjectModalOpen}
        onClose={() => {
          if (!isCreating) {
            setNewProjectModalOpen(false);
            setCreateError(null);
          }
        }}
        title="Create New Project"
        description="Initialize a new AI-powered code workspace."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {createError && (
            <div className="p-3 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Acme Dashboard, Storefront, Auth Service"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Describe what you plan to build..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setNewProjectModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !projectName.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create & Launch Workspace
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
