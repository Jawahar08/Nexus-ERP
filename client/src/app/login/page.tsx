'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      // Save user payload to localStorage for UI layouts
      localStorage.setItem('nexus_user', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'System failed to contact authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#07090e] overflow-hidden p-6">
      {/* Background blobs */}
      <div className="absolute top-[20%] left-[20%] w-[350px] height-[350px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(99,102,241,0)_70%)] blur-[40px] animate-pulse" />
      <div className="absolute bottom-[20%] right-[20%] w-[400px] height-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(6,182,212,0)_70%)] blur-[50px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Login Card */}
      <div className="glass w-full max-w-[450px] p-10 rounded-2xl flex flex-col gap-6 relative z-10 border border-[var(--border)] shadow-[0_0_30px_rgba(99,102,241,0.08)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-glow)] border border-[var(--border)] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] mb-4">
            <Sparkles size={24} className="text-[var(--primary)]" />
          </div>
          <h2 className="font-bold text-2xl tracking-wide">
            NEXUS <span className="text-[var(--primary)]">ERP</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Enterprise Resource Planning Portal</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--danger-glow)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-xs text-[var(--danger)]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="input-label">Corporate Email</label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-[var(--text-muted)]" />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="e.g. admin@nexus.erp"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="input-label">Workspace Password</label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-[var(--text-muted)]" />
              <input
                type="password"
                className="input-field pl-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 mt-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 text-white font-medium text-sm rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Authenticating Session...' : 'Access Portal'}
          </button>
        </form>

        {/* Credentials guide panel */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-lg p-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center block">
            Sandbox Testing Profiles
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)] font-mono">
            <div>
              <span className="text-[var(--primary)]">Admin:</span> admin@nexus.erp
            </div>
            <div>
              <span className="text-[var(--primary)]">HR:</span> hr@nexus.erp
            </div>
            <div>
              <span className="text-[var(--primary)]">Finance:</span> finance@nexus.erp
            </div>
            <div>
              <span className="text-[var(--primary)]">Sales:</span> sales@nexus.erp
            </div>
            <div className="col-span-2 text-center mt-1 border-t border-[var(--border)] pt-2">
              Password: <code className="text-white bg-slate-800 px-1 rounded">password123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
