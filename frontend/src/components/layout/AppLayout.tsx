import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from '../common/PageTransition';
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
  const location = useLocation();
  const outlet = useOutlet();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenModal = (e: any) => {
      if (e.detail?.name) {
        setProjectName(e.detail.name);
      }
      if (e.detail?.description) {
        setProjectDescription(e.detail.description);
      }
      setNewProjectModalOpen(true);
    };

    window.addEventListener('novabuild:create-project', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('novabuild:create-project', handleOpenModal as EventListener);
    };
  }, []);

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
    <div className="relative z-10 flex h-screen w-screen overflow-hidden bg-[#050506]/85 backdrop-blur-[2px] font-sans text-text-primary antialiased">
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

        <main className="relative flex-1 overflow-y-auto custom-scrollbar bg-transparent">
          {/* Subtle cosmic purple ambient glow at the top */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(121,80,232,0.12),transparent_70%)] z-0"
            aria-hidden="true"
          />
          {location.pathname.includes('/workspace') ? (
            <div className="relative z-10 min-h-full">{outlet}</div>
          ) : (
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname} className="relative z-10 min-h-full">
                {outlet}
              </PageTransition>
            </AnimatePresence>
          )}
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
        description="Initialize a new AI-powered code workspace with full orchestration."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {createError && (
            <div className="p-3 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#d4d4dc] mb-1.5">
              Project Name <span className="text-[#a78bfa]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Acme Dashboard, Storefront, Auth Service"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#121217] border border-[#24242d] rounded-xl text-xs text-[#f8f7ff] placeholder:text-[#71717f] focus:outline-none focus:border-[#7950e8] focus:ring-1 focus:ring-[#7950e8]/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d4d4dc] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Describe what you plan to build with AI assistance..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#121217] border border-[#24242d] rounded-xl text-xs text-[#f8f7ff] placeholder:text-[#71717f] focus:outline-none focus:border-[#7950e8] focus:ring-1 focus:ring-[#7950e8]/40 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-[#1f1e26]">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setNewProjectModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-white rounded-xl border border-[#24242d] hover:bg-[#181624] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !projectName.trim()}
              className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white rounded-xl flex items-center gap-2 shadow-[0_2px_12px_rgba(109,40,217,0.35)] hover:shadow-[0_4px_18px_rgba(109,40,217,0.55)] transition-all disabled:opacity-50"
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
