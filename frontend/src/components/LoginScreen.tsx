import React, { useState } from 'react';
import { loginUser, registerUser } from '../api/client';
import { User } from '../types';
import { Sparkles, Terminal, Cpu, Zap, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: User;
      if (isRegister) {
        user = await registerUser(email, password, name);
      } else {
        user = await loginUser(email, password);
      }
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser: User = {
      userId: 'demo-user-123',
      email: 'demo@novabuild.ai',
      name: 'Demo Creator',
      role: 'ROLE_USER',
      token: 'demo-jwt-token-novabuild-2026',
    };
    localStorage.setItem('novabuild_token', demoUser.token!);
    localStorage.setItem('novabuild_user', JSON.stringify(demoUser));
    onSuccess(demoUser);
  };

  return (
    <div className="min-h-screen w-screen bg-[#090a0d] flex flex-col justify-between text-gray-100 overflow-y-auto custom-scrollbar">
      {/* Top Header */}
      <header className="px-8 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Nova<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">Build</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Microservice Cluster Online</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 grid lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Side: Product Showcase */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Powered Full Stack App Builder</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
            Build production apps with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400">
              Natural Language Prompts.
            </span>
          </h1>

          <p className="text-gray-400 text-base max-w-xl leading-relaxed">
            NovaBuild combines Spring Boot microservices, LLM code generation, real-time WebFlux streaming, and dynamic Docker sandbox previews.
          </p>

          {/* Key Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#12141a] border border-[#222530] p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-200">AI Prompt Engine</h3>
              <p className="text-xs text-gray-400">Generates components, hooks & full app code structures instantly.</p>
            </div>

            <div className="bg-[#12141a] border border-[#222530] p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-200">Live Preview Sandbox</h3>
              <p className="text-xs text-gray-400">Dynamically spins up isolated preview containers per project.</p>
            </div>

            <div className="bg-[#12141a] border border-[#222530] p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-200">Enterprise Security</h3>
              <p className="text-xs text-gray-400">Stateless JWT Auth, Kafka Event Streaming & Microservice Gateway.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login / Registration Form */}
        <div className="lg:col-span-5">
          <div className="bg-[#13151c] border border-[#242733] rounded-2xl p-8 shadow-2xl shadow-purple-950/20 relative">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white">
                {isRegister ? 'Create Your Account' : 'Sign in to NovaBuild'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isRegister
                  ? 'Enter your details to create a new workspace'
                  : 'Access your AI app builder projects and live sandbox previews'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2.5 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditya Bharde"
                    className="w-full bg-[#0a0b0e] border border-[#292d3b] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@novabuild.ai"
                  className="w-full bg-[#0a0b0e] border border-[#292d3b] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0b0e] border border-[#292d3b] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-pink-600/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Access Option */}
            <div className="mt-4 pt-4 border-t border-[#20232e]">
              <button
                onClick={handleDemoLogin}
                className="w-full bg-[#1b1e29] hover:bg-[#252938] border border-[#2d3142] text-gray-300 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Explore Demo Mode Immediately</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-pink-400 hover:text-pink-300 font-medium transition"
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#181a24] text-center text-xs text-gray-500">
        NovaBuild Microservice System © 2026. Powered by Spring Boot, Kafka, WebFlux & Docker API.
      </footer>
    </div>
  );
};
