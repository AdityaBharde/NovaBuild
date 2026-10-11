import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { loginUser, registerUser } from '../../api/client';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your name');
        const user = await registerUser(email.trim(), password, name.trim());
        onSuccess(user);
      } else {
        const user = await loginUser(email.trim(), password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-background font-sans text-text-primary antialiased relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm p-8 rounded-2xl bg-surface border border-border/80 shadow-2xl relative z-10 animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Nova<span className="text-accent">Build</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {isRegister
              ? 'Create your developer account'
              : 'Sign in to access your AI workspaces'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg mb-4 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm shadow-accent/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-text-secondary hover:text-accent transition-colors font-medium"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
