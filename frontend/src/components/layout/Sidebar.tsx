import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FolderGit2,
  Code2,
  Activity,
  CreditCard,
  Settings,
  ChevronLeft,
  MessageSquare,
  ExternalLink,
  Search,
  X,
  LogOut,
} from 'lucide-react';
import { User, Subscription } from '../../types';
import { getBasePath } from '../../api/client';

// ============================================================================
// Types
// ============================================================================

export interface NavItemType {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  exact?: boolean;
}

interface SidebarProps {
  user: User;
  subscription: Subscription | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProjectId?: string | number | null;
  onLogout?: () => void;
}

// ============================================================================
// Base Component: BadgeWithDot (Purple theme, zero green)
// ============================================================================

export const BadgeWithDot: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, size = 'sm', className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 font-medium rounded-full px-2 py-0.5 text-[10px] bg-[#20172f] text-[#c4b5fd] border border-[#3b2b5d] shrink-0 ${className}`}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
    {children}
  </span>
);

// ============================================================================
// Base Component: FeaturedCardProgressBar
// ============================================================================

export interface FeaturedCardProgressBarProps {
  title: string;
  description: string;
  confirmLabel?: string;
  progress: number;
  onDismiss?: () => void;
  onConfirm?: () => void;
  className?: string;
}

export const FeaturedCardProgressBar: React.FC<FeaturedCardProgressBarProps> = ({
  title,
  description,
  confirmLabel = 'Upgrade plan',
  progress,
  onDismiss,
  onConfirm,
  className = '',
}) => {
  return (
    <div
      className={`p-3.5 rounded-xl bg-[#161722] border border-[#262734] relative shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-xs font-semibold text-white tracking-tight">{title}</h4>
        {onDismiss && (
          <button
            onClick={onDismiss}
            title="Dismiss"
            className="text-[#71717f] hover:text-white p-0.5 rounded transition-colors -mr-1 -mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-3">
        {description}
      </p>

      {/* Progress Bar (Solid purple, no gradient) */}
      <div className="space-y-1.5 mb-3">
        <div className="w-full bg-[#1c1d29] h-2 rounded-full overflow-hidden border border-[#262734]">
          <div
            className="bg-[#7950e8] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[11px] font-medium text-[#a1a1aa] hover:text-white transition-colors px-2 py-1 rounded"
          >
            Dismiss
          </button>
        )}
        <button
          onClick={onConfirm}
          className="flex-1 text-center text-[11px] font-semibold py-1.5 px-2.5 rounded-lg bg-[#7950e8] hover:bg-[#8965f0] text-white transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component: Sidebar (Flat navigation, no dropdowns, smooth animation)
// ============================================================================

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  subscription,
  collapsed,
  onToggleCollapse,
  activeProjectId,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFeatureCard, setShowFeatureCard] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const viteLogo = `${getBasePath()}/vite.svg`.replace(/^\/\//, '/');

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (collapsed) onToggleCollapse();
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, onToggleCollapse]);

  // Clean flat navigation items (NO DROPDOWNS)
  const navItems: NavItemType[] = [
    {
      label: 'Overview',
      href: '/dashboard/home',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: FolderGit2,
    },
    ...(activeProjectId
      ? [
          {
            label: 'Workspace',
            href: `/workspace/${activeProjectId}`,
            icon: Code2,
            badge: 'Active',
          },
        ]
      : []),
    {
      label: 'Usage & Quotas',
      href: '/usage',
      icon: Activity,
    },
    {
      label: 'Billing & Plans',
      href: '/billing',
      icon: CreditCard,
      badge: subscription?.plan?.name || 'Free',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  // Footer navigation items
  const footerItems: NavItemType[] = [
    {
      label: 'Support',
      href: '/settings',
      icon: MessageSquare,
      badge: <BadgeWithDot size="sm">Online</BadgeWithDot>,
    },
    {
      label: 'Documentation',
      href: '/',
      icon: ExternalLink,
    },
  ];

  // Search filtering
  const query = searchQuery.trim().toLowerCase();

  const extraSearchItems: NavItemType[] = [
    {
      label: 'Appearance & Theme',
      href: '/settings?tab=appearance',
      icon: Settings,
      badge: 'Theme',
    },
    {
      label: 'Security & Password',
      href: '/settings?tab=security',
      icon: Settings,
      badge: 'Security',
    },
    {
      label: 'Account & Profile',
      href: '/settings?tab=profile',
      icon: Settings,
      badge: 'Profile',
    },
    {
      label: 'Danger Zone',
      href: '/settings?tab=account',
      icon: Settings,
      badge: 'Account',
    },
  ];

  const filteredNavItems = query
    ? [...navItems, ...extraSearchItems].filter((item) =>
        item.label.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query) ||
        (typeof item.badge === 'string' && item.badge.toLowerCase().includes(query))
      )
    : navItems;

  const filteredFooterItems = query
    ? footerItems.filter((item) =>
        item.label.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
      )
    : footerItems;

  const renderBadge = (badge: React.ReactNode) => {
    if (!badge) return null;
    if (typeof badge === 'string' || typeof badge === 'number') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[#c4b5fd] border border-[var(--border-color)] shrink-0">
          {badge}
        </span>
      );
    }
    return badge;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="relative flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] select-none h-screen shrink-0 overflow-hidden z-30 transition-colors duration-200"
    >
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        } border-b border-[var(--border-color)] shrink-0 transition-all`}
      >
        <Link
          to="/dashboard/home"
          className="flex items-center gap-2.5 overflow-hidden min-w-0 cursor-pointer group"
          title="NovaBuild Overview"
        >
          <img
            src={viteLogo}
            alt="NovaBuild"
            className="w-7 h-7 object-contain shrink-0 group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/vite.svg';
            }}
          />

          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden whitespace-nowrap min-w-0"
          >
            <span className="font-bold text-sm tracking-tight text-white block group-hover:text-white">
              Nova<span className="text-[#a78bfa]">Build</span>
            </span>
            <span className="block text-[10px] text-[#71717f] leading-none">
              AI Development Platform
            </span>
          </motion.div>
        </Link>

        {/* Hide arrow toggle button completely when collapsed */}
        {!collapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            title="Collapse sidebar"
            className="text-[#a1a1aa] hover:text-white p-1.5 rounded-md hover:bg-[#1c1d29] transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div
          onClick={() => {
            if (collapsed) {
              onToggleCollapse();
              setTimeout(() => searchInputRef.current?.focus(), 80);
            } else {
              searchInputRef.current?.focus();
            }
          }}
          className={`relative flex items-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] transition-all hover:border-[var(--border-hover)] cursor-pointer ${
            collapsed ? 'justify-center p-2' : 'px-3 py-1.5'
          }`}
        >
          <Search className="w-4 h-4 text-[#71717f] shrink-0" />
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap flex-1 flex items-center justify-between ml-2"
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or jump to..."
              className="w-full bg-transparent text-xs text-white placeholder-[#71717f] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-0.5 text-[#71717f] hover:text-white rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="text-[10px] text-[#71717f] bg-[var(--bg-input)] px-1.5 py-0.5 rounded border border-[var(--border-color)] font-mono">
                ⌘K
              </kbd>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Navigation (Clean flat list, NO DROPDOWNS) */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {filteredNavItems.length === 0 ? (
          <div className="py-6 px-3 text-center">
            <p className="text-xs text-[#a1a1aa]">No results found</p>
            <p className="text-[11px] text-[#71717f] mt-0.5">Try searching for overview, projects, settings, theme...</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-[#a78bfa] hover:text-white underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredNavItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={`${item.label}-${item.href}`}
                to={item.href}
                onClick={() => {
                  if (searchQuery) setSearchQuery('');
                }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[#7950e8]/20 text-white font-semibold border border-[#7950e8]/40'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[var(--bg-card)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <item.icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#c4b5fd]' : 'text-[#71717f] group-hover:text-white'
                    }`}
                  />
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : 'auto',
                    }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden whitespace-nowrap text-left truncate"
                  >
                    {item.label}
                  </motion.span>
                </div>

                {!collapsed && (
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : 'auto',
                    }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.badge && renderBadge(item.badge)}
                  </motion.div>
                )}
              </NavLink>
            );
          })
        )}
      </nav>

      {/* FeaturedCardProgressBar (Animated collapse & dismiss) */}
      <AnimatePresence>
        {!collapsed && showFeatureCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden px-2 mb-2 shrink-0"
          >
            <FeaturedCardProgressBar
              title="Used space"
              description="Your team has used 80% of your available space. Need more?"
              confirmLabel="Upgrade plan"
              progress={80}
              onDismiss={() => setShowFeatureCard(false)}
              onConfirm={() => navigate('/billing')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Navigation Items */}
      <div className="p-2 border-t border-[var(--border-color)] space-y-0.5 shrink-0">
        {filteredFooterItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href) && item.href !== '/';

          return (
            <NavLink
              key={`${item.label}-${item.href}`}
              to={item.href}
              onClick={() => {
                if (searchQuery) setSearchQuery('');
              }}
              title={collapsed ? item.label : undefined}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[var(--bg-card)] text-white font-semibold'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[var(--bg-card)] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <item.icon className="w-4 h-4 shrink-0 text-[#71717f] group-hover:text-white transition-colors" />
                <motion.span
                  initial={false}
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto',
                  }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap text-left truncate"
                >
                  {item.label}
                </motion.span>
              </div>

              {!collapsed && (
                <motion.div
                  initial={false}
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto',
                  }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.badge && renderBadge(item.badge)}
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center shrink-0 font-semibold text-xs text-[#c4b5fd]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap min-w-0"
          >
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-[#71717f] truncate">{user.email}</p>
          </motion.div>
        </div>

        {onLogout && !collapsed && (
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              scale: collapsed ? 0.8 : 1,
            }}
            transition={{ duration: 0.18 }}
          >
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#71717f] hover:text-rose-400 hover:bg-[#1c1d29] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};
