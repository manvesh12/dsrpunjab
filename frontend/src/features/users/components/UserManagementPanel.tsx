import React, { useState, useRef } from 'react';
import {
  Users, Plus, Upload, Search, Shield, ChevronDown,
  MapPin, CheckCircle, XCircle, Clock, AlertCircle, Download, X,
  Eye, UserCheck, RefreshCw, Lock, Send,
} from 'lucide-react';
import { useAuthStore, SEED_USERS } from '../../../stores/authStore';
import type { UserRole } from '../../../types/auth.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  district: string;
  department?: string;
  designation?: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  canUpload: boolean;
  canReview: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PUNJAB_DISTRICTS = [
  'All', 'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib',
  'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar',
  'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Pathankot',
  'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur',
  'Shaheed Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran',
];

const ALL_ROLES: UserRole[] = [
  'Super Admin', 'State Admin', 'District Admin', 'Survey Lead',
  'Field Surveyor', 'Data Entry', 'GIS Expert', 'Geologist',
  'Environment', 'Reviewer', 'Approver', 'Auditor',
];

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  'Super Admin':    { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-700/50' },
  'State Admin':    { bg: 'bg-blue-900/40',   text: 'text-blue-300',   border: 'border-blue-700/50' },
  'District Admin': { bg: 'bg-indigo-900/40', text: 'text-indigo-300', border: 'border-indigo-700/50' },
  'Survey Lead':    { bg: 'bg-cyan-900/40',   text: 'text-cyan-300',   border: 'border-cyan-700/50' },
  'Field Surveyor': { bg: 'bg-teal-900/40',   text: 'text-teal-300',   border: 'border-teal-700/50' },
  'Data Entry':     { bg: 'bg-green-900/40',  text: 'text-green-300',  border: 'border-green-700/50' },
  'GIS Expert':     { bg: 'bg-lime-900/40',   text: 'text-lime-300',   border: 'border-lime-700/50' },
  'Geologist':      { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-700/50' },
  'Environment':    { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-700/50' },
  'Reviewer':       { bg: 'bg-rose-900/40',   text: 'text-rose-300',   border: 'border-rose-700/50' },
  'Approver':       { bg: 'bg-red-900/40',    text: 'text-red-300',    border: 'border-red-700/50' },
  'Auditor':        { bg: 'bg-slate-800/60',  text: 'text-slate-300',  border: 'border-slate-600/50' },
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700/40' },
  pending:   { label: 'Pending',   icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-900/30 border-amber-700/40' },
  suspended: { label: 'Suspended', icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-900/30 border-red-700/40' },
};

function useSeedUsers(): PortalUser[] {
  return SEED_USERS.map((u, i) => ({
    ...u,
    mobile: `98765${String(i).padStart(5, '0')}`,
    department: 'Mines & Geology Department',
    designation: u.role,
    status: i === 2 ? 'pending' : i === 4 ? 'suspended' : 'active',
    joinedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canUpload: ['Super Admin', 'State Admin', 'District Admin', 'Survey Lead', 'Field Surveyor', 'GIS Expert', 'Geologist', 'Environment'].includes(u.role),
    canReview: ['Super Admin', 'State Admin', 'Reviewer', 'Approver', 'Auditor'].includes(u.role),
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <Shield size={9} />
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: PortalUser['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600', 'bg-indigo-600'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} ${colors[colorIdx]} rounded-full flex items-center justify-center font-black text-white shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: (user: PortalUser) => void;
}

function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', department: '', designation: '',
    district: '', role: '' as UserRole | '', state: 'Punjab',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.district) errs.district = 'District is required';
    if (!form.role) errs.role = 'Role is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSuccess({
        id: String(Date.now()),
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        role: form.role as UserRole,
        district: form.district,
        department: form.department,
        designation: form.designation,
        status: 'pending',
        joinedAt: new Date().toISOString().split('T')[0],
        canUpload: false,
        canReview: false,
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/20 border border-blue-600/30 rounded-xl flex items-center justify-center">
              <UserCheck size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Invite Single User</h3>
              <p className="text-xs text-slate-400 font-medium">An invitation email will be sent</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input
                type="text" value={form.name} onChange={e => set('name', e.target.value)}
                className={`w-full bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-700'} text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-600`}
                placeholder="Officer's full name"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className={`w-full bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-slate-700'} text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-600`}
                placeholder="user@domain.gov.in"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
              <input
                type="text" value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-600"
                placeholder="Mines & Geology"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
              <input
                type="text" value={form.designation} onChange={e => set('designation', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-600"
                placeholder="SDO / AXEN etc."
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">State</label>
              <input
                type="text" value={form.state} readOnly
                className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-xl px-4 py-2.5 text-sm font-medium cursor-not-allowed"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile (Optional)</label>
              <input
                type="text" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-600"
                placeholder="10-digit number"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">District *</label>
              <select
                value={form.district} onChange={e => set('district', e.target.value)}
                className={`w-full bg-slate-800 border ${errors.district ? 'border-red-500' : 'border-slate-700'} text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium`}
              >
                <option value="">Select district</option>
                {PUNJAB_DISTRICTS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role *</label>
              <select
                value={form.role} onChange={e => set('role', e.target.value)}
                className={`w-full bg-slate-800 border ${errors.role ? 'border-red-500' : 'border-slate-700'} text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium`}
              >
                <option value="">Select role</option>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all hover:border-slate-500">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25"
          >
            {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Invite Modal ────────────────────────────────────────────────────────

interface BulkInviteResult {
  success: number;
  failed: { row: number; email: string; reason: string }[];
}

function BulkInviteModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkInviteResult | null>(null);

  const handleFile = (f: File) => {
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      setFile(f);
    } else {
      alert('Please upload a .csv or .xlsx file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleProcess = () => {
    if (!file) return;
    setIsProcessing(true);
    setTimeout(() => {
      // Simulate processing
      setResult({
        success: 7,
        failed: [
          { row: 3, email: 'invalid-email', reason: 'Invalid email format' },
          { row: 6, email: 'existing@dsr.gov.in', reason: 'User already exists' },
        ],
      });
      setIsProcessing(false);
    }, 2000);
  };

  const downloadTemplate = () => {
    const csv = 'Email,Phone,Role,District,Department,Designation\nuser@domain.gov.in,9876543210,SDO,Patiala,Mines & Geology,Sub-Divisional Officer\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bulk-invite-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600/20 border border-purple-600/30 rounded-xl flex items-center justify-center">
              <Upload size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Bulk Invite Users</h3>
              <p className="text-xs text-slate-400 font-medium">Upload Excel or CSV to invite multiple users</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        <div className="p-6">
          {!result ? (
            <>
              {/* Info banner */}
              <div className="flex gap-3 bg-blue-950/50 border border-blue-800/50 rounded-xl p-4 mb-5">
                <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300 font-medium leading-relaxed">
                  Upload a file with headers: <strong>Email</strong>, <strong>Phone</strong> (or <strong>Mobile</strong>), <strong>Role</strong>, <strong>District</strong>, <strong>Department</strong>, <strong>Designation</strong>.
                  Invitations will be sent automatically via Email or SMS.
                </p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-purple-500 bg-purple-900/20' : file ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="sr-only"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-900/40 rounded-xl flex items-center justify-center">
                      <CheckCircle size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                      <Upload size={24} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-300 text-sm">Drop file here or click to upload</p>
                      <p className="text-xs text-slate-500 mt-1">Supports .CSV and .XLSX formats</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Template download */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-semibold mt-4 transition-colors"
              >
                <Download size={14} /> Download Template CSV
              </button>
            </>
          ) : (
            /* Results */
            <div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-emerald-400">{result.success}</div>
                  <div className="text-xs font-bold text-emerald-500 mt-1">Invitations Sent</div>
                </div>
                <div className="bg-red-900/30 border border-red-700/40 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-red-400">{result.failed.length}</div>
                  <div className="text-xs font-bold text-red-500 mt-1">Failed Rows</div>
                </div>
              </div>

              {result.failed.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Error Details</p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700 divide-y divide-slate-800">
                    {result.failed.map((f) => (
                      <div key={f.row} className="flex items-start gap-3 px-4 py-3">
                        <span className="text-xs font-bold text-slate-500 w-8 shrink-0">#{f.row}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-300 truncate">{f.email}</p>
                          <p className="text-xs text-red-400 mt-0.5">{f.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all hover:border-slate-500">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25"
            >
              {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              {isProcessing ? 'Processing...' : 'Upload & Process'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Role Dropdown ───────────────────────────────────────────────────────

function RoleDropdown({ currentRole, onUpdate, onClose }: {
  currentRole: UserRole;
  onUpdate: (role: UserRole) => void; onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
      {ALL_ROLES.map(role => (
        <button
          key={role}
          onClick={() => { onUpdate(role); onClose(); }}
          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors ${
            role === currentRole ? 'bg-blue-600/20 text-blue-300' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {role === currentRole && <CheckCircle size={12} className="text-blue-400" />}
          {role !== currentRole && <div className="w-3" />}
          {role}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserManagementPanel: React.FC = () => {
  const { users: _storeUsers, user: currentUser, updateUserRole, loginAs } = useAuthStore();
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>(() => useSeedUsers());

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<PortalUser['status'] | 'All'>('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [showFilters, _setShowFilters] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = portalUsers.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    const matchStatus = filterStatus === 'All' || u.status === filterStatus;
    const matchDistrict = filterDistrict === 'All' || u.district === filterDistrict;
    return matchSearch && matchRole && matchStatus && matchDistrict;
  });

  const stats = {
    total: portalUsers.length,
    active: portalUsers.filter(u => u.status === 'active').length,
    pending: portalUsers.filter(u => u.status === 'pending').length,
    suspended: portalUsers.filter(u => u.status === 'suspended').length,
  };

  const handleAddUser = (user: PortalUser) => {
    setPortalUsers(prev => [user, ...prev]);
    setShowAddUser(false);
    showToast(`Invitation sent to ${user.email}`);
  };

  const handleRoleUpdate = (userId: string, role: UserRole) => {
    setPortalUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    updateUserRole(userId, role);
    showToast(`Role updated to ${role}`, 'info');
  };

  const handleStatusToggle = (userId: string) => {
    setPortalUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const next: PortalUser['status'] = u.status === 'active' ? 'suspended' : 'active';
      return { ...u, status: next };
    }));
    showToast('User status updated', 'info');
  };

  return (
    <div className="min-h-full bg-slate-950 text-white font-sans">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[300] px-5 py-3 rounded-xl border shadow-2xl text-sm font-bold flex items-center gap-2 transition-all animate-[fadeInUp_0.2s_ease-out] ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-300' :
          toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-300' :
          'bg-blue-900/90 border-blue-700 text-blue-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : toast.type === 'error' ? <XCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onSuccess={handleAddUser} />}
      {showBulkInvite && <BulkInviteModal onClose={() => setShowBulkInvite(false)} />}

      <div className="p-6 max-w-full">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-600/30 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-black text-white">User Management</h1>
            </div>
            <p className="text-sm text-slate-400 font-medium ml-13">
              Manage portal users, roles, upload/review rights, and assigned access scopes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkInvite(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-700 hover:border-purple-600 text-slate-300 hover:text-white bg-slate-900 hover:bg-purple-900/20 rounded-xl text-sm font-bold transition-all"
            >
              <Upload size={15} /> Bulk Invite
            </button>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25"
            >
              <Plus size={15} /> Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users',  value: stats.total,    color: 'text-blue-400',    bg: 'bg-blue-900/20 border-blue-800/40' },
            { label: 'Active',       value: stats.active,   color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' },
            { label: 'Pending',      value: stats.pending,  color: 'text-amber-400',   bg: 'bg-amber-900/20 border-amber-800/40' },
            { label: 'Suspended',    value: stats.suspended,color: 'text-red-400',     bg: 'bg-red-900/20 border-red-800/40' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-600 transition-all"
              />
            </div>

            {/* Role filter */}
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as UserRole | 'All')}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              <option value="All">All Roles</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as PortalUser['status'] | 'All')}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* District filter */}
            <select
              value={filterDistrict}
              onChange={e => setFilterDistrict(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              {PUNJAB_DISTRICTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-500">
              Showing <span className="text-slate-300">{filtered.length}</span> of <span className="text-slate-300">{portalUsers.length}</span> users
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Logged in as: <span className="text-blue-400">{currentUser?.name} ({currentUser?.role})</span>
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">District</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Upload</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Review</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-500 font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={32} className="opacity-30" />
                        <span>No users found matching your filters</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                          {user.mobile && <p className="text-xs text-slate-600 font-medium">{user.mobile}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setEditingRole(editingRole === user.id ? null : user.id)}
                          className="flex items-center gap-1 group/role"
                        >
                          <RoleBadge role={user.role} />
                          <ChevronDown size={12} className="text-slate-600 group-hover/role:text-slate-400 transition-colors" />
                        </button>
                        {editingRole === user.id && (
                          <RoleDropdown
                            userId={user.id}
                            currentRole={user.role}
                            onUpdate={(role) => handleRoleUpdate(user.id, role)}
                            onClose={() => setEditingRole(null)}
                          />
                        )}
                      </div>
                    </td>

                    {/* District */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <MapPin size={11} className="text-slate-600" />
                        {user.district}
                      </div>
                    </td>

                    {/* Upload */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <button
                        onClick={() => setPortalUsers(prev => prev.map(u => u.id === user.id ? { ...u, canUpload: !u.canUpload } : u))}
                        className={`w-8 h-4.5 rounded-full relative transition-all duration-200 ${user.canUpload ? 'bg-emerald-600' : 'bg-slate-700'}`}
                        style={{ width: 32, height: 18 }}
                      >
                        <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-200 ${user.canUpload ? 'left-[14px]' : 'left-0.5'}`} style={{ width: 14, height: 14 }} />
                      </button>
                    </td>

                    {/* Review */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <button
                        onClick={() => setPortalUsers(prev => prev.map(u => u.id === user.id ? { ...u, canReview: !u.canReview } : u))}
                        className={`relative transition-all duration-200 ${user.canReview ? 'bg-blue-600' : 'bg-slate-700'}`}
                        style={{ width: 32, height: 18, borderRadius: 9 }}
                      >
                        <span className={`absolute top-0.5 bg-white rounded-full shadow transition-all duration-200 ${user.canReview ? 'left-[14px]' : 'left-0.5'}`} style={{ width: 14, height: 14 }} />
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <span className="text-xs font-semibold text-slate-500">{user.joinedAt}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { loginAs(user.id); showToast(`Logged in as ${user.name}`, 'info'); }}
                          title="Login as this user"
                          className="w-8 h-8 bg-emerald-900/30 hover:bg-emerald-600 border border-emerald-700/40 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user.id)}
                          title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                          className={`w-8 h-8 border rounded-lg flex items-center justify-center transition-all ${
                            user.status === 'active'
                              ? 'bg-red-900/30 hover:bg-red-600 border-red-700/40 hover:border-red-500 text-red-400 hover:text-white'
                              : 'bg-emerald-900/30 hover:bg-emerald-600 border-emerald-700/40 hover:border-emerald-500 text-emerald-400 hover:text-white'
                          }`}
                        >
                          {user.status === 'active' ? <Lock size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
