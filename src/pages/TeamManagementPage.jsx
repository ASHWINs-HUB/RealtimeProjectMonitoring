import React, { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Search, Filter, Mail, Phone,
    ChevronRight, MoreVertical, Shield, UserCheck,
    Award, Briefcase, Activity, Target, Zap, Clock
} from 'lucide-react';

export const TeamManagementPage = () => {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchUsers = useCallback(async () => {
        try {
            const data = await api.getUsers();
            setUsers(data.users || []);
        } catch (error) {
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        const roles = {
            hr: { label: 'HR Admin', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
            manager: { label: 'Manager', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            team_leader: { label: 'Team Leader', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            developer: { label: 'Developer', color: 'bg-orange-50 text-orange-700 border-orange-100' }
        };
        return roles[role] || { label: role, color: 'bg-gray-50 text-gray-700' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Talent Hub</h1>
                    <p className="text-gray-500 mt-1">Manage human resources and team compositions</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-100">
                    <UserPlus size={18} /> Add Member
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'manager', 'team_leader', 'developer'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${roleFilter === r
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {r.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table grid */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Dept</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((u, i) => {
                                const role = getRoleBadge(u.role);
                                return (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-gray-50/30 transition-colors"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold w-fit border ${role.color}`}>
                                                    {role.label}
                                                </span>
                                                <span className="text-xs text-gray-400">{u.department || 'General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-medium text-gray-600">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {u.role === 'developer' ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: '75%' }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900">High</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
