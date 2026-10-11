import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  ChevronDown,
  User as UserIcon,
  CreditCard,
  Settings,
  LogOut,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import { User, Project, Subscription } from '../../types';

interface HeaderProps {
  user: User;
  subscription: Subscription | null;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenNewProjectModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  subscription,
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProjectModal,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const projectSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (projectSwitcherRef.current && !projectSwitcherRef.current.contains(e.target as Node)) {
        setProjectSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return ['Overview'];
    if (path.startsWith('/projects')) return ['Projects'];
    if (path.startsWith('/workspace')) {
      return ['Workspace', activeProject ? activeProject.name : 'Editor'];
    }
    if (path.startsWith('/billing')) return ['Billing & Plans'];
    if (path.startsWith('/usage')) return ['Usage & Quotas'];
    if (path.startsWith('/settings')) return ['Settings'];
    return ['NovaBuild'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 z-20 shrink-0">
      {/* Left: Breadcrumbs & Project Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-text-secondary/50">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'font-medium text-text-primary'
                    : 'hover:text-text-primary cursor-pointer'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Project Switcher (Quick Access) */}
        {projects.length > 0 && (
          <div className="relative ml-2" ref={projectSwitcherRef}>
            <button
              onClick={() => setProjectSwitcherOpen(!projectSwitcherOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border/80 hover:border-border text-xs text-text-primary transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-accent" />
              <span className="max-w-[120px] truncate">
                {activeProject ? activeProject.name : 'Switch Project'}
              </span>
              <ChevronDown className="w-3 h-3 text-text-secondary ml-0.5" />
            </button>

            {projectSwitcherOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-surface-elevated border border-border rounded-lg shadow-2xl py-1 text-xs text-text-primary z-50 animate-slide-up">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-text-secondary border-b border-border/50">
                  Your Projects ({projects.length})
                </div>
                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p);
                        navigate(`/workspace/${p.id}`);
                        setProjectSwitcherOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-surface flex items-center justify-between transition-colors ${
                        activeProject?.id === p.id ? 'bg-accent/10 text-accent font-medium' : ''
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {activeProject?.id === p.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1 border-t border-border/50 px-2 mt-1">
                  <button
                    onClick={() => {
                      setProjectSwitcherOpen(false);
                      onOpenNewProjectModal();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-accent hover:bg-surface flex items-center gap-1.5 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-3">
        {/* Create Project CTA Button */}
        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>

        {/* User Account Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-surface-elevated transition-colors border border-transparent hover:border-border"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-surface-elevated border border-border rounded-xl shadow-2xl py-1 text-xs text-text-primary z-50 animate-slide-up">
              <div className="px-3.5 py-2.5 border-b border-border/60">
                <p className="font-semibold text-text-primary truncate">{user.name}</p>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                  <span>{subscription?.plan?.name || 'Free Tier'}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile & Account</span>
                </Link>
                <Link
                  to="/billing"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Subscription & Billing</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
                >
                  <Settings className="w-4 h-4" />
                  <span>Workspace Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-border/60">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
