import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Palette,
  CreditCard,
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import { User, Subscription } from '../../types';
import { updateUserProfile, getCurrentUserProfile } from '../../api/client';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Link, useSearchParams } from 'react-router-dom';

interface SettingsPageProps {
  user: User;
  subscription: Subscription | null;
  onUserUpdated: (u: User) => void;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  subscription,
  onUserUpdated,
  onLogout,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'account'>('profile');
  const [settingsSearch, setSettingsSearch] = useState('');

  // Profile form state
  const [name, setName] = useState(user.name);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Appearance state
  const [themeMode, setThemeMode] = useState<'dark' | 'oled' | 'midnight'>(
    (localStorage.getItem('novabuild_theme') as any) || 'dark'
  );

  // Danger zone modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sync tab from URL query param (?tab=appearance, etc.)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'appearance', 'security', 'account'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Ensure active theme is applied to documentElement on mount & keep in sync
  useEffect(() => {
    const current = (localStorage.getItem('novabuild_theme') as 'dark' | 'oled' | 'midnight') || 'dark';
    setThemeMode(current);
    document.documentElement.setAttribute('data-theme', current);
    document.body.setAttribute('data-theme', current);

    const handleThemeEvent = (e: any) => {
      if (e.detail?.theme) {
        setThemeMode(e.detail.theme);
      }
    };
    window.addEventListener('novabuild:theme-changed', handleThemeEvent);
    return () => window.removeEventListener('novabuild:theme-changed', handleThemeEvent);
  }, []);

  useEffect(() => {
    setName(user.name);
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSavingProfile) return;

    setIsSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const updated = await updateUserProfile({ name: name.trim() });
      onUserUpdated({ ...user, name: updated.name });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || isUpdatingPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    try {
      await updateUserProfile({ password: newPassword });
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleThemeChange = (mode: 'dark' | 'oled' | 'midnight') => {
    setThemeMode(mode);
    localStorage.setItem('novabuild_theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    document.body.setAttribute('data-theme', mode);
    window.dispatchEvent(new CustomEvent('novabuild:theme-changed', { detail: { theme: mode } }));
  };

  const handleResetData = async () => {
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      setResetModalOpen(false);
      onLogout();
    }, 1000);
  };

  const tabs = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: UserIcon,
      keywords: ['name', 'email', 'profile', 'user', 'display'],
    },
    {
      id: 'appearance' as const,
      label: 'Appearance',
      icon: Palette,
      keywords: ['theme', 'appearance', 'dark', 'oled', 'midnight', 'navy', 'color', 'palette'],
    },
    {
      id: 'security' as const,
      label: 'Security',
      icon: Shield,
      keywords: ['security', 'password', 'auth', 'credentials', 'token', 'lock'],
    },
    {
      id: 'account' as const,
      label: 'Account & Danger Zone',
      icon: AlertTriangle,
      keywords: ['account', 'danger', 'delete', 'reset', 'cache', 'logout', 'sign out'],
    },
  ];

  const filteredTabs = tabs.filter((tab) => {
    if (!settingsSearch.trim()) return true;
    const q = settingsSearch.toLowerCase();
    return (
      tab.label.toLowerCase().includes(q) ||
      tab.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSelectTab = (tabId: 'profile' | 'appearance' | 'security' | 'account') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Settings
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your personal account, security credentials, preferences, and workspace options.
          </p>
        </div>

        {/* Quick Settings Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={settingsSearch}
            onChange={(e) => {
              const val = e.target.value;
              setSettingsSearch(val);
              if (val.trim()) {
                const match = tabs.find(
                  (t) =>
                    t.label.toLowerCase().includes(val.toLowerCase()) ||
                    t.keywords.some((k) => k.toLowerCase().includes(val.toLowerCase()))
                );
                if (match) {
                  handleSelectTab(match.id);
                }
              }
            }}
            placeholder="Search settings (e.g. theme, password)..."
            className="w-full pl-8 pr-7 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent transition-colors"
          />
          {settingsSearch && (
            <button
              onClick={() => setSettingsSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <aside className="space-y-1">
          {filteredTabs.length === 0 ? (
            <div className="p-3 text-center text-xs text-text-secondary">
              <p>No tabs match "{settingsSearch}"</p>
              <button
                onClick={() => setSettingsSearch('')}
                className="mt-1 text-[#a78bfa] hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          ) : (
            filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-accent/15 text-[#c4b5fd] font-semibold border border-accent/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))
          )}

          <div className="pt-3 mt-3 border-t border-border/50">
            <Link
              to="/billing"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Billing & Plans</span>
              </span>
              <ExternalLink className="w-3 h-3 text-text-secondary/70" />
            </Link>
          </div>
        </aside>

        {/* Tab Content Panel */}
        <main className="md:col-span-3 space-y-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Profile Information
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Update your display name and view your registered email address.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3 text-xs bg-[#7950e8]/15 text-[#c4b5fd] border border-[#7950e8]/30 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#a78bfa]" />
                  Profile updated successfully.
                </div>
              )}

              {profileError && (
                <div className="p-3 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3 py-2 bg-surface-elevated/50 border border-border/50 rounded-lg text-xs text-text-secondary cursor-not-allowed"
                  />
                  <p className="text-[11px] text-text-secondary/70 mt-1">
                    Email is associated with your primary authentication account.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile || name === user.name}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Appearance & Theme
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Customize the interface colors and editor presentation across the entire platform.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'dark',
                    name: 'Charcoal Dark',
                    desc: 'Default dark surface with violet accents.',
                    headerBg: 'bg-[#12131c]',
                    bodyBg: 'bg-[#0f1015]',
                    border: 'border-[#262734]',
                  },
                  {
                    id: 'oled',
                    name: 'Pure OLED',
                    desc: 'Maximum contrast pitch black background.',
                    headerBg: 'bg-[#050507]',
                    bodyBg: 'bg-black',
                    border: 'border-[#1e1e24]',
                  },
                  {
                    id: 'midnight',
                    name: 'Midnight Navy',
                    desc: 'Deep navy developer console aesthetic.',
                    headerBg: 'bg-[#0e1422]',
                    bodyBg: 'bg-[#0b0f19]',
                    border: 'border-[#1f2c4a]',
                  },
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleThemeChange(t.id as any)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      themeMode === t.id
                        ? 'border-accent bg-surface-elevated ring-1 ring-accent shadow-sm'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div className={`w-full h-14 rounded-lg ${t.bodyBg} border ${t.border} mb-3 p-2 flex flex-col justify-between`}>
                      <div className={`h-3 w-full rounded ${t.headerBg} flex items-center px-1.5 gap-1`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7950e8]" />
                        <div className="w-8 h-1 rounded bg-white/20" />
                      </div>
                      <div className="flex gap-1.5">
                        <div className="h-4 w-12 rounded bg-white/10" />
                        <div className="h-4 w-6 rounded bg-[#7950e8]/30" />
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-text-primary flex items-center justify-between">
                      {t.name}
                      {themeMode === t.id && (
                        <span className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Security & Authentication
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Update your login password and manage active session tokens.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 text-xs bg-[#7950e8]/15 text-[#c4b5fd] border border-[#7950e8]/30 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#a78bfa]" />
                  Password updated successfully.
                </div>
              )}

              {passwordError && (
                <div className="p-3 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPassword}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isUpdatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'account' && (
            <div className="p-6 rounded-xl bg-surface border border-rose-500/20 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Irreversible actions regarding your account and stored workspaces.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated border border-border/80 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">
                    Sign Out on All Devices
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Revoke current session token and sign out immediately.
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-surface text-xs font-medium text-text-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-rose-400">
                    Reset Workspace Cache
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Clear local storage and refresh all cached project subscriptions.
                  </p>
                </div>
                <button
                  onClick={() => setResetModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition-colors"
                >
                  Reset Cache
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetData}
        title="Reset Local Cache"
        message="This will clear your locally cached tokens and log you out. Are you sure?"
        confirmText="Confirm Reset"
        isDestructive={true}
        isLoading={isResetting}
      />
    </div>
  );
};
