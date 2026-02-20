import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserPlus, Search, Mail, User, Loader2, X,
    Activity, TrendingUp, Target, BarChart3, Clock, CheckCircle,
    AlertTriangle, ChevronRight, ArrowLeft, Shield, Eye, EyeOff,
    FolderKanban, Zap
} from 'lucide-react'
import api from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

export const TeamManagementPage = () => {
    const { user } = useAuthStore()
    const toast = useToast()
    const [teamLeaders, setTeamLeaders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [selectedLeader, setSelectedLeader] = useState(null)
    const [teamStats, setTeamStats] = useState(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        password: '',
        department: ''
    })

    const fetchTeamLeaders = useCallback(async () => {
        try {
            const data = await api.getMyTeam()
            setTeamLeaders(data.members || [])
        } catch (error) {
            toast.error('Failed to load team leaders')
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchTeamLeaders()
    }, [fetchTeamLeaders])

    const handleViewTeamStats = async (leader) => {
        setSelectedLeader(leader)
        setStatsLoading(true)
        try {
            const data = await api.getTeamStats(leader.id)
            setTeamStats(data)
        } catch (error) {
            toast.error('Failed to load team statistics')
        } finally {
            setStatsLoading(false)
        }
    }

    const handleAddMember = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await api.addTeamMember(newMember)
            toast.success('Team leader added successfully!')
            setShowAddModal(false)
            setNewMember({ name: '', email: '', password: '', department: '' })
            fetchTeamLeaders()
        } catch (error) {
            toast.error(error.message || 'Failed to add team leader')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredLeaders = teamLeaders.filter(l =>
        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalScopes = filteredLeaders.reduce((a, l) => a + (parseInt(l.total_scopes) || 0), 0)
    const totalTasks = filteredLeaders.reduce((a, l) => a + (parseInt(l.total_tasks) || 0), 0)
    const completedTasks = filteredLeaders.reduce((a, l) => a + (parseInt(l.completed_tasks) || 0), 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Loading team leaders...</p>
                </div>
            </div>
        )
    }

    // ============ TEAM STATS DRILL-DOWN VIEW ============
    if (selectedLeader && teamStats) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                {/* Back Button */}
                <button
                    onClick={() => { setSelectedLeader(null); setTeamStats(null) }}
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Team Leaders
                </button>

                {/* Leader Header */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {teamStats.leader?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{teamStats.leader?.name}'s Team</h1>
                            <p className="text-sm text-gray-500">{teamStats.leader?.email} · {teamStats.leader?.department || 'No Department'}</p>
                        </div>
                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Team Leader
                        </span>
                    </div>
                </div>

                {statsLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Team Overview Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Team Size', value: teamStats.stats?.team_size || 0, icon: Users, color: 'indigo' },
                                { label: 'Total Scopes', value: teamStats.stats?.total_scopes || 0, icon: FolderKanban, color: 'blue' },
                                { label: 'Tasks Completed', value: teamStats.stats?.completed_tasks || 0, icon: CheckCircle, color: 'emerald' },
                                { label: 'Blocked Tasks', value: teamStats.stats?.blocked_tasks || 0, icon: AlertTriangle, color: 'red' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                                        <stat.icon size={18} className={`text-${stat.color}-600`} />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Scopes under this team leader */}
                        {teamStats.scopes?.length > 0 && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FolderKanban size={20} className="text-blue-600" /> Scopes
                                </h3>
                                <div className="space-y-3">
                                    {teamStats.scopes.map(scope => {
                                        const total = parseInt(scope.total_tasks) || 0
                                        const done = parseInt(scope.completed_tasks) || 0
                                        const pct = total > 0 ? Math.round((done / total) * 100) : 0

                                        return (
                                            <div key={scope.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{scope.title}</p>
                                                    <p className="text-xs text-gray-500">{scope.project_name}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20">
                                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600 w-10 text-right">{pct}%</span>
                                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${scope.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        scope.status === 'on_hold' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {scope.status}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Developer members (NOTE: showing names & task counts, NOT individual developer details) */}
                        {teamStats.members?.length > 0 && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-indigo-600" /> Team Members ({teamStats.members.length})
                                </h3>
                                <div className="text-sm text-gray-500 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <Shield size={14} className="inline mr-1.5 text-blue-600" />
                                    <span className="text-blue-700 font-medium">Team overview only — individual developer details are managed by their team leader.</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {teamStats.members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-bold text-indigo-600">{member.name?.charAt(0)?.toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{member.name}</p>
                                                    <p className="text-xs text-gray-400">{member.department || 'No Dept'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900">{member.total_tasks || 0} tasks</p>
                                                <p className="text-[10px] font-bold text-emerald-600">{member.completed_tasks || 0} done</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        )
    }

    // ============ MAIN TEAM LEADERS LIST VIEW ============
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Team Leaders</h1>
                    <p className="text-gray-500 mt-1">Team leaders assigned to your projects</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    <UserPlus size={16} /> Add Team Leader
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Team Leaders', value: filteredLeaders.length, icon: Shield, color: 'emerald' },
                    { label: 'Total Scopes', value: totalScopes, icon: FolderKanban, color: 'blue' },
                    { label: 'Total Tasks', value: totalTasks, icon: Target, color: 'indigo' },
                    { label: 'Completed', value: completedTasks, icon: CheckCircle, color: 'emerald' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                            <stat.icon size={18} className={`text-${stat.color}-600`} />
                        </div>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search team leaders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Team Leaders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeaders.map((leader, index) => {
                    const scopes = parseInt(leader.total_scopes) || 0
                    const completedScopes = parseInt(leader.completed_scopes) || 0
                    const tasks = parseInt(leader.total_tasks) || 0
                    const done = parseInt(leader.completed_tasks) || 0
                    const teamSize = parseInt(leader.team_size) || 0
                    const progress = tasks > 0 ? Math.round((done / tasks) * 100) : 0

                    return (
                        <motion.div
                            key={leader.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -4 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Gradient top bar */}
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

                            <div className="p-6">
                                {/* Leader Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {leader.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{leader.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{leader.email}</p>
                                    </div>
                                    <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-emerald-50 text-emerald-600">
                                        TL
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-gray-400">Task Completion</span>
                                        <span className="text-gray-900">{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-emerald-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* Team Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                                        <p className="text-lg font-black text-indigo-600">{teamSize}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Members</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                                        <p className="text-lg font-black text-blue-600">{scopes}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Scopes</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                                        <p className="text-lg font-black text-emerald-600">{done}/{tasks}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Tasks</p>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <button
                                    onClick={() => handleViewTeamStats(leader)}
                                    className="w-full py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <BarChart3 size={14} /> View Team Details <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {filteredLeaders.length === 0 && (
                <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
                    <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-bold text-gray-500">No Team Leaders Yet</p>
                    <p className="text-sm text-gray-400 mt-1">Team leaders will appear here when they are assigned scopes under your projects.</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all"
                    >
                        <UserPlus size={14} /> Add Team Leader
                    </button>
                </div>
            )}

            {/* Add Team Leader Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Add Team Leader</h2>
                                    <p className="text-sm text-gray-500 mt-1">Create a new team leader account</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="p-6 space-y-4">
                                {/* Role indicator */}
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <Shield size={18} className="text-emerald-600" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900">Role: Team Leader</p>
                                        <p className="text-xs text-emerald-600">Automatically assigned based on your manager role</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text" required
                                        value={newMember.name}
                                        onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Jane Smith"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email" required
                                        value={newMember.email}
                                        onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="teamlead@company.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'} required
                                            value={newMember.password}
                                            onChange={e => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                                            placeholder="Minimum 6 characters"
                                            minLength={6}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department (Optional)</label>
                                    <input
                                        type="text"
                                        value={newMember.department}
                                        onChange={e => setNewMember(prev => ({ ...prev, department: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="e.g., Engineering, Product, Design"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                        Create Team Leader
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default TeamManagementPage
