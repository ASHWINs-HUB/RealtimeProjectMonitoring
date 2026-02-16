import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Users, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Plus, X, Loader2, Target, BarChart3,
  Check, XCircle, ChevronRight
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [creatingScope, setCreatingScope] = useState(false);
  const [newScope, setNewScope] = useState({
    title: '', description: '', team_leader_id: '', deadline: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [projData, analyticsData, tlData] = await Promise.all([
        api.getProjects(),
        api.getDashboardAnalytics().catch(() => null),
        api.getUsers('team_leader')
      ]);
      setProjects(projData.projects || []);
      setAnalytics(analyticsData?.analytics || null);
      setTeamLeaders(tlData.users || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAcceptProject = async (projectId) => {
    try {
      await api.acceptProject(projectId);
      toast.success('Project accepted');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to accept project');
    }
  };

  const handleDeclineProject = async (projectId) => {
    try {
      await api.declineProject(projectId);
      toast.success('Project declined');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to decline project');
    }
  };

  const handleCreateScope = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setCreatingScope(true);
    try {
      await api.createScope(selectedProject.id, newScope);
      toast.success('Scope assigned to team leader');
      setShowScopeModal(false);
      setNewScope({ title: '', description: '', team_leader_id: '', deadline: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to assign scope');
    } finally {
      setCreatingScope(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingProjects = projects.filter(p => p.status === 'pending');
  const activeProjects = projects.filter(p => ['active', 'in_progress', 'on_track', 'at_risk', 'delayed', 'accepted'].includes(p.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage project assignments and team scopes</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingProjects.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">My Active Projects</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeProjects.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Risk Alerts</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {activeProjects.filter(p => {
              const projectAnalytics = analytics?.project_health?.find(ph => ph.name === p.name);
              return projectAnalytics?.risk_score > 60;
            }).length}
          </p>
        </div>
      </div>

      {/* Pending Assignments */}
      {pendingProjects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            New Project Requests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingProjects.map(project => (
              <motion.div
                key={project.id}
                layout
                className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">Deadline:</span> {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">PENDING</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAcceptProject(project.id)}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> Accept
                  </button>
                  <button
                    onClick={() => handleDeclineProject(project.id)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Active Projects & Scope Management */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Target size={20} className="text-indigo-500" />
          Active Projects & Scopes
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-clip">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Health</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeProjects.map(project => {
                  const projectHealth = analytics?.project_health?.find(ph => ph.name === project.name);
                  const riskColor = projectHealth?.risk_score > 60 ? 'text-red-600' : projectHealth?.risk_score > 30 ? 'text-amber-600' : 'text-emerald-600';

                  return (
                    <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500">{project.project_key}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`text-sm font-bold ${riskColor}`}>
                          {projectHealth?.risk_score ? `${projectHealth.risk_score}% Risk` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right space-x-3">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors inline-block"
                        >
                          View Full Details
                        </Link>
                        <button
                          onClick={() => { setSelectedProject(project); setShowScopeModal(true); }}
                          className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Create Scope
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Create Scope Modal */}
      <AnimatePresence>
        {showScopeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Define Scope</h2>
                <button onClick={() => setShowScopeModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateScope} className="p-6 space-y-4">
                <p className="text-sm text-gray-500">Breaking project <span className="font-bold text-gray-800">{selectedProject?.name}</span> into actionable scopes for team leaders.</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Scope Title</label>
                  <input
                    type="text" required
                    value={newScope.title}
                    onChange={e => setNewScope(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Frontend Architecture Implementation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={newScope.description}
                    onChange={e => setNewScope(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Provide details on the expected outcomes of this scope..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Leader</label>
                    <select
                      required
                      value={newScope.team_leader_id}
                      onChange={e => setNewScope(prev => ({ ...prev, team_leader_id: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select a Leader</option>
                      {teamLeaders.map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                    <input
                      type="date" required
                      value={newScope.deadline}
                      onChange={e => setNewScope(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScopeModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={creatingScope}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creatingScope ? <Loader2 size={18} className="animate-spin" /> : 'Assign Scope'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
