'use client';

import React from 'react';
import { useDashboard } from '../layout';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';

export default function AdminPage() {
  const { user, matrix, refreshMatrix } = useDashboard();

  const roles = Object.keys(matrix);
  const modules = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'crm', label: 'CRM & Sales' },
    { key: 'hr', label: 'HR & Personnel' },
    { key: 'finance', label: 'Finance Ledger' },
    { key: 'admin', label: 'Admin Panel' }
  ];

  const handleTogglePermission = async (role: string, module: string, currentValue: boolean) => {
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          module,
          value: !currentValue
        })
      });

      if (res.ok) {
        refreshMatrix();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to adjust permission');
      }
    } catch (err) {
      alert('Network permission update failure');
    }
  };

  const activeRoleRowStyle = {
    background: 'var(--primary-glow)',
    borderLeft: '3px solid var(--primary)'
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header controls */}
      <div>
        <h2 className="text-xl font-bold">Workspace RBAC Matrix</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure role-based access controls dynamically across all workspace systems.</p>
      </div>

      {/* Access Information banner */}
      <div className="flex items-start gap-3 bg-[var(--primary-glow)] border border-indigo-500/20 rounded-xl p-4 text-xs text-[var(--text-main)]">
        <Info size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Security Protocol Gateways:</strong> Adjusting checks here immediately binds server-side middlewares. Any client-side tabs that are disabled will be locked, and attempting direct endpoint requests will return <code>403 Forbidden</code> errors. Modifying permissions generates audit trails.
        </div>
      </div>

      {/* Permissions Matrix card */}
      <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--primary)]" />
          Module Privilege Matrix
        </h3>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] h-10 uppercase tracking-wider font-bold">
                <th className="pb-2 pl-3">Workspace Role</th>
                {modules.map(m => (
                  <th key={m.key} className="pb-2 text-center">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => {
                const isUserRole = role === user?.role;
                return (
                  <tr 
                    key={role} 
                    className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.01)] h-14 transition-colors"
                    style={isUserRole ? activeRoleRowStyle : {}}
                  >
                    <td className="font-bold text-white pl-3">
                      <div className="flex items-center gap-2">
                        <span>{role}</span>
                        {isUserRole && (
                          <span className="bg-indigo-950 text-indigo-400 border border-indigo-800/30 text-[9px] px-1.5 py-0.5 rounded font-bold">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {modules.map(mod => {
                      const isChecked = matrix[role]?.[mod.key] || false;
                      return (
                        <td key={mod.key} className="text-center">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] bg-slate-950 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(role, mod.key, isChecked)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
