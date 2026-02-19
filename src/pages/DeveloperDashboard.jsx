import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertCircle, PlayCircle, Info, X,
  BarChart3, Award, Zap, GitBranch, ExternalLink, MessageSquare,
  ChevronDown, Search, Filter, Loader2, Check, ListChecks, RefreshCw,
  Copy, GitPullRequest
} from 'lucide-react';

const TaskDetailsModal = ({ task, onClose, onBranchCreated }) => {
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  if (!task) return null;

  const handleCreateBranch = async () => {
    setCreating(true);
    try {
      const data = await api.createBranch(task.id);
      toast.success('GitHub branch created successfully!');
      if (onBranchCreated) {
        onBranchCreated(task.id, data.branchName, data.branchUrl);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Branch name copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden shadow-indigo-200/50 border border-indigo-50"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-lg uppercase tracking-widest">
                {task.project_key}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {task.id}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status & Priority Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-black text-gray-700 uppercase">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-1">Priority</p>
              <span className="text-xs font-black text-gray-700 uppercase">{task.priority}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-1">Due Date</p>
              <span className="text-xs font-black text-gray-700">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
              <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-1">Points</p>
              <span className="text-xs font-black text-gray-700">{task.story_points} SP</span>
            </div>
          </div>

          {/* GitHub Integration Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <GitBranch size={14} className="text-indigo-500" />
              Source & Development
            </h3>

            {task.github_branch ? (
              <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <GitBranch size={16} className="text-indigo-600" />
                    </div>
                    <code className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-indigo-600">
                      {task.github_branch}
                    </code>
                    <button
                      onClick={() => copyToClipboard(task.github_branch)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-indigo-600"
                      title="Copy branch name"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={task.github_branch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-gray-700 hover:bg-gray-50 hover:border-indigo-200 transition-all shadow-sm"
                  >
                    <ExternalLink size={12} />
                    GITHUB VIEW
                  </a>
                  <a
                    href={task.github_branch_url && task.github_branch_url.includes('/tree/')
                      ? `${task.github_branch_url.replace('/tree/', '/compare/')}?expand=1`
                      : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-[11px] font-black text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <GitPullRequest size={12} />
                    CREATE PULL REQUEST
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center bg-gray-50/30">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                  <GitBranch size={24} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-500 mb-5 font-bold uppercase tracking-wider">No active branch for this task</p>
                <button
                  onClick={handleCreateBranch}
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:scale-100"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <GitBranch size={16} />}
                  Initialize Feature Branch
                </button>
              </div>
            )}
          </div>

          {/* Jira Integration */}
          {task.jira_key && (
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <RefreshCw size={14} className="text-indigo-500" />
                Management Link
              </h3>
              <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-100">
                    J
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Linked Jira Issue</p>
                    <p className="text-sm font-black text-gray-900">{task.jira_key}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    Live Sync active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquare size={14} className="text-indigo-500" />
              Requirement Details
            </h3>
            <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100/50">
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                {task.description || 'No description provided for this task.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Zap size={12} className="text-amber-500" />
            Automated State Management
          </p>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 uppercase tracking-widest hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const DeveloperDashboard = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.triggerBatchCompute();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal Overlay */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onBranchCreated={(taskId, branch, url) => {
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, github_branch: branch, github_branch_url: url } : t));
              setSelectedTask(prev => prev?.id === taskId ? { ...prev, github_branch: branch, github_branch_url: url } : prev);
            }}
          />
        )}
      </AnimatePresence>

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-500 mt-1 uppercase text-[11px] font-bold tracking-widest flex items-center gap-2">
            <Zap size={12} className="text-emerald-500" />
            Source of Truth: Jira & GitHub
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Sync Integrations
        </button>
      </header>

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
                        Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
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

                  <div className="flex items-center gap-3 lg:border-l lg:pl-6 lg:border-gray-100">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Zap size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Auto-Updating</span>
                    </div>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm flex items-center gap-2 group"
                    >
                      <Info size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold hidden sm:inline">Details</span>
                    </button>
                    <button className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                      <ExternalLink size={18} />
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
