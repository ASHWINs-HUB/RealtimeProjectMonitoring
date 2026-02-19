import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { RiskAlertBanner, RiskScoreGauge } from '@/components/ui/RiskAlerts';
import {
    Users, Shield, Settings, Activity,
    Search, UserCog, Check, RefreshCw,
    HardDrive, Zap, Mail, Trash2, UserPlus,
    X, Key, GraduationCap, Building2
} from 'lucide-react';

export const AdminDashboard = () => {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [riskMetrics, setRiskMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', email: '', password: '', role: 'developer', department: ''
    });
    const [creating, setCreating] = useState(false);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    const roles = ['admin', 'stakeholder', 'hr', 'manager', 'team_leader', 'developer'];

    const fetchData = useCallback(async () => {
        try {
            const [usersData, riskData] = await Promise.all([
                api.getUsers(),
                api.getRoleRiskMetrics().catch(() => null)
            ]);
            setUsers(usersData.users || []);
            setRiskMetrics(riskData?.metrics || {});
        } catch (error) {
            toast.error('Failed to load system data');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.createUser(createForm);
            toast.success('User created successfully');
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', email: '', password: '', role: 'developer', department: '' });
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    // ... handleUpdateRole ... 

    const handleUpdateRole = async (userId, newRole) => {
        setUpdating(userId);
        try {
            await api.updateRole(userId, newRole);
            toast.success('User role updated successfully');
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    const systemRisk = riskMetrics?.hr_risk_score ?? 0; // Same metric as HR
    const riskLevel = riskMetrics?.risk_level || 'low';
    const activeAlerts = (riskMetrics?.alerts || []).filter((_, i) => !dismissedAlerts.includes(i));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Administration</h1>
                    <p className="text-gray-500 font-medium">Global control center & AI Risk Oversight</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                    >
                        <UserPlus size={16} />
                        Add Member
                    </button>
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-11 pr-6 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none w-64 font-bold"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* AI Risk Overview Section for Admin */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield className="text-indigo-400" size={32} />
                            <h2 className="text-2xl font-black tracking-tight">System Risk Status</h2>
                        </div>
                        <p className="text-indigo-200 font-medium leading-relaxed max-w-xl">
                            Real-time AI monitoring of organization-wide delivery risks, workforce burnout, and operational stability.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <div className="bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Identity</p>
                                <p className="text-3xl font-black">{users.length}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">At-Risk Staff</p>
                                <p className="text-3xl font-black text-amber-400">{riskMetrics?.burnout_risks?.length || 0}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">System Load</p>
                                <p className="text-3xl font-black text-emerald-400">Normal</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-none p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                        <RiskScoreGauge
                            score={systemRisk}
                            label="Organization Risk"
                            size="lg"
                            thresholds={{ warning: 60, danger: 75 }}
                        />
                        <div className="mt-4 text-center">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${riskLevel === 'critical' ? 'bg-red-500/20 text-red-300' :
                                riskLevel === 'high' ? 'bg-amber-500/20 text-amber-300' :
                                    'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                {riskLevel === 'critical' ? 'Action Required' : 'Stable'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <RiskAlertBanner alerts={activeAlerts} onDismiss={(i) => setDismissedAlerts(p => [...p, i])} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Cards replacement (Already covered in top section, so we just keep clean layout for users) */}


                {/* Users List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role Assignment</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 leading-tight mb-0.5">{u.name}</p>
                                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={u.role}
                                                    onChange={e => handleUpdateRole(u.id, e.target.value)}
                                                    disabled={updating === u.id}
                                                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    {roles.map(r => (
                                                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                                    ))}
                                                </select>
                                                {updating === u.id && (
                                                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                                                    <UserCog size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm">
                                                    <Trash2 size={18} />
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
            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <UserPlus className="text-indigo-600" size={24} />
                                    Provision New Identity
                                </h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Direct system access grant</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-white rounded-xl text-gray-400 transition-colors shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <Users size={12} /> Full Identity Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="E.g. Alan Turing"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900"
                                        value={createForm.name}
                                        onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <Mail size={12} /> Digital Mailbox
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="user@projectpulse.io"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900"
                                        value={createForm.email}
                                        onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <Key size={12} /> Security Key
                                </label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900"
                                    value={createForm.password}
                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <GraduationCap size={12} /> System Role
                                    </label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 uppercase tracking-widest appearance-none cursor-pointer"
                                        value={createForm.role}
                                        onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                    >
                                        {roles.map(r => (
                                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <Building2 size={12} /> Department
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Engineering"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900"
                                        value={createForm.department}
                                        onChange={e => setCreateForm({ ...createForm, department: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {creating ? <RefreshCw className="animate-spin" size={16} /> : <>Create Identity <Zap size={14} /></>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
