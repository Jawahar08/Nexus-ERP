'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Calendar, ShieldCheck, Mail, DollarSign, 
  Printer, UserCheck, X, FileText, CheckCircle2, XCircle, Trophy, QrCode
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import StaffCommissionsHub from '@/components/hr/StaffCommissionsHub';
import QRAttendanceTerminal from '@/components/hr/QRAttendanceTerminal';

type HRTab = 'directory' | 'commissions' | 'qr-attendance';

export default function HRPage() {
  const { formatAmount, currentCountry } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HRTab>('directory');
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
      {/* Controls row */}
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[#14171F] no-print">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#14171F]">Human Resources & Staff Payroll</h2>
          <p className="text-xs text-[#4F5565] font-medium mt-0.5">Personnel directory, July 1-5 attendance logs, absence approvals, sales commissions, and printable 80mm payslips.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab(activeTab === 'qr-attendance' ? 'directory' : 'qr-attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
              activeTab === 'qr-attendance' ? 'bg-[#14171F] text-white border-[#14171F] shadow-sm' : 'bg-[#FAF7F2] border-[#14171F]/10 text-[#5C64ED] hover:bg-white'
            }`}
          >
            <QrCode size={14} />
            {activeTab === 'qr-attendance' ? 'Back to HR Directory' : 'QR Scanner Kiosk Terminal'}
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'commissions' ? 'directory' : 'commissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
              activeTab === 'commissions' ? 'bg-purple-700 text-white border-purple-700 shadow-sm' : 'bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <Trophy size={14} />
            {activeTab === 'commissions' ? 'Back to HR Directory' : 'Sales Commissions Engine'}
          </button>
          <button 
            onClick={() => setShowLeaveForm(true)}
            className="flex items-center gap-2 bg-[#FAF7F2] border border-[#14171F]/10 px-4 py-2 rounded-full text-xs font-bold text-[#14171F] hover:bg-white transition cursor-pointer shadow-xs"
          >
            <Calendar size={14} className="text-[#5C64ED]" />
            Request Absence
          </button>
          <button 
            onClick={() => setShowAddEmployee(true)}
            className="flex items-center gap-2 bg-[#5C64ED] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#4B52D9] transition cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            Register Staff
          </button>
        </div>
      </div>

      {activeTab === 'qr-attendance' ? (
        <QRAttendanceTerminal employees={data.employees} onClockInSuccess={fetchHR} />
      ) : activeTab === 'commissions' ? (
        <StaffCommissionsHub />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-[#14171F]">
        
        {/* Personnel table list */}
        <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs xl:col-span-2 flex flex-col gap-4 text-[#14171F]">
          <h3 className="font-serif font-bold text-base text-[#14171F]">Employee Directory & Attendance</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#14171F]/10 text-[#4F5565] h-10 uppercase tracking-wider font-bold font-mono">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-right">Salary</th>
                  <th className="pb-2 text-center">Attendance (July 1-5)</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14171F]/5 text-[#14171F]">
                {data.employees.map((emp: any) => {
                  
                  // Construct map of attendance values
                  const attMap: any = {};
                  emp.attendances?.forEach((a: any) => {
                    attMap[a.date] = a.status;
                  });

                  return (
                    <tr key={emp.id} className="hover:bg-[#FAF7F2]/60 h-14 transition-colors">
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#14171F]">{emp.name}</span>
                          <span className="text-[10px] text-[#4F5565] font-mono">{emp.role} &bull; {emp.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="bg-[#FAF7F2] border border-[#14171F]/10 text-[#14171F] px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                          {emp.department}
                        </span>
                      </td>
                      <td className="text-right font-mono font-bold text-[#5C64ED]">{formatAmount(emp.salary)}/mo</td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {daysOfWeek.map(date => {
                            const status = attMap[date] || null;
                            return (
                              <button
                                key={date}
                                onClick={() => handleToggleAttendance(emp.id, date, status)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] cursor-pointer transition font-mono ${
                                  status === 'present' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                  status === 'absent' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                  status === 'leave' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                  'bg-[#FAF7F2] text-[#4F5565] hover:bg-white border border-[#14171F]/10'
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
                          className="border border-[#14171F]/10 bg-[#14171F] hover:bg-[#202532] px-3.5 py-1.5 rounded-full text-[10px] font-bold text-white cursor-pointer transition flex items-center gap-1.5 ml-auto shadow-xs"
                        >
                          <Printer size={12} /> Payslip
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
        <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col gap-4 text-[#14171F]">
          <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
            <UserCheck size={16} className="text-[#5C64ED]" />
            Absence Approvals
          </h3>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px]">
            {data.leaves.map((l: any) => (
              <div key={l.id} className="border border-[#14171F]/10 bg-[#FAF7F2] p-3.5 rounded-2xl flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-[#14171F]">{l.employeeName}</span>
                    <div className="text-[10px] text-[#4F5565] font-mono mt-0.5">{l.startDate} to {l.endDate}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border ${
                    l.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    l.status === 'rejected' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <div className="text-[10px] text-[#4F5565] italic font-medium">Reason: "{l.reason}"</div>

                {l.status === 'pending' && (
                  <div className="flex gap-2 border-t border-[#14171F]/10 pt-2 mt-1">
                    <button
                      onClick={() => handleProcessLeave(l.id, 'approved')}
                      className="flex-1 h-8 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleProcessLeave(l.id, 'rejected')}
                      className="flex-1 h-8 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
      )}

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
                <span className="font-mono font-bold text-slate-900">{formatAmount(activePayslip.salary)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Deductions (15%):</span>
                <span className="font-mono font-bold text-slate-900">-{formatAmount(activePayslip.salary * 0.15)}</span>
              </div>
              <div className="flex justify-between">
                <span>Healthcare allowance:</span>
                <span className="font-mono font-bold text-slate-900">+{formatAmount(250)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-3 font-extrabold text-sm">
                <span>Net Pay Credit:</span>
                <span className="font-mono text-slate-900">{formatAmount(activePayslip.salary * 0.85 + 250)}</span>
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
                <label className="input-label">Monthly Salary ({currentCountry.symbol})</label>
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
