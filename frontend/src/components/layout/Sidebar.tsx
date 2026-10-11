import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Code2,
  Activity,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { User, Subscription } from '../../types';

interface SidebarProps {
  user: User;
  subscription: Subscription | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProjectId?: string | number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  subscription,
  collapsed,
  onToggleCollapse,
  activeProjectId,
}) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Overview',
      to: '/',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Projects',
      to: '/projects',
      icon: FolderGit2,
    },
    ...(activeProjectId
      ? [
          {
            label: 'Workspace',
            to: `/workspace/${activeProjectId}`,
            icon: Code2,
          },
        ]
      : []),
    {
      label: 'Usage & Quotas',
      to: '/usage',
      icon: Activity,
    },
    {
      label: 'Billing & Plans',
      to: '/billing',
      icon: CreditCard,
      badge: subscription?.plan?.name ? subscription.plan.name : 'Free',
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: Settings,
    },
  ];

  const planName = subscription?.plan?.name || 'Starter Plan';
  const isPaid = !!subscription?.plan && subscription.plan.id > 0;

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-surface transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border/70">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center shrink-0 shadow-sm shadow-accent/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-semibold text-sm tracking-tight text-text-primary">
                Nova<span className="text-accent">Build</span>
              </span>
              <span className="block text-[10px] text-text-secondary leading-none">
                AI Development Platform
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-surface-elevated transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isPaid
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-elevated text-text-secondary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Plan Card (when expanded) */}
      {!collapsed && (
        <div className="p-3 mx-2 mb-2 rounded-xl bg-surface-elevated border border-border/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              {planName}
            </span>
            <span className="text-[10px] text-text-secondary">
              {isPaid ? 'Active' : 'Free Tier'}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug mb-2.5">
            {isPaid
              ? 'Enjoy high-speed streaming and quota boosts.'
              : 'Upgrade to Pro for unlimited AI and full sandboxes.'}
          </p>
          <NavLink
            to="/billing"
            className="block text-center text-[11px] font-medium py-1.5 px-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            {isPaid ? 'Manage Subscription' : 'Upgrade to Pro'}
          </NavLink>
        </div>
      )}

      {/* User Footer */}
      <div className="p-3 border-t border-border/70 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0 font-medium text-xs text-text-primary">
          {user.name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-text-secondary truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
