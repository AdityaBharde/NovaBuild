import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../api/client';
import { Layers, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await registerUser(email, password, name);
        onSuccess(user);
      } else {
        const user = await loginUser(email, password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-surface-elevated rounded-xl border border-border flex items-center justify-center shadow-sm">
            <Layers className="w-6 h-6 text-accent" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              {isRegister ? 'Create an account' : 'Log in to NovaBuild'}
            </h1>
            <p className="text-sm text-text-secondary">
              {isRegister ? 'Enter your details below to get started.' : 'Welcome back to your workspace.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors shadow-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-text-primary hover:bg-white text-background font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
          >
            {loading ? 'Continuing...' : 'Continue'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
