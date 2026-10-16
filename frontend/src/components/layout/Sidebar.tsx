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
      to: '/dashboard/home',
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
      className={`relative flex flex-col border-r border-[#1f1e26] bg-[#0c0c10]/95 backdrop-blur-md transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#1f1e26]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#8053f5] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(128,83,245,0.45)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-white">
                Nova<span className="text-[#a78bfa]">Build</span>
              </span>
              <span className="block text-[10px] text-[#71717f] leading-none">
                AI Development Platform
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-[#a1a1aa] hover:text-white p-1 rounded-md hover:bg-[#15141c] transition-colors"
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#7950e8]/15 text-white font-semibold border border-[#7950e8]/35 shadow-[0_0_12px_rgba(121,80,232,0.15)]'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#15141c] border border-transparent hover:border-[#1f1e26]'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c4b5fd]' : 'text-[#71717f]'}`} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isPaid
                      ? 'bg-[#20172f] text-[#c4b5fd] border-[#3b2b5d]'
                      : 'bg-[#15141c] text-[#71717f] border-[#24242d]'
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
        <div className="p-3.5 mx-2 mb-2 rounded-xl bg-gradient-to-b from-[#181624] to-[#0e0d15] border border-[#302742] shadow-[0_0_18px_rgba(121,80,232,0.1)]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
              {planName}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              {isPaid ? 'Active' : 'Free Tier'}
            </span>
          </div>
          <p className="text-[11px] text-[#a1a1aa] leading-snug mb-2.5">
            {isPaid
              ? 'Enjoy high-speed streaming and quota boosts.'
              : 'Upgrade to Pro for unlimited AI and full sandboxes.'}
          </p>
          <NavLink
            to="/billing"
            className="block text-center text-[11px] font-semibold py-1.5 px-2 rounded-lg bg-gradient-to-r from-[#8053f5] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-[0_2px_10px_rgba(109,40,217,0.35)] transition-all"
          >
            {isPaid ? 'Manage Subscription' : 'Upgrade to Pro'}
          </NavLink>
        </div>
      )}

      {/* User Footer */}
      <div className="p-3 border-t border-[#1f1e26] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#181624] border border-[#24242d] flex items-center justify-center shrink-0 font-semibold text-xs text-[#c4b5fd] shadow-[0_0_8px_rgba(121,80,232,0.2)]">
          {user.name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-[#71717f] truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
