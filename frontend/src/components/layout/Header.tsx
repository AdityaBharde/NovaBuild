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
    if (path === '/' || path.startsWith('/dashboard')) return ['Overview'];
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
    <header className="h-14 border-b border-[#1f1e26] bg-[#0c0c10]/85 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0">
      {/* Left: Breadcrumbs & Project Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-[#555562]">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'font-semibold text-white'
                    : 'hover:text-white cursor-pointer transition-colors'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121217] border border-[#24242d] hover:border-[#3b2b5d] text-xs text-[#f8f7ff] transition-all hover:shadow-[0_0_12px_rgba(121,80,232,0.15)] active:scale-95"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span className="max-w-[120px] truncate font-medium">
                {activeProject ? activeProject.name : 'Switch Project'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#71717f] ml-0.5" />
            </button>

            {projectSwitcherOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-[#0c0c10] border border-[#1f1e26] rounded-xl shadow-[0_20px_45px_rgba(0,0,0,0.7)] py-1.5 text-xs text-white z-50 animate-slide-up">
                <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#71717f] border-b border-[#1f1e26]">
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
                      className={`w-full text-left px-3.5 py-2 hover:bg-[#15141c] flex items-center justify-between transition-colors ${
                        activeProject?.id === p.id ? 'bg-[#20172f] text-[#c4b5fd] font-medium' : 'text-[#a1a1aa] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {activeProject?.id === p.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_6px_#a78bfa]" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1 border-t border-[#1f1e26] px-2 mt-1">
                  <button
                    onClick={() => {
                      setProjectSwitcherOpen(false);
                      onOpenNewProjectModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#c4b5fd] hover:text-white hover:bg-[#15141c] flex items-center gap-1.5 font-semibold transition-colors"
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-semibold rounded-lg shadow-[0_2px_12px_rgba(109,40,217,0.35)] hover:shadow-[0_4px_18px_rgba(109,40,217,0.55)] transition-all duration-150 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>

        {/* User Account Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-[#15141c] transition-all duration-150 border border-transparent hover:border-[#1f1e26] hover:scale-105 active:scale-95"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7950e8] to-[#9333ea] flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_rgba(121,80,232,0.35)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717f]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-[#0c0c10] border border-[#1f1e26] rounded-xl shadow-[0_20px_45px_rgba(0,0,0,0.7)] py-1.5 text-xs text-white z-50 animate-slide-up">
              <div className="px-3.5 py-2.5 border-b border-[#1f1e26]">
                <p className="font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-[#a1a1aa] truncate mt-0.5">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#20172f] text-[#c4b5fd] border border-[#3b2b5d] shadow-[0_0_8px_rgba(121,80,232,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
                  <span>{subscription?.plan?.name || 'Free Tier'}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#15141c] transition-colors text-[#a1a1aa] hover:text-white"
                >
                  <UserIcon className="w-4 h-4 text-[#71717f]" />
                  <span>Profile & Account</span>
                </Link>
                <Link
                  to="/billing"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#15141c] transition-colors text-[#a1a1aa] hover:text-white"
                >
                  <CreditCard className="w-4 h-4 text-[#71717f]" />
                  <span>Subscription & Billing</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#15141c] transition-colors text-[#a1a1aa] hover:text-white"
                >
                  <Settings className="w-4 h-4 text-[#71717f]" />
                  <span>Workspace Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#1f1e26]">
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
