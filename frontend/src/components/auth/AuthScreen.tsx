import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { loginUser, registerUser, getBasePath } from '../../api/client';
import './AuthScreen.css';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
  mode?: 'login' | 'signup';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, mode }) => {
  const location = useLocation();
  const isSignup = mode ? mode === 'signup' : location.pathname.endsWith('/signup');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear errors when navigating between login and signup
  useEffect(() => {
    setError(null);
  }, [isSignup, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        if (!name.trim()) {
          throw new Error('Please enter your name');
        }
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

  const viteLogo = `${getBasePath()}/vite.svg`.replace(/^\/\//, '/');

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand / Logo */}
        <div className="auth-header">
          <Link to="/" className="auth-logo-link" aria-label="NovaBuild home" title="Back to home">
            <img
              src={viteLogo}
              alt="NovaBuild"
              className="auth-logo-icon"
              width="36"
              height="36"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/vite.svg';
              }}
            />
          </Link>
          <h1 className="auth-title">
            {isSignup ? 'Create your account.' : 'Welcome back.'}
          </h1>
          <p className="auth-subtitle">
            {isSignup ? 'Get started with NovaBuild.' : 'Sign in to continue.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoFocus={isSignup}
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <input
                id="auth-email"
                type="email"
                required
                autoFocus={!isSignup}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input auth-input-password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="auth-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="auth-toggle-icon" />
                ) : (
                  <Eye className="auth-toggle-icon" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="auth-spinner" />
                <span>{isSignup ? 'Creating account...' : 'Signing in...'}</span>
              </>
            ) : (
              <span>{isSignup ? 'Create account' : 'Sign in'}</span>
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <div className="auth-footer">
          {isSignup ? (
            <>
              Already have an account?
              <Link to="/login" className="auth-switch-link">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don't have an account?
              <Link to="/signup" className="auth-switch-link">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
