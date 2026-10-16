import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Project, Subscription } from '../../types';
import { Badge } from '../common/Badge';

interface UsagePageProps {
  projects: Project[];
  subscription: Subscription | null;
}

export const UsagePage: React.FC<UsagePageProps> = ({ projects, subscription }) => {
  const navigate = useNavigate();

  const plan = subscription?.plan;
  const isPaid = !!plan && plan.id > 0;
  const maxProjects = plan?.maxProjects || 3;
  const maxTokens = plan?.maxTokensPerDay || 50000;
  const maxPreviews = plan?.maxPreviews || 1;

  const projectPct = Math.min(100, Math.round((projects.length / maxProjects) * 100));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Usage & Quotas
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Monitor real-time resource allocations, project limits, and AI inference capacity.
          </p>
        </div>

        {!isPaid && (
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Upgrade Quotas</span>
          </button>
        )}
      </div>

      {/* Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Project Capacity */}
        <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
              <span className="font-semibold text-text-primary">
                Active Workspaces
              </span>
              <Badge variant="outline" size="sm">
                {projects.length} / {maxProjects}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-text-primary mb-1">
              {projects.length}
            </div>
            <p className="text-xs text-text-secondary">
              Total active repositories registered in your account.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  projectPct >= 90 ? 'bg-amber-400' : 'bg-accent'
                }`}
                style={{ width: `${projectPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>{projectPct}% used</span>
              <span>{maxProjects - projects.length} remaining</span>
            </div>
          </div>
        </div>

        {/* AI Daily Inference */}
        <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
              <span className="font-semibold text-text-primary">
                Daily AI Capacity
              </span>
              <Badge variant={plan?.unlimitedAi ? 'violet' : 'outline'} size="sm">
                {plan?.unlimitedAi ? 'UNLIMITED' : 'DAILY QUOTA'}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-text-primary mb-1">
              {(maxTokens / 1000).toLocaleString()}k
              <span className="text-xs font-normal text-text-secondary ml-1">
                tokens/day
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Allocated daily for code generation and multi-file editing.
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-text-secondary">
              Status: 100% Health
            </span>
            <span className="text-[11px] text-[#c4b5fd] font-medium">
              Zero Queuing
            </span>
          </div>
        </div>

        {/* Sandboxes */}
        <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
              <span className="font-semibold text-text-primary">
                Container Sandboxes
              </span>
              <Badge variant="outline" size="sm">
                {maxPreviews} Max
              </Badge>
            </div>

            <div className="text-3xl font-bold text-text-primary mb-1">
              {maxPreviews}
            </div>
            <p className="text-xs text-text-secondary">
              Simultaneous Docker/K8s sandbox pods for running apps.
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-text-secondary">
              Vite & React Sandboxes
            </span>
            <span className="text-[11px] text-accent font-medium">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Plan Details Summary */}
      <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Subscription Entitlements: {plan?.name || 'Starter Plan'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Your account limits automatically adjust when you upgrade or downgrade tiers.
            </p>
          </div>
          <button
            onClick={() => navigate('/billing')}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            Manage Plan
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-text-secondary">
          <div className="p-3 rounded-lg bg-surface-elevated border border-border/60">
            <span>Automatic daily quota reset at 00:00 UTC</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated border border-border/60">
            <span>Streaming LLM generation with incremental parsing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
