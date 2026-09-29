import React from 'react';
import { User, Project } from '../types';
import { Sparkles, Play, Code2, LogOut, User as UserIcon, Plus } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onNewProject: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onDeployPreview: () => void;
  isDeploying: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onOpenAuth,
  onLogout,
  onDeployPreview,
  isDeploying,
}) => {
  return (
    <header className="h-14 bg-[#12141a] border-b border-[#242731] px-4 flex items-center justify-between select-none">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-pink-500 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-white">Nova<span className="text-pink-500">Build</span></span>
        </div>

        <div className="h-4 w-[1px] bg-[#292c38]" />

        {/* Project Dropdown */}
        {user && (
          <div className="flex items-center space-x-2">
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => String(p.id) === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-[#1a1d26] border border-[#2b2f3e] text-sm text-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-pink-500"
            >
              {projects.length === 0 && <option value="">No projects</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={onNewProject}
              className="p-1.5 bg-[#1a1d26] hover:bg-[#252936] text-gray-300 rounded-md border border-[#2b2f3e] transition"
              title="Create New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {currentProject && (
          <button
            onClick={onDeployPreview}
            disabled={isDeploying}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3.5 py-1.5 rounded-md text-sm font-medium shadow-md transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isDeploying ? 'Deploying...' : 'Run Preview'}</span>
          </button>
        )}

        {user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#1a1d26] px-3 py-1.5 rounded-md border border-[#2b2f3e]">
              <UserIcon className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-medium text-gray-300">{user.name || user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition shadow-md shadow-pink-600/20"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
