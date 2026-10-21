import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from '../common/PageTransition';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Modal } from '../common/Modal';
import { User, Project, Subscription } from '../../types';
import { createProject } from '../../api/client';
import { Loader2, Home, FolderGit2, Code2, Settings } from 'lucide-react';

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

  const mobileNavItems = [
    { label: 'Home', to: '/dashboard/home', icon: Home, exact: false },
    { label: 'Projects', to: '/projects', icon: FolderGit2, exact: false },
    ...(activeProject ? [{ label: 'Workspace', to: `/workspace/${activeProject.id}`, icon: Code2, exact: false }] : []),
    { label: 'Settings', to: '/settings', icon: Settings, exact: false },
  ];

  return (
    <div className="app-shell relative z-10 flex h-screen w-screen overflow-hidden bg-[var(--bg-app)]/90 backdrop-blur-[2px] font-sans text-text-primary antialiased transition-colors duration-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        user={user}
        subscription={subscription}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProjectId={activeProject?.id}
        onLogout={onLogout}
      />

      {/* Main App Container */}
      <div className="app-main-column flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={user}
          subscription={subscription}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={onSelectProject}
          onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
          onLogout={onLogout}
        />

        <main className={`app-main relative flex-1 min-h-0 bg-transparent ${location.pathname.includes('/workspace') ? 'app-main-workspace overflow-hidden flex flex-col h-full' : 'app-main-scroll overflow-y-auto custom-scrollbar'}`}>
          {location.pathname.includes('/workspace') ? (
            <div className="relative z-10 h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden">{outlet}</div>
          ) : (
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname} className="relative z-10 min-h-full">
                {outlet}
              </PageTransition>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Compact mobile navigation; desktop keeps the persistent sidebar. */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileNavItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'is-active' : ''}`}
            aria-label={label}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

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
              className="px-4 py-2 text-xs font-semibold bg-[#7950e8] hover:bg-[#8965f0] text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
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
