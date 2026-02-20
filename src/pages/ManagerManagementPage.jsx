import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Search, Mail, User, Loader2, X,
  Activity, TrendingUp, Target, BarChart3, Clock, CheckCircle,
  AlertTriangle, ChevronRight, ArrowLeft, Shield, Eye, EyeOff,
  FolderKanban, Building2, Briefcase, Edit, Trash2, MoreVertical
} from 'lucide-react'
import api from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

export const ManagerManagementPage = () => {
  const { user } = useAuthStore()
  const toast = useToast()
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedManager, setSelectedManager] = useState(null)
  const [managerStats, setManagerStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [editingManager, setEditingManager] = useState(null)
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'manager'
  })

  const fetchManagers = useCallback(async () => {
    try {
      const data = await api.getHRManagers()
      setManagers(data.managers || [])
    } catch (error) {
      toast.error('Failed to load managers')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchManagers()
  }, [fetchManagers])

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleViewManagerStats = async (manager) => {
    setSelectedManager(manager)
    setStatsLoading(true)
    try {
      const data = await api.getManagerStatsDetails(manager.id)
      setManagerStats(data)
    } catch (error) {
      toast.error('Failed to load manager statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  const handleAddManager = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.addTeamMember(newManager)
      toast.success('Manager added successfully!')
      setShowAddModal(false)
      setNewManager({ name: '', email: '', password: '', department: '', role: 'manager' })
      fetchManagers()
    } catch (error) {
      toast.error(error.message || 'Failed to add manager')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateManager = async (e) => {
    e.preventDefault()
    try {
      await api.updateUser(editingManager.id, {
        name: editingManager.name,
        email: editingManager.email,
        department: editingManager.department,
        is_active: editingManager.is_active
      })
      toast.success('Manager updated successfully!')
      setEditingManager(null)
      fetchManagers()
    } catch (error) {
      toast.error(error.message || 'Failed to update manager')
    }
  }

  const handleDeleteManager = async (managerId) => {
    if (!confirm('Are you sure you want to deactivate this manager?')) return
    try {
      await api.deleteUser(managerId)
      toast.success('Manager deactivated successfully')
      fetchManagers()
    } catch (error) {
      toast.error(error.message || 'Failed to remove manager')
    }
  }

  const filteredManagers = managers.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalProjects = filteredManagers.reduce((a, m) => a + (parseInt(m.managed_projects) || 0), 0)
  const totalTeamLeaders = filteredManagers.reduce((a, m) => a + (parseInt(m.team_leaders_count) || 0), 0)
  const totalTasks = filteredManagers.reduce((a, m) => a + (parseInt(m.total_tasks) || 0), 0)
  const completedTasks = filteredManagers.reduce((a, m) => a + (parseInt(m.completed_tasks) || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading managers...</p>
        </div>
      </div>
    )
  }

  // ============ MANAGER STATS DRILL-DOWN VIEW ============
  if (selectedManager && managerStats) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <button
          onClick={() => { setSelectedManager(null); setManagerStats(null) }}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Managers
        </button>

        {/* Manager Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {managerStats.manager?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{managerStats.manager?.name}</h1>
              <p className="text-sm text-gray-500">{managerStats.manager?.email} · {managerStats.manager?.department || 'No Department'}</p>
            </div>
            <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Manager
            </span>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Projects', value: managerStats.stats?.total_projects || 0, icon: FolderKanban, color: 'blue' },
                { label: 'Team Leaders', value: managerStats.stats?.total_team_leaders || 0, icon: Shield, color: 'emerald' },
                { label: 'Completion Rate', value: `${managerStats.stats?.completion_rate || 0}%`, icon: TrendingUp, color: 'indigo' },
                { label: 'Blocked Tasks', value: managerStats.stats?.blocked_tasks || 0, icon: AlertTriangle, color: 'red' }
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

            {/* Projects */}
            {managerStats.projects?.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FolderKanban size={20} className="text-blue-600" /> Managed Projects
                </h3>
                <div className="space-y-3">
                  {managerStats.projects.map(project => {
                    const total = parseInt(project.total_tasks) || 0
                    const done = parseInt(project.completed_tasks) || 0
                    const pct = total > 0 ? Math.round((done / total) * 100) : project.progress || 0

                    return (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 truncate">{project.name}</p>
                            {project.project_key && (
                              <span className="text-[9px] font-black text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{project.project_key}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{total} tasks · {done} completed</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-20">
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${project.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                            project.status === 'at_risk' ? 'bg-red-50 text-red-600' :
                              project.status === 'delayed' ? 'bg-amber-50 text-amber-600' :
                                'bg-blue-50 text-blue-600'
                            }`}>
                            {project.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Team Leaders under this manager */}
            {managerStats.teamLeaders?.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-emerald-600" /> Team Leaders ({managerStats.teamLeaders.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {managerStats.teamLeaders.map(tl => (
                    <div key={tl.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-600">{tl.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{tl.name}</p>
                          <p className="text-xs text-gray-400">{tl.department || 'No Dept'} · {tl.team_size || 0} devs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">{tl.total_scopes || 0} scopes</p>
                        <p className="text-[10px] font-bold text-emerald-600">{tl.completed_tasks || 0}/{tl.total_tasks || 0} tasks</p>
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

  // ============ MAIN MANAGERS LIST VIEW ============
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Management</h1>
          <p className="text-gray-500 mt-1">Oversee managers and their performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <UserPlus size={16} /> Add Manager
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Managers', value: filteredManagers.length, icon: Briefcase, color: 'blue' },
          { label: 'Total Projects', value: totalProjects, icon: FolderKanban, color: 'indigo' },
          { label: 'Team Leaders', value: totalTeamLeaders, icon: Shield, color: 'emerald' },
          { label: 'Task Completion', value: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%', icon: TrendingUp, color: 'purple' }
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
            placeholder="Search managers by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Managers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredManagers.map((manager, index) => {
          const projects = parseInt(manager.managed_projects) || 0
          const activeProjects = parseInt(manager.active_projects) || 0
          const teamLeadersCount = parseInt(manager.team_leaders_count) || 0
          const tasks = parseInt(manager.total_tasks) || 0
          const done = parseInt(manager.completed_tasks) || 0
          const completionRate = tasks > 0 ? Math.round((done / tasks) * 100) : 0

          return (
            <motion.div
              key={manager.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Gradient top bar */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />

              <div className="p-6">
                {/* Manager Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {manager.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{manager.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{manager.email}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === manager.id ? null : manager.id) }}
                      className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {activeDropdown === manager.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[160px] p-1">
                        <button
                          onClick={() => { setEditingManager({ ...manager }); setActiveDropdown(null) }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => { handleDeleteManager(manager.id); setActiveDropdown(null) }}
                          className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-600"
                        >
                          <Trash2 size={14} /> Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Department */}
                {manager.department && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Building2 size={12} />
                    <span className="font-medium">{manager.department}</span>
                  </div>
                )}

                {/* Completion Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-gray-400">Task Completion</span>
                    <span className="text-gray-900">{completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-lg font-black text-blue-600">{projects}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Projects</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-lg font-black text-emerald-600">{teamLeadersCount}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">TLs</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-lg font-black text-indigo-600">{done}/{tasks}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Tasks</p>
                  </div>
                </div>

                {/* View Stats Button */}
                <button
                  onClick={() => handleViewManagerStats(manager)}
                  className="w-full py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 size={14} /> View Statistics <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredManagers.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
          <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-500">No Managers Yet</p>
          <p className="text-sm text-gray-400 mt-1">Add managers to start building your leadership team.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all"
          >
            <UserPlus size={14} /> Add Manager
          </button>
        </div>
      )}

      {/* Add Manager Modal */}
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
                  <h2 className="text-xl font-bold text-gray-900">Add Manager</h2>
                  <p className="text-sm text-gray-500 mt-1">Create a new manager account</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddManager} className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Briefcase size={18} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Role: Manager</p>
                    <p className="text-xs text-blue-600">This account will have project management capabilities</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" required
                    value={newManager.name}
                    onChange={e => setNewManager(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Manager's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email" required
                    value={newManager.email}
                    onChange={e => setNewManager(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="manager@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={newManager.password}
                      onChange={e => setNewManager(prev => ({ ...prev, password: e.target.value }))}
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
                    value={newManager.department}
                    onChange={e => setNewManager(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g., Engineering, Marketing, Sales"
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
                    Create Manager
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Manager Modal */}
      <AnimatePresence>
        {editingManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Manager</h2>
                  <p className="text-sm text-gray-500 mt-1">Update manager information</p>
                </div>
                <button onClick={() => setEditingManager(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateManager} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" required
                    value={editingManager.name}
                    onChange={e => setEditingManager(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email" required
                    value={editingManager.email}
                    onChange={e => setEditingManager(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={editingManager.department || ''}
                    onChange={e => setEditingManager(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox" id="edit_is_active"
                    checked={editingManager.is_active}
                    onChange={e => setEditingManager(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-700">Active Manager</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingManager(null)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    Update Manager
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

export default ManagerManagementPage
