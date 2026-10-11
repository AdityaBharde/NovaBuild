import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  ArrowRight,
  Code2,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { User, Project, Subscription } from '../../types';
import { Badge } from '../common/Badge';

interface DashboardPageProps {
  user: User;
  projects: Project[];
  subscription: Subscription | null;
  onSelectProject: (p: Project) => void;
  onOpenNewProjectModal: () => void;
  isLoading?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  projects,
  subscription,
  onSelectProject,
  onOpenNewProjectModal,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const plan = subscription?.plan;
  const planName = plan?.name || 'Starter Plan';
  const isPaid = !!plan && plan.id > 0;
  const maxProjects = plan?.maxProjects || 3;
  const projectUsagePercent = Math.min(100, Math.round((projects.length / maxProjects) * 100));

  const sortedProjects = [...projects].sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const recentProjects = sortedProjects.slice(0, 4);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome back, {user.name}
            </h1>
            <Badge variant={isPaid ? 'violet' : 'default'} size="sm">
              {isPaid ? 'PRO SUBSCRIBER' : 'STARTER'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Create, build, and deploy high-performance applications with full AI orchestration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary border border-border hover:bg-surface-elevated rounded-lg transition-colors"
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm shadow-accent/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Metrics & Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Capacity */}
        <div className="p-5 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span className="font-medium flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-accent" />
                Active Projects
              </span>
              <span>
                {projects.length} of {maxProjects}
              </span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {projects.length}
              <span className="text-xs font-normal text-text-secondary ml-1">
                / {maxProjects} max
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  projectUsagePercent >= 90 ? 'bg-amber-400' : 'bg-accent'
                }`}
                style={{ width: `${projectUsagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="p-5 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span className="font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent" />
                Subscription Plan
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                {isPaid ? 'Active' : 'Free'}
              </span>
            </div>
            <div className="text-xl font-bold text-text-primary">
              {planName}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              {plan?.price || (isPaid ? '₹499/mo' : '₹0/mo')}
              {isPaid ? ' · Renews monthly' : ' · Standard features'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">
              {isPaid ? 'Full AI agent access' : 'Upgrade for unlimited AI'}
            </span>
            <button
              onClick={() => navigate('/billing')}
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              {isPaid ? 'Manage Billing' : 'Upgrade'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* AI Quotas */}
        <div className="p-5 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span className="font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-accent" />
                Daily AI Capacity
              </span>
              <span className="text-[11px] text-text-secondary">Tokens/day</span>
            </div>
            <div className="text-xl font-bold text-text-primary">
              {plan?.maxTokensPerDay
                ? `${(plan.maxTokensPerDay / 1000).toLocaleString()}k`
                : '50k'}
              <span className="text-xs font-normal text-text-secondary ml-1.5">
                {plan?.unlimitedAi ? '(Unlimited iterations)' : 'allocated'}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              Refreshes daily at 00:00 UTC
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">
              Status: 100% Operational
            </span>
            <button
              onClick={() => navigate('/usage')}
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              View Quotas
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-text-primary uppercase text-xs text-text-secondary">
            Recent Workspaces
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
          >
            View all ({projects.length})
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-surface border border-border animate-pulse"
              />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface border border-dashed border-border text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center mx-auto text-text-secondary">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              No projects created yet
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Start building your first web application, dashboard, or component with AI assistance.
            </p>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  onSelectProject(proj);
                  navigate(`/workspace/${proj.id}`);
                }}
                className="group p-5 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border/80 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                        {proj.name}
                      </h3>
                    </div>
                    <Badge variant="outline" size="sm">
                      {proj.role || 'OWNER'}
                    </Badge>
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
                  <span className="text-accent group-hover:translate-x-0.5 transition-transform font-medium flex items-center gap-1">
                    Open Workspace
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start / Starter Actions */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-surface to-surface-elevated border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Ready to create something new?
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Ask NovaBuild to generate complete React apps, responsive forms, or interactive hero sections.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          Initialize Workspace
        </button>
      </div>
    </div>
  );
};
