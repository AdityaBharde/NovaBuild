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
  Clock,
  Layers,
  Terminal,
  Cpu,
  Compass,
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

const STARTER_TEMPLATES = [
  {
    title: 'Modern SaaS Dashboard',
    tag: 'Fullstack',
    description: 'React, Tailwind CSS, analytics charts, and responsive sidebar navigation.',
    icon: Layers,
  },
  {
    title: 'AI Prompt & Chat Engine',
    tag: 'AI Studio',
    description: 'Real-time streaming agent conversation with markdown & code syntax highlighting.',
    icon: Sparkles,
  },
  {
    title: 'Interactive Landing Page',
    tag: 'Frontend',
    description: 'Cosmic dark aesthetic, fluid text animations, and high-converting CTA sections.',
    icon: Compass,
  },
  {
    title: 'REST API & Microservice',
    tag: 'Backend',
    description: 'Stateless endpoints, JWT authentication schema, and clean data architecture.',
    icon: Cpu,
  },
];

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

  const handleLaunchTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
    window.dispatchEvent(
      new CustomEvent('novabuild:create-project', {
        detail: {
          name: template.title,
          description: template.description,
        },
      })
    );
  };

  return (
    <div className="relative p-6 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in text-[#f8f7ff]">
      {/* Welcome Banner */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1f1e26]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20172f] border border-[#3b2b5d] text-[#c4b5fd] text-[11px] font-semibold tracking-wide shadow-[0_0_14px_rgba(121,80,232,0.25)] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa] shadow-[0_0_8px_rgba(167,139,250,0.9)] animate-pulse" />
            <span>{isPaid ? 'PRO SUBSCRIBER' : 'STARTER TIER'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-white via-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
              {user.name}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1.5 max-w-xl leading-relaxed">
            Create, orchestrate, and deploy high-performance applications with AI orchestration.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-xs font-semibold text-[#d4d4dc] hover:text-white bg-[#121217] hover:bg-[#181624] border border-[#24242d] hover:border-[#3b2b5d] rounded-xl transition-all duration-150 hover:shadow-[0_0_12px_rgba(121,80,232,0.15)] active:scale-95"
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-semibold rounded-xl shadow-[0_4px_16px_rgba(109,40,217,0.35)] hover:shadow-[0_6px_22px_rgba(109,40,217,0.55),0_0_16px_rgba(139,92,246,0.4)] transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Metrics & Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Project Capacity */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#0c0c10]/85 backdrop-blur-md border border-[#1f1e26] hover:border-[#7950e8]/40 hover:shadow-[0_0_24px_rgba(121,80,232,0.12)] transition-all duration-200 group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#7950e8]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7950e8]/12 transition-colors" />
          <div>
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-3">
              <span className="font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center text-[#c4b5fd] shadow-[0_0_10px_rgba(121,80,232,0.2)]">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                Active Workspaces
              </span>
              <span className="text-[11px] font-medium text-[#71717f]">
                {projects.length} / {maxProjects}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white">
              {projects.length}
              <span className="text-xs font-normal text-[#71717f] ml-1.5">
                / {maxProjects} max
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <div className="w-full h-2 bg-[#17151f] border border-[#24242d] rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(121,80,232,0.5)] ${
                  projectUsagePercent >= 90
                    ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                    : 'bg-gradient-to-r from-[#7950e8] to-[#c4b5fd]'
                }`}
                style={{ width: `${projectUsagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-[#71717f]">
              <span>Capacity: {projectUsagePercent}% utilized</span>
              <span className="text-[#a78bfa]">{maxProjects - projects.length} slots left</span>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#0c0c10]/85 backdrop-blur-md border border-[#1f1e26] hover:border-[#7950e8]/40 hover:shadow-[0_0_24px_rgba(121,80,232,0.12)] transition-all duration-200 group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#7950e8]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7950e8]/12 transition-colors" />
          <div>
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-3">
              <span className="font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center text-[#c4b5fd] shadow-[0_0_10px_rgba(121,80,232,0.2)]">
                  <Zap className="w-4 h-4" />
                </div>
                Subscription Plan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ade80]" />
                {isPaid ? 'Active' : 'Free Tier'}
              </span>
            </div>
            <div className="text-xl font-extrabold text-white">
              {planName}
            </div>
            <p className="text-[11px] text-[#a1a1aa] mt-1">
              {plan?.price || (isPaid ? '₹499/mo' : '₹0/mo')}
              {isPaid ? ' · Renews monthly' : ' · Standard features'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1f1e26] flex items-center justify-between">
            <span className="text-[11px] text-[#71717f]">
              {isPaid ? 'Full AI agent access' : 'Upgrade for unlimited AI'}
            </span>
            <button
              onClick={() => navigate('/billing')}
              className="text-xs font-semibold text-[#c4b5fd] hover:text-white flex items-center gap-1 transition-colors group/btn"
            >
              <span>{isPaid ? 'Manage Billing' : 'Upgrade to Pro'}</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* AI Quotas */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#0c0c10]/85 backdrop-blur-md border border-[#1f1e26] hover:border-[#7950e8]/40 hover:shadow-[0_0_24px_rgba(121,80,232,0.12)] transition-all duration-200 group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#7950e8]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7950e8]/12 transition-colors" />
          <div>
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-3">
              <span className="font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center text-[#c4b5fd] shadow-[0_0_10px_rgba(121,80,232,0.2)]">
                  <Activity className="w-4 h-4" />
                </div>
                Daily AI Capacity
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#20172f] border border-[#3b2b5d] text-[10px] font-semibold text-[#c4b5fd]">
                Tokens/day
              </span>
            </div>
            <div className="text-xl font-extrabold text-white">
              {plan?.maxTokensPerDay
                ? `${(plan.maxTokensPerDay / 1000).toLocaleString()}k`
                : '50k'}
              <span className="text-xs font-normal text-[#71717f] ml-1.5">
                {plan?.unlimitedAi ? '(Unlimited iterations)' : 'allocated'}
              </span>
            </div>
            <p className="text-[11px] text-[#a1a1aa] mt-1">
              Refreshes daily at 00:00 UTC
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1f1e26] flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ade80]" />
              Status: 100% Operational
            </span>
            <button
              onClick={() => navigate('/usage')}
              className="text-xs font-semibold text-[#c4b5fd] hover:text-white flex items-center gap-1 transition-colors group/btn"
            >
              <span>View Quotas</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Accelerators / Templates */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#a78bfa] block mb-1">
              AI ACCELERATORS
            </span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Start from a Production-Ready Architecture
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {STARTER_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.title}
              onClick={() => handleLaunchTemplate(tmpl)}
              className="group relative overflow-hidden p-4 rounded-xl bg-[#0c0c10]/80 backdrop-blur-md border border-[#1f1e26] hover:border-[#7950e8]/50 hover:bg-[#121217] hover:shadow-[0_0_20px_rgba(121,80,232,0.15)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center text-[#c4b5fd] group-hover:scale-105 group-hover:border-[#7950e8] group-hover:text-white transition-all">
                    <tmpl.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#181624] text-[#a78bfa] border border-[#24242d]">
                    {tmpl.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-white group-hover:text-[#c4b5fd] transition-colors">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-[#a1a1aa] line-clamp-2 mt-1 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1f1e26]/60 flex items-center justify-between text-[10px] text-[#71717f]">
                <span className="group-hover:text-[#c4b5fd] font-medium transition-colors">
                  Quick Initialize
                </span>
                <ArrowRight className="w-3 h-3 text-[#71717f] group-hover:text-[#c4b5fd] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#a78bfa] block mb-1">
              WORKSPACE DIRECTORY
            </span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Recent Workspaces
            </h2>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-semibold text-[#c4b5fd] hover:text-white flex items-center gap-1 transition-colors group/view"
          >
            <span>View all ({projects.length})</span>
            <ArrowRight className="w-3 h-3 group-view:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-[#0c0c10] border border-[#1f1e26] animate-pulse"
              />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#0c0c10]/75 backdrop-blur-md border border-dashed border-[#2d2542] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center mx-auto text-[#c4b5fd] shadow-[0_0_16px_rgba(121,80,232,0.3)]">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                No workspaces created yet
              </h3>
              <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto mt-1 leading-relaxed">
                Start building your first web application, dashboard, or component with AI assistance.
              </p>
            </div>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(109,40,217,0.35)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create your first project</span>
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
                className="group relative overflow-hidden p-5 rounded-2xl bg-[#0c0c10]/85 backdrop-blur-md border border-[#1f1e26] hover:border-[#7950e8]/50 hover:bg-[#121217]/95 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_24px_rgba(121,80,232,0.15)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#7950e8]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#7950e8]/15 transition-colors" />
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#20172f] border border-[#3b2b5d] flex items-center justify-center text-[#c4b5fd] group-hover:scale-105 group-hover:border-[#7950e8] group-hover:text-white group-hover:shadow-[0_0_12px_rgba(121,80,232,0.4)] transition-all shrink-0">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-[#c4b5fd] transition-colors truncate">
                        {proj.name}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#181624] border border-[#24242d] text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider shrink-0">
                      {proj.role || 'OWNER'}
                    </span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] line-clamp-2 mt-2 leading-relaxed">
                    {proj.description || 'Full-stack AI development workspace.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1f1e26]/80 flex items-center justify-between text-[11px] text-[#71717f]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {proj.updatedAt
                      ? new Date(proj.updatedAt).toLocaleDateString()
                      : 'Recently updated'}
                  </span>
                  <span className="text-[#c4b5fd] group-hover:text-white group-hover:translate-x-0.5 transition-all font-semibold flex items-center gap-1">
                    Open Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start / Starter Actions (Theme Matched to Landing CTA) */}
      <div className="relative overflow-hidden p-7 rounded-2xl border border-[#302742] bg-[radial-gradient(ellipse_at_top,_rgba(109,40,217,0.22),_rgba(12,12,16,0.9)_70%)] shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(109,40,217,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#251b3d] border border-[#523b7a] flex items-center justify-center text-[#c4b5fd] shadow-[0_0_20px_rgba(167,139,250,0.4)] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Ready to create something extraordinary?
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-1 max-w-lg leading-relaxed">
              Ask NovaBuild to generate complete React apps, responsive forms, or interactive hero sections with full AI orchestration.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-semibold rounded-xl shadow-[0_4px_14px_rgba(109,40,217,0.4)] hover:shadow-[0_6px_22px_rgba(109,40,217,0.6)] transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Initialize Workspace</span>
        </button>
      </div>
    </div>
  );
};
