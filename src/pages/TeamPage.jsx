import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Mail, User, Loader2, X,
  Activity, TrendingUp, Target, BarChart3, Clock, CheckCircle,
  AlertTriangle, Zap, UserPlus, Eye, EyeOff
} from 'lucide-react'
import api from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

export const TeamPage = () => {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
  })
  const toast = useToast()

  const fetchTeam = useCallback(async () => {
    try {
      const data = await api.getMyTeam()
      setTeamMembers(data.members || [])
    } catch (error) {
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const handleAddMember = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.addTeamMember(newMember)
      toast.success('Developer added successfully!')
      setShowAddModal(false)
      setNewMember({ name: '', email: '', password: '', department: '' })
      fetchTeam()
    } catch (error) {
      toast.error(error.message || 'Failed to add team member')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMembers = teamMembers.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const totalTasks = filteredMembers.reduce((a, m) => a + (parseInt(m.total_tasks) || 0), 0)
  const completedTasks = filteredMembers.reduce((a, m) => a + (parseInt(m.completed_tasks) || 0), 0)
  const blockedTasks = filteredMembers.reduce((a, m) => a + (parseInt(m.blocked_tasks) || 0), 0)
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading your team...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Team</h1>
          <p className="text-gray-500 mt-1">Developers assigned to your scopes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <UserPlus size={16} /> Add Developer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: filteredMembers.length, icon: Users, color: 'indigo' },
          { label: 'Total Tasks', value: totalTasks, icon: Target, color: 'blue' },
          { label: 'Completed', value: `${completionRate}%`, icon: CheckCircle, color: 'emerald' },
          { label: 'Blocked', value: blockedTasks, icon: AlertTriangle, color: 'red' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center`}>
                <stat.icon size={18} className={`text-${stat.color}-600`} />
              </div>
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
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member, index) => {
          const tasks = parseInt(member.total_tasks) || 0
          const completed = parseInt(member.completed_tasks) || 0
          const active = parseInt(member.active_tasks) || 0
          const blocked = parseInt(member.blocked_tasks) || 0
          const progress = tasks > 0 ? Math.round((completed / tasks) * 100) : 0

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              {/* Member Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {member.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{member.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                </div>
                <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-orange-50 text-orange-600">
                  Developer
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400">Completion</span>
                  <span className={progress >= 70 ? 'text-emerald-600' : progress >= 40 ? 'text-amber-600' : 'text-red-600'}>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Total', value: tasks, color: 'text-gray-900' },
                  { label: 'Done', value: completed, color: 'text-emerald-600' },
                  { label: 'Active', value: active, color: 'text-blue-600' },
                  { label: 'Blocked', value: blocked, color: 'text-red-600' }
                ].map(s => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {member.department && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold">Dept</span>
                  <span className="font-medium text-gray-700">{member.department}</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-500">No Team Members Yet</p>
          <p className="text-sm text-gray-400 mt-1">Developers will appear here once tasks are assigned under your scopes.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all"
          >
            <UserPlus size={14} /> Add Developer
          </button>
        </div>
      )}

      {/* Add Member Modal */}
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
                  <h2 className="text-xl font-bold text-gray-900">Add Developer</h2>
                  <p className="text-sm text-gray-500 mt-1">Create a new developer account for your team</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                {/* Role indicator */}
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <User size={18} className="text-orange-600" />
                  <div>
                    <p className="text-sm font-bold text-orange-900">Role: Developer</p>
                    <p className="text-xs text-orange-600">Automatically assigned based on your team leader role</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" required
                    value={newMember.name}
                    onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email" required
                    value={newMember.email}
                    onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="developer@company.com"
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
                    placeholder="e.g., Frontend, Backend, QA"
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
                    Create Developer
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

export default TeamPage
