import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks, Users, Plus, X, Loader2, Calendar, Target,
  CheckCircle2, Clock, BarChart2, Briefcase, Zap, GitPullRequest
} from 'lucide-react';

export const TeamLeaderDashboard = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [scopes, setScopes] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedScope, setSelectedScope] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', description: '', assigned_to: '', priority: 'medium',
    story_points: 0, estimated_hours: 0, due_date: '', sync_jira: true
  });

  const fetchData = useCallback(async () => {
    try {
      // First get all projects to find scopes across them
      const projData = await api.getProjects();
      const allProjects = projData.projects || [];

      // Fetch scopes for each project (could be optimized, but works for now)
      const scopesPromises = allProjects.map(p => api.getScopes(p.id));
      const scopesResults = await Promise.all(scopesPromises);

      // Filter scopes assigned to THIS team leader
      const filteredScopes = scopesResults.flatMap(res => res.scopes || [])
        .filter(s => s.team_leader_id === user.id);

      const devData = await api.getUsers('developer');

      setScopes(filteredScopes);
      setDevelopers(devData.users || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedScope) return;
    setCreatingTask(true);
    try {
      await api.createTask(selectedScope.project_id, {
        ...newTask,
        scope_id: selectedScope.id
      });
      toast.success('Task created and assigned to developer');
      setShowTaskModal(false);
      setNewTask({
        title: '', description: '', assigned_to: '', priority: 'medium',
        story_points: 0, estimated_hours: 0, due_date: '', sync_jira: true
      });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Team Leader Hub</h1>
          <p className="text-gray-500 mt-1">Manage scopes and delegate tasks to developers</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Assigned Scopes</p>
            <p className="text-2xl font-bold text-gray-900">{scopes.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <ListChecks size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {scopes.reduce((acc, s) => acc + parseInt(s.task_count || 0), 0)}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Team Force</p>
            <p className="text-2xl font-bold text-gray-900">{developers.length} Devs</p>
          </div>
        </div>
      </div>

      {/* Scopes & Tasks */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">My Active Scopes</h2>
        {scopes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No scopes assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scopes.map(scope => (
              <motion.div
                key={scope.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{scope.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                      <Calendar size={14} />
                      {new Date(scope.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{scope.description}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-500">Execution Progress</span>
                      <span className="text-indigo-600">
                        {scope.task_count > 0 ? Math.round((scope.completed_tasks / scope.task_count) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${scope.task_count > 0 ? (scope.completed_tasks / scope.task_count) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        {scope.completed_tasks} Done
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-amber-500" />
                        {scope.task_count - scope.completed_tasks} Pending
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => { setSelectedScope(scope); setShowTaskModal(true); }}
                    className="flex-1 py-2 bg-white border border-indigo-200 text-indigo-600 font-bold rounded-xl text-xs hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> New Task
                  </button>
                  <button className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors">
                    Manage Board
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Create & Delegate Task</h2>
                <button onClick={() => setShowTaskModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-2">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Scope Context</p>
                  <p className="text-sm font-semibold text-indigo-900">{selectedScope?.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title</label>
                  <input
                    type="text" required
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Implement Authentication Controller"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Details about implementation requirements..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Developer</label>
                    <select
                      required
                      value={newTask.assigned_to}
                      onChange={e => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select Developer</option>
                      {developers.map(dev => (
                        <option key={dev.id} value={dev.id}>{dev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                    <input
                      type="date" required
                      value={newTask.due_date}
                      onChange={e => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none capitalize"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Story Points</label>
                    <input
                      type="number" min="0" max="20"
                      value={newTask.story_points}
                      onChange={e => setNewTask(prev => ({ ...prev, story_points: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Est. Hours</label>
                    <input
                      type="number" min="0"
                      value={newTask.estimated_hours}
                      onChange={e => setNewTask(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase">Automation</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTask.sync_jira}
                      onChange={e => setNewTask(prev => ({ ...prev, sync_jira: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <GitPullRequest size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">Auto-create Jira Issue & Sync Status</span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={creatingTask}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creatingTask ? <Loader2 size={20} className="animate-spin" /> : <><Plus size={20} /> Deploy Task</>}
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
