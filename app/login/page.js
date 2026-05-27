'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden">
      {/* Dynamic Background Highlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-klader-peach/10 blur-[120px] animate-pulse-subtle"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-klader-burgundy/10 blur-[120px] animate-pulse-subtle" style={{ animationDelay: '1.5s' }}></div>

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md relative z-10 glass-panel rounded-3xl overflow-hidden shadow-2xl p-8 border border-white/40">
        
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 mb-3 drop-shadow-sm">
            <Image 
              src="/logo.svg" 
              alt="Klader Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="font-display font-semibold text-2xl text-klader-burgundy tracking-wide leading-none">Klader</h2>
          <p className="text-slate-400 font-display text-[10px] uppercase font-bold tracking-widest mt-2">Business Management ERP</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl animate-fade-in-up text-sm">
            <AlertCircle size={18} className="shrink-0 text-klader-crimson" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username / User ID</label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-11 pr-4 py-3 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-klader-burgundy/40 bg-white/50 focus:bg-white transition-all text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-slate-400" size={16} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-11 pr-4 py-3 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-klader-burgundy/40 bg-white/50 focus:bg-white transition-all text-slate-800"
                required
              />
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="rounded text-klader-burgundy focus:ring-klader-burgundy/20 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium">Remember my login</span>
            </label>
            <a href="#" className="font-semibold text-klader-burgundy hover:text-klader-crimson transition-colors">Forgot password?</a>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-klader-burgundy via-klader-crimson to-klader-peach text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-klader-burgundy/10 active:scale-[0.98] transition-all text-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Securing Session...' : 'Sign In'}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-slate-400">
          <p>© 2026 Klader Fashion. All rights reserved.</p>
          <p className="mt-1 font-medium text-slate-300">Target host: klader.life</p>
        </div>
      </div>
    </div>
  );
}
