import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
  Zap, Activity, Target, PieChart, ArrowUpRight,
  ChevronRight, Calendar, Info, RefreshCw, Users
} from 'lucide-react';

export const AnalyticsPage = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.getDashboardAnalytics();
      setData(res.analytics || null);
    } catch (error) {
      toast.error('Failed to load deep analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleCompute = async () => {
    setRefreshing(true);
    try {
      await api.triggerBatchCompute();
      toast.info('ML computation triggered in background');
      setTimeout(fetchAnalytics, 2000);
    } catch (error) {
      toast.error('Failed to trigger computation');
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Portfolio Analytics</h1>
          <p className="text-gray-500 mt-2 text-lg">Cross-project performance metrics and predictive intelligence</p>
        </div>
        <button
          onClick={handleCompute}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Processing AI...' : 'Run Analytics Engine'}
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <BarChart3 size={24} className="text-indigo-600 mb-4 relative z-10" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Avg Portfolio Progress</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <h3 className="text-4xl font-black text-gray-900">{Math.round(data?.summary?.avg_progress || 0)}%</h3>
            <span className="text-sm font-bold text-emerald-600 mb-1 flex items-center">
              <ArrowUpRight size={14} /> Live
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <AlertTriangle size={24} className="text-rose-600 mb-4 relative z-10" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Critical Risks</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <h3 className="text-4xl font-black text-gray-900">
              {data?.risk_distribution?.find(r => r.risk_level === 'critical')?.count || 0}
            </h3>
            <span className="text-xs font-bold text-gray-400 mb-1">Projects flagged</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <Target size={24} className="text-emerald-600 mb-4 relative z-10" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Total Tasks</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <h3 className="text-4xl font-black text-gray-900">{data?.summary?.total_tasks || 0}</h3>
            <span className="text-sm font-bold text-emerald-600 mb-1">Calculated</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <Zap size={24} className="text-amber-600 mb-4 relative z-10" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Active Projects</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <h3 className="text-4xl font-black text-gray-900">{data?.summary?.active_projects || 0}</h3>
            <span className="text-xs font-bold text-gray-400 mb-1">In progress</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Map */}
        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Risk Severity Map</h3>
            <Info size={18} className="text-gray-300" />
          </div>
          <div className="space-y-6">
            {[
              { label: 'Critical Execution Risk', count: data?.risk_distribution?.find(r => r.risk_level === 'critical')?.count || 0, color: 'bg-rose-500' },
              { label: 'High Potential Delay', count: data?.risk_distribution?.find(r => r.risk_level === 'high')?.count || 0, color: 'bg-orange-500' },
              { label: 'Moderate Watchlist', count: data?.risk_distribution?.find(r => r.risk_level === 'medium')?.count || 0, color: 'bg-amber-500' },
              { label: 'Stable Performance', count: data?.risk_distribution?.find(r => r.risk_level === 'low')?.count || 0, color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
                  <span className="text-sm font-black text-gray-900">{item.count} Projects</span>
                </div>
                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / 10) * 100}%` }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Health Rankings */}
        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Project Vitality Rank</h3>
            <Activity size={18} className="text-indigo-400" />
          </div>
          <div className="flex-1 space-y-4">
            {data?.project_health?.slice(0, 5).map((proj, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50/50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 truncate">{proj.name}</p>
                    <span className={`text-[10px] font-black uppercase ${proj.risk_score > 60 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {proj.risk_score > 60 ? 'Fragile' : 'Optimized'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{proj.progress}%</span>
                  </div>
                </div>
                <Link to={`/projects/${proj.id}`} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                  <ChevronRight size={20} />
                </Link>
              </div>
            ))}
            {(!data?.project_health || data.project_health.length === 0) && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Activity size={32} strokeWidth={1} />
                <p className="text-sm">No project data available</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Developer Leaderboard / Performance Heatmap */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[40px] shadow-2xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-bold">Engineering Performance Index</h3>
            <p className="text-indigo-300 text-sm mt-1">Holistic developer metrics based on commit frequency, task accuracy, and burnout signals.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{data?.team_performance?.length || 0}</p>
              <p className="text-[10px] uppercase font-bold text-indigo-400">Total Devs</p>
            </div>
            <div className="divider w-[1px] h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">8.2</p>
              <p className="text-[10px] uppercase font-bold text-indigo-400">Team CSAT</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.team_performance?.map((dev, i) => (
            <div key={i} className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-black text-white shadow-lg">
                  {dev.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{dev.name}</h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Core Engineering</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Impact Score</p>
                  <p className="text-xl font-black">{dev.performance_score}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">Burnout Risk</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl font-black">{dev.burnout_score}%</p>
                    <div className={`w-2 h-2 rounded-full ${dev.burnout_score > 50 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-500'}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-white/40">Efficiency Trajectory</span>
                  <span className="text-indigo-400">92%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dev.performance_score}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {(!data?.team_performance || data.team_performance.length === 0) && (
            <div className="col-span-full py-20 text-center opacity-40">
              <Users size={48} className="mx-auto mb-4" />
              <p className="text-lg">No performance data aggregated yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
