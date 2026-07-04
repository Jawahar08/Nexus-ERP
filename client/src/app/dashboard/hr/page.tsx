'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Calendar, ShieldCheck, Mail, DollarSign, 
  Printer, UserCheck, X, FileText, CheckCircle2, XCircle
} from 'lucide-react';

export default function HRPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    employees: [],
    leaves: []
  });

  // Action forms state
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', department: '', salary: 0, email: '' });

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState({ employeeId: '', startDate: '', endDate: '', reason: '' });

  // Print payslip state
  const [activePayslip, setActivePayslip] = useState<any>(null);

  const fetchHR = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        
        if (payload.employees.length > 0) {
          setLeaveRequest(prev => ({ ...prev, employeeId: payload.employees[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load HR details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHR();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEmp, action: 'employee' })
      });
      if (res.ok) {
        setShowAddEmployee(false);
        setNewEmp({ name: '', role: '', department: '', salary: 0, email: '' });
        fetchHR();
      }
    } catch (err) {
      alert('Failed to register employee');
    }
  };

  const handleToggleAttendance = async (employeeId: string, date: string, currentStatus: string | null) => {
    let nextStatus: string | null = 'present';
    if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'leave';
    else if (currentStatus === 'leave') nextStatus = null; // deletes log

    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'attendance',
          employeeId,
          date,
          status: nextStatus
        })
      });
      if (res.ok) {
        fetchHR();
      }
    } catch (err) {
      console.error('Failed to update attendance:', err);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leaveRequest, action: 'leave' })
      });
      if (res.ok) {
        setShowLeaveForm(false);
        setLeaveRequest({ employeeId: data.employees[0]?.id || '', startDate: '', endDate: '', reason: '' });
        fetchHR();
      }
    } catch (err) {
      alert('Failed to request leave');
    }
  };

  const handleProcessLeave = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/hr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchHR();
      }
    } catch (err) {
      alert('Failed to process leave approval');
    }
  };

  // Days mapping for attendance calendar display
  const daysOfWeek = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'];

  // Print Trigger
  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold">HR & Personnel Directory</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage personnel, track leave approvals, and print salary payslips.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowLeaveForm(true)}
            className="btn flex items-center gap-2 bg-slate-900 border border-[var(--border)] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
          >
            <Calendar size={14} />
            Apply Leave
          </button>
          <button 
            onClick={() => setShowAddEmployee(true)}
            className="btn flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer"
          >
            <Plus size={14} />
            Onboard Personnel
          </button>
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 no-print">
        
        {/* Personnel table list */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] xl:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-sm">Employee Directory & Attendance</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] h-10 uppercase tracking-wider font-bold">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-right">Salary</th>
                  <th className="pb-2 text-center">Attendance (July 1-5)</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp: any) => {
                  
                  // Construct map of attendance values
                  const attMap: any = {};
                  emp.attendances?.forEach((a: any) => {
                    attMap[a.date] = a.status;
                  });

                  return (
                    <tr key={emp.id} className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.01)] h-12 transition-colors">
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-white">{emp.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">{emp.role} &bull; {emp.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 rounded text-[10px]">
                          {emp.department}
                        </span>
                      </td>
                      <td className="text-right font-mono font-bold">${emp.salary.toLocaleString()}/mo</td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {daysOfWeek.map(date => {
                            const status = attMap[date] || null;
                            return (
                              <button
                                key={date}
                                onClick={() => handleToggleAttendance(emp.id, date, status)}
                                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] cursor-pointer transition ${
                                  status === 'present' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                                  status === 'absent' ? 'bg-red-950 text-red-400 border border-red-500/20' :
                                  status === 'leave' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' :
                                  'bg-slate-800 text-[var(--text-muted)] hover:bg-slate-700'
                                }`}
                                title={`${date}: ${status || 'No entry (click to toggle)'}`}
                              >
                                {status === 'present' ? 'P' :
                                 status === 'absent' ? 'A' :
                                 status === 'leave' ? 'L' : '-'}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setActivePayslip(emp)}
                          className="btn border border-[var(--border)] bg-slate-900 px-2.5 py-1 rounded text-[10px] font-semibold hover:bg-[var(--border)] text-white cursor-pointer transition flex items-center gap-1.5 ml-auto"
                        >
                          <Printer size={10} /> Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Requests sidebar */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <UserCheck size={16} className="text-[var(--primary)]" />
            Absence Approvals
          </h3>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px]">
            {data.leaves.map((l: any) => (
              <div key={l.id} className="border border-[var(--border)] bg-[rgba(255,255,255,0.01)] p-3 rounded-lg flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white">{l.employeeName}</span>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{l.startDate} to {l.endDate}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    l.status === 'approved' ? 'bg-emerald-950 text-emerald-400' :
                    l.status === 'rejected' ? 'bg-red-950 text-red-400' :
                    'bg-amber-950 text-amber-400'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] italic">Reason: "{l.reason}"</div>

                {l.status === 'pending' && (
                  <div className="flex gap-2 border-t border-[var(--border)] pt-2 mt-1">
                    <button
                      onClick={() => handleProcessLeave(l.id, 'approved')}
                      className="flex-1 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <CheckCircle2 size={10} /> Approve
                    </button>
                    <button
                      onClick={() => handleProcessLeave(l.id, 'rejected')}
                      className="flex-1 h-7 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <XCircle size={10} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ==========================================
          PRINTABLE SALARY PAYSLIP COMPONENT
         ========================================== */}
      {activePayslip && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-black max-w-lg w-full p-8 rounded-xl flex flex-col gap-6 relative shadow-2xl printable-area">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="font-extrabold text-xl tracking-tight text-slate-900">NEXUS GLOBAL ERP</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Corporate Accounting Division</p>
              </div>
              <button 
                onClick={() => setActivePayslip(null)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer no-print"
              >
                <X size={20} />
              </button>
            </div>

            {/* Employee metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-500">Employee Name:</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activePayslip.name}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Personnel ID:</span>
                <p className="font-mono text-slate-900 mt-0.5">{activePayslip.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Job Position:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activePayslip.role}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Department:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{activePayslip.department}</p>
              </div>
            </div>

            {/* Calculations breakdowns */}
            <div className="border-t border-slate-200 pt-4 flex flex-col gap-2.5 text-xs">
              <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Payroll metrics</h3>
              <div className="flex justify-between">
                <span>Base Gross Salary:</span>
                <span className="font-mono font-bold text-slate-900">${activePayslip.salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Deductions (15%):</span>
                <span className="font-mono font-bold text-slate-900">-${(activePayslip.salary * 0.15).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Healthcare allowance:</span>
                <span className="font-mono font-bold text-slate-900">+$250.00</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-3 font-extrabold text-sm">
                <span>Net Pay Credit:</span>
                <span className="font-mono text-slate-900">${(activePayslip.salary * 0.85 + 250).toLocaleString()}</span>
              </div>
            </div>

            {/* Footer row */}
            <div className="border-t border-dashed border-slate-300 pt-4 text-center text-[10px] text-slate-400 italic">
              Electronically generated by Nexus ERP Finance Module. Auto-audited and transaction reconciled.
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 no-print mt-4 pt-4 border-t border-slate-200">
              <button
                type="button" onClick={() => setActivePayslip(null)}
                className="btn border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="button" onClick={triggerPrint}
                className="btn bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
              >
                <Printer size={12} /> Print Statement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODALS
         ========================================== */}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Onboard Corporate Employee</h3>
            
            <form onSubmit={handleAddEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="input-label">Full Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Job Role Description</label>
                <input 
                  type="text" className="input-field" required placeholder="e.g. Systems Engineer"
                  value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Department</label>
                <input 
                  type="text" className="input-field" required placeholder="e.g. Operations"
                  value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Monthly Salary ($)</label>
                <input 
                  type="number" className="input-field font-mono" required
                  value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Email Contact</label>
                <input 
                  type="email" className="input-field font-mono" required
                  value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowAddEmployee(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Apply Sabbatical Leave</h3>
            
            <form onSubmit={handleAddLeave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="input-label">Select Employee</label>
                <select 
                  className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                  value={leaveRequest.employeeId} onChange={e => setLeaveRequest({...leaveRequest, employeeId: e.target.value})}
                >
                  {data.employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="input-label">Start Date</label>
                  <input 
                    type="date" className="input-field text-xs" required
                    value={leaveRequest.startDate} onChange={e => setLeaveRequest({...leaveRequest, startDate: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="input-label">End Date</label>
                  <input 
                    type="date" className="input-field text-xs" required
                    value={leaveRequest.endDate} onChange={e => setLeaveRequest({...leaveRequest, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Reason</label>
                <input 
                  type="text" className="input-field" required placeholder="e.g. Health engagement"
                  value={leaveRequest.reason} onChange={e => setLeaveRequest({...leaveRequest, reason: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowLeaveForm(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Apply Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
