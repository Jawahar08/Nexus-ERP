'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Package, Users, Briefcase, Coins, ShieldCheck, 
  Sun, Moon, Bell, Shield, LogOut, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Info, Sparkles
} from 'lucide-react';

// Context for child routes to share active state and trigger updates
interface DashboardContextType {
  user: { id: string; name: string; email: string; role: string; tenantId: string; tenantName: string } | null;
  notifications: any[];
  refreshNotifications: () => Promise<void>;
  changeRole: (role: string) => Promise<void>;
  matrix: any;
  refreshMatrix: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardLayout');
  return ctx;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [matrix, setMatrix] = useState<any>({});

  // 1. Fetch user data on mount
  useEffect(() => {
    const stored = localStorage.getItem('nexus_user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      router.push('/login');
    }
  }, [router]);

  // 2. Fetch Notifications and RBAC matrix
  const refreshNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const refreshMatrix = async () => {
    try {
      const res = await fetch('/api/admin/permissions');
      if (res.ok) {
        const data = await res.json();
        setMatrix(data);
      }
    } catch (err) {
      console.error('Failed to load RBAC permissions:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();
      refreshMatrix();
    }
  }, [user]);

  // 3. Switch User role (helper for testing multi-role environments)
  const changeRole = async (role: string) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (!res.ok) throw new Error('Failed to swap role');
      const data = await res.json();
      
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Send message event to refresh all sub-pages
      window.dispatchEvent(new Event('refresh-dashboard-data'));

      router.refresh();
    } catch (error) {
      alert('Role switch failed');
    }
  };

  // 4. Log out helper
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('nexus_user');
    router.push('/login');
  };

  // 5. Dismiss alert
  const dismissNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshNotifications();
      }
    } catch (err) {
      console.error('Failed to clear alert:', err);
    }
  };

  // Navigation Items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', key: 'dashboard' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/dashboard/inventory', key: 'inventory' },
    { id: 'crm', label: 'CRM & Sales', icon: Users, path: '/dashboard/crm', key: 'crm' },
    { id: 'hr', label: 'HR & Payroll', icon: Briefcase, path: '/dashboard/hr', key: 'hr' },
    { id: 'finance', label: 'Finance', icon: Coins, path: '/dashboard/finance', key: 'finance' },
    { id: 'workflows', label: 'Approval Desk', icon: CheckCircle2, path: '/dashboard/workflows', key: 'workflows' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, path: '/dashboard/admin', key: 'admin' },
  ];

  // RBAC Access validation
  const userRole = user?.role || 'Admin';
  const rolePermissions = matrix[userRole] || { dashboard: true, inventory: true, crm: true, hr: true, finance: true, admin: true };

  const allowedItems = menuItems.filter(item => {
    if (item.id === 'workflows') {
      return userRole === 'Admin' || userRole === 'Manager' || userRole === 'Finance';
    }
    return rolePermissions[item.key as keyof typeof rolePermissions];
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-[var(--success)]" />;
      case 'warning': return <AlertTriangle size={16} className="text-[var(--warning)]" />;
      case 'danger': return <XCircle size={16} className="text-[var(--danger)]" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  if (!user) return null;

  return (
    <DashboardContext.Provider value={{
      user, notifications, refreshNotifications, changeRole, matrix, refreshMatrix, dismissNotification
    }}>
      <div className="flex min-h-screen bg-[#07090e] text-[var(--text-main)]">
        
        {/* ==========================================
            SIDEBAR NAVIGATION
           ========================================== */}
        <aside className={`glass-static border-r border-[var(--border)] flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
          <div>
            {/* Header row */}
            <div className="h-16 border-b border-[var(--border)] flex items-center justify-between px-4">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--primary)]" />
                  <span className="font-bold text-sm tracking-widest text-[var(--text-main)]">NEXUS ERP</span>
                </div>
              )}
              {collapsed && (
                <Sparkles size={18} className="mx-auto text-[var(--primary)]" />
              )}
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="text-[var(--text-muted)] hover:text-white border border-[var(--border)] hover:bg-[var(--border)] rounded p-1 transition cursor-pointer"
              >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            {/* Tenant details */}
            <div className="p-4 border-b border-[var(--border)] bg-[rgba(255,255,255,0.01)]">
              {!collapsed ? (
                <div>
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Tenant Organization</div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">{user.tenantName}</div>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-center text-[var(--primary)]">ORG</div>
              )}
            </div>

            {/* Navigation links */}
            <nav className="p-3">
              <ul className="flex flex-col gap-1.5">
                {allowedItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                          isActive 
                            ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                            : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--border)]'
                        }`}
                      >
                        <item.icon size={18} className="shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* User profile section */}
          <div className="p-4 border-t border-[var(--border)]">
            {!collapsed ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--primary-glow)] border border-[var(--border)] flex items-center justify-center font-bold text-sm text-[var(--primary)] shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</div>
                  </div>
                </div>

                {/* Quick Role switcher */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Sandbox Profile</label>
                  <select 
                    value={user.role}
                    onChange={(e) => changeRole(e.target.value)}
                    className="w-full h-8 bg-slate-900 border border-[var(--border)] rounded text-xs text-white px-2 focus:outline-none"
                  >
                    {Object.keys(matrix).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogout}
                className="w-9 h-9 rounded-full bg-[var(--border)] hover:bg-red-950 hover:text-red-400 flex items-center justify-center transition cursor-pointer mx-auto"
                title="Log Out Session"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </aside>

        {/* ==========================================
            MAIN HEADER & CONTENT WORKSPACE
           ========================================== */}
        <div className="flex-1 flex flex-col min-w-0">
          
          <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[rgba(10,14,23,0.5)] backdrop-blur">
            <h1 className="text-lg font-bold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>

            <div className="flex items-center gap-4">
              
              {/* Alert Bell Panel */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--border)] transition cursor-pointer relative"
                >
                  <Bell size={18} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                  )}
                </button>

                {showNotifications && (
                  <div className="glass absolute right-0 mt-3 w-80 p-4 rounded-xl z-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                      <span className="font-bold text-xs">Real-time alerts ({notifications.filter(n => !n.read).length})</span>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className="flex gap-2 p-2 rounded bg-slate-900 border border-[var(--border)] text-[11px] justify-between items-start">
                            <div className="flex gap-2">
                              <span className="mt-0.5">{getNotifIcon(n.type)}</span>
                              <span>{n.message}</span>
                            </div>
                            <button 
                              onClick={() => dismissNotification(n.id)}
                              className="text-[var(--text-muted)] hover:text-red-400 cursor-pointer text-xs"
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-[var(--text-muted)] py-4 text-xs">No notifications.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Identity Indicators */}
              <div className="flex items-center gap-2 border border-[var(--border)] bg-[var(--primary-glow)] rounded-lg px-3.5 py-1.5">
                <Shield size={14} className="text-[var(--primary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {user.role}
                </span>
                <button 
                  onClick={handleLogout}
                  className="ml-3 hover:text-red-400 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>

            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
