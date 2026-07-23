'use client';

import React, { useState } from 'react';
import { QrCode, CheckCircle2, UserCheck, Clock, MapPin, Smartphone, ShieldCheck } from 'lucide-react';

export default function QRAttendanceTerminal({
  employees,
  onClockInSuccess,
}: {
  employees: any[];
  onClockInSuccess?: () => void;
}) {
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [clockStatus, setClockStatus] = useState<'present' | 'absent'>('present');
  const [clockingLoading, setClockingLoading] = useState(false);
  const [recentLog, setRecentLog] = useState<any>(null);

  const handleClockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    setClockingLoading(true);
    try {
      const res = await fetch('/api/hr/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          status: clockStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecentLog(data);
        alert(`Attendance Clocked! ${data.employeeName} marked ${data.status.toUpperCase()} at ${data.timestamp}.`);
        if (onClockInSuccess) onClockInSuccess();
      }
    } catch (err) {
      alert('Clock-in failed');
    } finally {
      setClockingLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* LEFT COL: Store Terminal QR Code Display */}
      <div className="glass p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/80 flex flex-col items-center text-center justify-between gap-5 relative overflow-hidden">
        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <QrCode size={20} className="text-indigo-400" />
            <h3 className="font-extrabold text-base text-white">Store Mobile QR Attendance Terminal</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Scan this dynamic QR Code with your smartphone camera to clock in automatically.
          </p>
        </div>

        {/* Dynamic Simulated QR Visual */}
        <div className="p-4 bg-white rounded-2xl border-4 border-indigo-500/30 shadow-2xl relative group">
          <div className="w-48 h-48 bg-slate-950 rounded-xl p-3 flex flex-col justify-between items-center relative overflow-hidden">
            <div className="grid grid-cols-6 gap-1 w-full h-full opacity-90">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${
                    (i * 7) % 3 === 0 ? 'bg-indigo-400' : (i * 3) % 2 === 0 ? 'bg-purple-400' : 'bg-slate-900'
                  }`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-1 rounded-md shadow-lg border border-white/20">
                NEXUS-ATTEND
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
          <Smartphone size={14} className="text-indigo-400 animate-pulse" />
          <span>Camera Scanner Active &bull; Store Geofence Verified</span>
        </div>
      </div>

      {/* RIGHT COL: Terminal Manual Clock-In Selector */}
      <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/80 flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-400" />
              Terminal Attendance Dispatch
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select employee profile to record instant attendance status.
            </p>
          </div>

          <form onSubmit={handleClockInSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase">Select Employee</label>
              <select
                className="w-full h-10 bg-slate-900 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase">Attendance Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setClockStatus('present')}
                  className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                    clockStatus === 'present'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white/5 text-zinc-400 border-white/10'
                  }`}
                >
                  <CheckCircle2 size={14} /> Mark Present
                </button>
                <button
                  type="button"
                  onClick={() => setClockStatus('absent')}
                  className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                    clockStatus === 'absent'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-white/5 text-zinc-400 border-white/10'
                  }`}
                >
                  Mark Absent
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={clockingLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Clock size={15} />
              {clockingLoading ? 'Logging Clock-In...' : 'Record Attendance Log'}
            </button>
          </form>
        </div>

        {recentLog && (
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> Logged: <strong>{recentLog.employeeName}</strong> ({recentLog.status.toUpperCase()})
            </span>
            <span className="text-[10px] text-zinc-400">{recentLog.timestamp}</span>
          </div>
        )}
      </div>

    </div>
  );
}
