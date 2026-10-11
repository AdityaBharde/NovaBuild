import React, { useState } from 'react';
import { Project, User } from '../types';
import { Layers, Plus, Search, Clock, LogOut, Loader2, FolderDot } from 'lucide-react';
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
    <div className="flex h-screen bg-background font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-text-primary font-semibold tracking-tight">
            <Layers className="w-5 h-5 text-accent" />
            <span>NovaBuild</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 mt-4">
            Workspace
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-surface-elevated text-text-primary font-medium">
            <FolderDot className="w-4 h-4 text-text-secondary" />
            All Projects
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors">
            <Clock className="w-4 h-4" />
            Recent
          </button>
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-8 shrink-0">
          <h1 className="text-sm font-medium text-text-primary">Projects</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-secondary">{user.name || user.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              <form onSubmit={handleCreateProject} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors w-48"
                />
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="bg-text-primary hover:bg-white text-background font-medium py-1.5 px-3 rounded-lg text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  New Project
                </button>
              </form>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-secondary space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm">Loading projects...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="flex flex-col items-start p-5 bg-surface border border-border rounded-xl hover:border-accent transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                      <Layers className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
                    </div>
                    <h3 className="text-sm font-medium text-text-primary mb-1 truncate w-full">{project.name}</h3>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-text-secondary border border-dashed border-border rounded-xl">
                <FolderDot className="w-12 h-12 mb-4 text-border" />
                <p className="text-sm">No projects found.</p>
                {search && <p className="text-xs mt-1">Try adjusting your search.</p>}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
