import React, { useState } from 'react';
import { Project, User } from '../types';
import { Layers, Plus, Search, Clock, LogOut, Loader2, FolderDot, Sparkles } from 'lucide-react';
import { createProject } from '../api/client';

interface DashboardProps {
  user: User;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onLogout: () => void;
  onProjectCreated: (project: Project) => void;
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  projects,
  onSelectProject,
  onLogout,
  onProjectCreated,
  isLoading
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    try {
      const created = await createProject(newProjectName, 'Created from Dashboard');
      onProjectCreated(created);
      setNewProjectName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050506] font-sans text-[#f8f7ff]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0c0c10] border-r border-[#1f1e26] flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-[#1f1e26] shrink-0">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-white">
            <div className="w-7 h-7 rounded-lg bg-[#8053f5] flex items-center justify-center text-white shadow-[0_0_12px_rgba(128,83,245,0.4)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Nova<span className="text-[#a78bfa]">Build</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold text-[#71717f] uppercase tracking-wider mb-2 mt-4">
            Workspace
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-[#7950e8]/15 text-white border border-[#7950e8]/30 font-semibold shadow-[0_0_12px_rgba(121,80,232,0.15)]">
            <FolderDot className="w-4 h-4 text-[#c4b5fd]" />
            All Projects
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#15141c] border border-transparent transition-colors">
            <Clock className="w-4 h-4 text-[#71717f]" />
            Recent
          </button>
        </div>

        <div className="p-3 border-t border-[#1f1e26] shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-[#a1a1aa] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050506]">
        <header className="h-14 border-b border-[#1f1e26] bg-[#0c0c10]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <h1 className="text-sm font-semibold text-white">Projects</h1>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#a1a1aa]">{user.name || user.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717f]" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#121217] border border-[#24242d] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f8f7ff] placeholder:text-[#71717f] focus:outline-none focus:border-[#7950e8] focus:ring-1 focus:ring-[#7950e8]/40 transition-colors"
                />
              </div>

              <form onSubmit={handleCreateProject} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="bg-[#121217] border border-[#24242d] rounded-xl px-3 py-2 text-xs text-[#f8f7ff] placeholder:text-[#71717f] focus:outline-none focus:border-[#7950e8] focus:ring-1 focus:ring-[#7950e8]/40 transition-colors w-48"
                />
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-semibold py-2 px-3.5 rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-[0_2px_10px_rgba(109,40,217,0.35)]"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  New Project
                </button>
              </form>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a1a1aa] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#a78bfa]" />
                <p className="text-xs">Loading projects...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="flex flex-col items-start p-5 bg-[#0c0c10]/85 border border-[#1f1e26] rounded-2xl hover:border-[#7950e8]/50 hover:bg-[#121217] hover:shadow-[0_0_24px_rgba(121,80,232,0.12)] transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-[#7950e8] group-hover:text-white transition-all text-[#c4b5fd]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 truncate w-full group-hover:text-[#c4b5fd] transition-colors">{project.name}</h3>
                    <p className="text-xs text-[#a1a1aa] line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-[#a1a1aa] border border-dashed border-[#2d2542] rounded-2xl bg-[#0c0c10]/60">
                <FolderDot className="w-12 h-12 mb-3 text-[#3b2b5d]" />
                <p className="text-sm font-semibold text-white">No projects found.</p>
                {search && <p className="text-xs text-[#71717f] mt-1">Try adjusting your search query.</p>}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
