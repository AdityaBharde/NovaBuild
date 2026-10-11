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
} from 'lucide-react';
import { User, Subscription } from '../../types';
import { updateUserProfile, getCurrentUserProfile } from '../../api/client';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Link } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'account'>('profile');

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
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account & Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-border/60">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Manage your personal account, security credentials, preferences, and workspace options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <aside className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}

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
                <div className="p-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
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
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                  Customize the interface colors and editor presentation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'dark',
                    name: 'Charcoal Dark',
                    desc: 'Linear-inspired dark surface with violet accents.',
                    bg: 'bg-[#101114]',
                  },
                  {
                    id: 'oled',
                    name: 'Pure OLED',
                    desc: 'Maximum contrast pure black background.',
                    bg: 'bg-black',
                  },
                  {
                    id: 'midnight',
                    name: 'Midnight Navy',
                    desc: 'Deep navy developer console aesthetic.',
                    bg: 'bg-[#0b0f19]',
                  },
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleThemeChange(t.id as any)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      themeMode === t.id
                        ? 'border-accent bg-surface-elevated shadow-sm'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg ${t.bg} border border-border/60 mb-3`} />
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
                <div className="p-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
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
