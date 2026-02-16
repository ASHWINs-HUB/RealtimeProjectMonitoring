import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertCircle, PlayCircle,
  BarChart3, Award, Zap, GitBranch, ExternalLink, MessageSquare,
  ChevronDown, Search, Filter, Loader2, Check, ListChecks, RefreshCw
} from 'lucide-react';

export const DeveloperDashboard = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [taskData, perfData] = await Promise.all([
        api.getAssignedTasks(),
        api.getDeveloperPerformance(user.id).catch(() => null)
      ]);
      setTasks(taskData.tasks || []);
      setPerformance(perfData?.performance || null);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      await api.updateTaskStatus(taskId, { status: newStatus });
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.triggerBatchCompute(); // This now includes syncAll() in our updated backend
      toast.success('Synchronized with Jira & GitHub');
      fetchData();
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getPriorityColor = (priority) => ({
    critical: 'text-red-600 bg-red-50 border-red-100',
    high: 'text-orange-600 bg-orange-50 border-orange-100',
    medium: 'text-blue-600 bg-blue-50 border-blue-100',
    low: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  }[priority] || 'text-gray-600 bg-gray-50');

  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: Clock, color: 'text-gray-400' },
    { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
    { value: 'in_review', label: 'In Review', icon: MessageSquare, color: 'text-purple-500' },
    { value: 'blocked', label: 'Blocked', icon: AlertCircle, color: 'text-red-500' },
    { value: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your progress and sync updates to Jira</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="text-indigo-600" />}
          Sync Integrations
        </button>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Performance Score</p>
              <h2 className="text-4xl font-bold mt-1">{performance?.score || 0}%</h2>
              <p className="text-indigo-100 text-xs mt-2 uppercase tracking-wide font-bold">
                Level: {performance?.level?.replace('_', ' ') || 'Calculating...'}
              </p>
            </div>
            <Award size={48} className="text-indigo-400/50" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[10px] text-indigo-200">On Time</p>
              <p className="text-sm font-bold">{Math.round((performance?.breakdown?.on_time_rate || 0) * 100)}%</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[10px] text-indigo-200">Efficiency</p>
              <p className="text-sm font-bold">{Math.round((performance?.breakdown?.efficiency || 0) * 100)}%</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[10px] text-indigo-200">Consistency</p>
              <p className="text-sm font-bold">{Math.round((performance?.breakdown?.consistency || 0) * 100)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Tasks Completed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{performance?.stats?.completed_tasks || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-xl w-fit mb-3">
            <Zap size={24} className="text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Story Points Delivered</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{performance?.stats?.points_delivered || 0}</p>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ListChecks size={20} className="text-indigo-500" />
            My Assigned Tasks
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Find a task..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48 lg:w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tasks.filter(t =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.project_key?.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Clock size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {searchTerm ? 'No tasks match your search.' : 'Looking good! No tasks assigned yet.'}
              </p>
            </div>
          ) : (
            tasks
              .filter(t =>
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.project_key?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(task => (
                <motion.div
                  key={task.id}
                  layout
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-indigo-600 font-bold">{task.project_key}</span>
                      {task.jira_key && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                          <Zap size={10} />
                          Synced
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 truncate">{task.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </div>
                      {task.jira_key && (
                        <div className="flex items-center gap-1 text-blue-600 font-bold">
                          <GitBranch size={14} />
                          {task.jira_key}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        {task.story_points} Points
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:border-l lg:pl-6 lg:border-gray-100">
                    <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1 rounded-xl">
                      {statusOptions.map(opt => {
                        const isActive = task.status === opt.value;
                        const Icon = opt.icon;

                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleUpdateStatus(task.id, opt.value)}
                            disabled={updatingId === task.id || isActive}
                            title={opt.label}
                            className={`p-2 rounded-lg transition-all relative ${isActive
                              ? `bg-white shadow-sm ${opt.color}`
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {updatingId === task.id && isActive ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Icon size={18} />
                            )}
                            {isActive && (
                              <motion.div
                                layoutId={`active-status-${task.id}`}
                                className="absolute inset-0 border-2 border-indigo-500/20 rounded-lg"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
