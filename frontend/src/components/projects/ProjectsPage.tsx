import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Code2,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Project } from '../../types';
import { updateProject, deleteProject } from '../../api/client';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';

interface ProjectsPageProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProjectModal: () => void;
  onProjectUpdated: (p: Project) => void;
  onProjectDeleted: (id: string | number) => void;
  isLoading?: boolean;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onSelectProject,
  onOpenNewProjectModal,
  onProjectUpdated,
  onProjectDeleted,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created'>('updated');

  // Action states
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & sort
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'created') {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    }
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  });

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToRename || !renameValue.trim() || isRenaming) return;

    setIsRenaming(true);
    try {
      const updated = await updateProject(projectToRename.id, renameValue.trim());
      onProjectUpdated(updated);
      setProjectToRename(null);
    } catch (err) {
      alert('Failed to rename project');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      onProjectDeleted(projectToDelete.id);
      setProjectToDelete(null);
    } catch (err) {
      alert('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in" onClick={() => setActiveMenuId(null)}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Projects
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your AI development repositories, sandboxes, and applications.
          </p>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm shadow-accent/20 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* View Toggle & Sorting */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="updated">Recently Updated</option>
            <option value="name">Name (A-Z)</option>
            <option value="created">Date Created</option>
          </select>

          <div className="flex items-center p-0.5 bg-surface border border-border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid'
                  ? 'bg-surface-elevated text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${
                viewMode === 'list'
                  ? 'bg-surface-elevated text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl bg-surface border border-border animate-pulse"
            />
          ))}
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface border border-dashed border-border text-center space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {searchQuery ? 'No matching projects found' : 'No projects yet'}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search query or clear the filter.'
              : 'Create a new project to start collaborating with the NovaBuild AI agent.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenNewProjectModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProjects.map((proj) => (
            <div
              key={proj.id}
              className="group relative p-5 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    onClick={() => {
                      onSelectProject(proj);
                      navigate(`/workspace/${proj.id}`);
                    }}
                    className="cursor-pointer flex-1 min-w-0"
                  >
                    <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                      {proj.name}
                    </h3>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === proj.id ? null : proj.id);
                      }}
                      className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === proj.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-1 w-36 bg-surface-elevated border border-border rounded-lg shadow-xl py-1 text-xs text-text-primary z-30 animate-slide-up"
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onSelectProject(proj);
                            navigate(`/workspace/${proj.id}`);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-surface flex items-center gap-2 text-text-secondary hover:text-text-primary"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          Open
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setProjectToRename(proj);
                            setRenameValue(proj.name);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-surface flex items-center gap-2 text-text-secondary hover:text-text-primary"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Rename
                        </button>
                        <div className="border-t border-border/50 my-1" />
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setProjectToDelete(proj);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                  {proj.description || 'Full-stack AI development workspace.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-text-secondary">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {proj.updatedAt
                    ? new Date(proj.updatedAt).toLocaleDateString()
                    : 'Recently updated'}
                </span>
                <button
                  onClick={() => {
                    onSelectProject(proj);
                    navigate(`/workspace/${proj.id}`);
                  }}
                  className="text-accent hover:underline font-medium flex items-center gap-1"
                >
                  Workspace
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Layout */
        <div className="rounded-xl bg-surface border border-border divide-y divide-border/60 overflow-hidden">
          {sortedProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                onSelectProject(proj);
                navigate(`/workspace/${proj.id}`);
              }}
              className="p-4 hover:bg-surface-elevated/40 transition-colors flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0">
                  <h3 className="font-semibold text-xs text-text-primary hover:text-accent truncate">
                    {proj.name}
                  </h3>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {proj.description || 'Full-stack AI workspace'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
                <Badge variant="outline" size="sm">
                  {proj.role || 'OWNER'}
                </Badge>
                <span className="hidden sm:inline text-[11px]">
                  {proj.updatedAt
                    ? new Date(proj.updatedAt).toLocaleDateString()
                    : 'Recent'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToRename(proj);
                    setRenameValue(proj.name);
                  }}
                  className="p-1 rounded hover:bg-surface text-text-secondary hover:text-text-primary"
                  title="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(proj);
                  }}
                  className="p-1 rounded hover:bg-rose-500/10 text-text-secondary hover:text-rose-400"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={!!projectToRename}
        onClose={() => setProjectToRename(null)}
        title="Rename Project"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={() => setProjectToRename(null)}
              className="px-3.5 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRenaming || !renameValue.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center gap-1.5"
            >
              {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${projectToDelete?.name}"? All associated generated files, chat histories, and preview containers will be removed. This action cannot be undone.`}
        confirmText="Delete Project"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
