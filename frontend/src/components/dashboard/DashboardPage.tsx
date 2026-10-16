import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Clock,
} from 'lucide-react';
import { User, Project, Subscription } from '../../types';

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
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in text-[#f8f7ff]">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#262734]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
            Create, build, and deploy high-performance applications with AI orchestration.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/projects')}
            className="px-3.5 py-2 text-xs font-medium text-[#d4d4dc] hover:text-white bg-[#1c1d29] hover:bg-[#232435] border border-[#2b2c3d] hover:border-[#3b2b5d] rounded-lg transition-colors active:scale-95"
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#7950e8] hover:bg-[#8965f0] text-white text-xs font-semibold rounded-lg transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Metrics & Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Projects */}
        <div className="p-5 rounded-xl bg-[#161722] border border-[#262734] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-2">
              <span className="font-medium text-white">
                Active Projects
              </span>
              <span className="text-[#71717f]">
                {projects.length} of {maxProjects}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {projects.length}
              <span className="text-xs font-normal text-[#71717f] ml-1.5">
                / {maxProjects} max
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <div className="w-full h-1.5 bg-[#222332] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7950e8] transition-all duration-300"
                style={{ width: `${projectUsagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-[#71717f]">
              <span>Capacity utilized</span>
              <span className="text-[#c4b5fd] font-medium">{projectUsagePercent}%</span>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="p-5 rounded-xl bg-[#161722] border border-[#262734] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-2">
              <span className="font-medium text-white">
                Subscription Plan
              </span>
              <span className="text-xs font-medium text-[#c4b5fd]">
                {isPaid ? 'Active' : 'Free Tier'}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {planName}
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1">
              {plan?.price || (isPaid ? '₹499/mo' : '₹0/mo')}
              {isPaid ? ' · Monthly renewal' : ' · Standard features'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#262734]">
            <button
              onClick={() => navigate('/billing')}
              className="w-full py-1.5 px-3 bg-[#1c1d29] hover:bg-[#232435] border border-[#2b2c3d] hover:border-[#443468] text-xs font-medium text-[#c4b5fd] hover:text-white rounded-lg transition-colors text-center"
            >
              {isPaid ? 'Manage Billing' : 'Upgrade Plan'}
            </button>
          </div>
        </div>

        {/* Daily AI Capacity */}
        <div className="p-5 rounded-xl bg-[#161722] border border-[#262734] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-2">
              <span className="font-medium text-white">
                Daily AI Capacity
              </span>
              <span className="text-[#c4b5fd] font-medium">
                {plan?.unlimitedAi ? 'Unlimited' : 'Active'}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {plan?.unlimitedAi ? 'Unlimited AI' : 'Active Quota'}
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Refreshes daily at 00:00 UTC
            </p>
          </div>
          <div className="mt-4 pt-2">
            <div className="w-full h-1.5 bg-[#222332] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7950e8] transition-all duration-300"
                style={{ width: plan?.unlimitedAi ? '100%' : '75%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-[#71717f]">
              <span>Daily allowance</span>
              <span className="text-[#c4b5fd] font-medium">Operational</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#262734]">
            <button
              onClick={() => navigate('/usage')}
              className="w-full py-1.5 px-3 bg-[#1c1d29] hover:bg-[#232435] border border-[#2b2c3d] hover:border-[#443468] text-xs font-medium text-[#c4b5fd] hover:text-white rounded-lg transition-colors text-center cursor-pointer"
            >
              View Quotas
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wider text-[#a78bfa] uppercase">
            Recent Workspaces
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-medium text-[#c4b5fd] hover:text-white transition-colors"
          >
            View all ({projects.length})
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-[#161722] border border-[#262734] animate-pulse"
              />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#161722] border border-dashed border-[#262734] text-center space-y-3">
            <h3 className="text-sm font-semibold text-white">
              No projects created yet
            </h3>
            <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto">
              Start building your first web application, dashboard, or component with AI assistance.
            </p>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7950e8] hover:bg-[#8965f0] text-white text-xs font-medium rounded-lg transition-colors"
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
                className="group p-5 rounded-xl bg-[#161722] border border-[#262734] hover:border-[#7950e8]/50 hover:bg-[#1a1b28] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-sm text-white group-hover:text-[#c4b5fd] transition-colors truncate">
                      {proj.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[#1c1d29] border border-[#2b2c3d] text-[10px] font-medium text-[#a1a1aa] uppercase shrink-0">
                      {proj.role || 'OWNER'}
                    </span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] line-clamp-2 mt-1">
                    {proj.description || 'Full-stack AI development workspace.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#262734] flex items-center justify-between text-xs text-[#71717f]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {proj.updatedAt
                      ? new Date(proj.updatedAt).toLocaleDateString()
                      : 'Recently updated'}
                  </span>
                  <span className="text-[#c4b5fd] group-hover:text-white font-medium">
                    Open Workspace
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start / Starter Actions */}
      <div className="p-6 rounded-xl bg-[#161722] border border-[#262734] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Ready to create something new?
          </h3>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Ask NovaBuild to generate complete React apps, responsive forms, or interactive hero sections.
          </p>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="px-4 py-2 bg-[#7950e8] hover:bg-[#8965f0] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          Initialize Workspace
        </button>
      </div>
    </div>
  );
};
