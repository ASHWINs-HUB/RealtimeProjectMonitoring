import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion } from 'framer-motion';
import {
  FolderKanban, Users, TrendingUp, AlertTriangle, Plus,
  ArrowUpRight, BarChart3, Activity, CheckCircle, Clock,
  Zap, Target, X, Loader2
} from 'lucide-react';

// Stat card component
const StatCard = ({ icon: Icon, label, value, trend, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <ArrowUpRight size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
);

export const HRDashboard = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [projData, analyticsData] = await Promise.all([
        api.getProjects(),
        api.getDashboardAnalytics().catch(() => null)
      ]);
      setProjects(projData.projects || []);
      setAnalytics(analyticsData?.analytics || null);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = {
    total: projects.length,
    active: projects.filter(p => ['active', 'in_progress', 'on_track', 'at_risk', 'delayed'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'completed').length,
    atRisk: projects.filter(p => p.status === 'at_risk' || (analytics?.project_health?.find(h => h.name === p.name)?.risk_score > 60)).length || 0
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
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats.total} color="bg-indigo-500" delay={0} />
        <StatCard icon={Activity} label="Active" value={stats.active} color="bg-emerald-500" delay={0.05} />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color="bg-blue-500" delay={0.1} />
        <StatCard icon={AlertTriangle} label="At Risk" value={stats.atRisk} color="bg-red-500" delay={0.15} />
      </div>

      {/* Projects table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Projects</h3>
          <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View all →
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <FolderKanban size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Progress</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Deadline</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.slice(0, 8).map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.project_key}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                          ${['active', 'in_progress', 'on_track'].includes(project.status) ? 'bg-emerald-50 text-emerald-700' :
                          project.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                            ['at_risk', 'delayed'].includes(project.status) ? 'bg-red-50 text-red-700' :
                              project.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-50 text-gray-700'
                        }`}>
                        {project.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-sm text-gray-500">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Risk Overview */}
      {analytics?.risk_distribution?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Risk Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['low', 'medium', 'high', 'critical'].map(level => {
              const data = analytics.risk_distribution.find(r => r.risk_level === level);
              const colors = {
                low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                medium: 'bg-amber-50 text-amber-700 border-amber-200',
                high: 'bg-orange-50 text-orange-700 border-orange-200',
                critical: 'bg-red-50 text-red-700 border-red-200'
              };
              return (
                <div key={level} className={`p-4 rounded-xl border ${colors[level]}`}>
                  <p className="text-sm font-medium capitalize">{level}</p>
                  <p className="text-2xl font-bold mt-1">{data?.count || 0}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
