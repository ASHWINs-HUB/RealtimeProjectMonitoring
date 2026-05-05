import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { RiskAlertBanner, RiskScoreGauge } from '@/components/ui/RiskAlerts';
import {
  CheckCircle2, BarChart3, Award, Zap, ExternalLink,
  Loader2, ListChecks, RefreshCw, GitCommit, GitPullRequest,
  Clock, Bug, TrendingUp, Activity, Trophy
} from 'lucide-react';
import { BadgeGrid } from '@/components/profile/BadgeGrid';

/**
 * Developer Dashboard — Role-specific
 * Shows ONLY personal metrics:
 * - Personal commit frequency
 * - PR merge time
 * - Task completion delay
 * - Bug reopen ratio
 * - Personal risk score
 * 
 * Alerts: Warning > 40%, Danger > 60%
 */
export const DeveloperDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [riskData, perfData] = await Promise.all([
        api.getRoleRiskMetrics().catch(() => null),
        api.getDeveloperPerformance(user.id).catch(() => null),
      ]);
      setMetrics({
        ...(riskData?.metrics || {}),
        performance: riskData?.metrics?.performance || perfData?.performance || null,
      });
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

  const handleDismissAlert = (index) => {
    setDismissedAlerts(prev => [...prev, index]);
  };

  const getReputationLevel = (score) => {
    if (score >= 5000) return 'Legend';
    if (score >= 4000) return 'Master';
    if (score >= 3500) return 'Expert';
    if (score >= 3000) return 'Veteran';
    if (score >= 1000) return 'Junior';
    return 'Rookie';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const performance = metrics?.performance;
  const riskScore = metrics?.personal_risk_score ?? 0;
  const thresholds = metrics?.thresholds || { warning: 40, danger: 60 };
  const alerts = (metrics?.alerts || []).filter((_, i) => !dismissedAlerts.includes(i));
  // Removed commitStats
  const taskStats = metrics?.task_stats || {};
  const burnout = metrics?.burnout || {};

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            My Dashboard
          </h1>
          <p className="text-gray-500 font-medium">
            Personal performance & risk metrics
            {user?.salary > 0 && (
              <span className="ml-3 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full tracking-widest">
                Monthly Salary: ${user.salary.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ListChecks size={16} />
            View My Tasks
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </header>

      {/* Risk Alerts */}
      <RiskAlertBanner alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Risk Score + Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Risk Score Card */}
        <motion.div {...fadeIn} className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-indigo-950 p-6 rounded-[2rem] text-white shadow-2xl flex flex-col items-center justify-center">
          <RiskScoreGauge score={riskScore} label="Personal Risk" size="lg" thresholds={thresholds} />
          <div className="mt-4 text-center">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${metrics?.risk_level === 'danger' ? 'bg-red-500/20 text-red-300' :
              metrics?.risk_level === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
              {metrics?.risk_level === 'danger' ? 'High Risk' : metrics?.risk_level === 'warning' ? 'Moderate Risk' : 'Low Risk'}
            </span>
          </div>
        </motion.div>

        {/* Professional Reputation Points Card */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:border-indigo-100 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Trophy size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professional Score</p>
              <p className="text-2xl font-black text-gray-900">{user?.reputation_score || 3000}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 w-fit px-2 py-1 rounded-lg">
            <Zap size={10} />
            <span>Title: {getReputationLevel(user?.reputation_score || 3000)}</span>
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasks Completed</p>
              <p className="text-2xl font-black text-gray-900">
                {parseInt(taskStats.completed) || 0}
                <span className="text-sm text-gray-400 ml-1">/ {parseInt(taskStats.total) || 0}</span>
              </p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${parseInt(taskStats.total) > 0 ? (parseInt(taskStats.completed) / parseInt(taskStats.total)) * 100 : 0}%` }}
            />
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-orange-50 rounded-xl">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overdue Tasks</p>
              <p className="text-2xl font-black text-gray-900">{parseInt(taskStats.overdue) || 0}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">
            Avg Delay: {parseFloat(taskStats.avg_delay_days || 0).toFixed(1)} days
          </p>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <Activity size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Burnout Level</p>
              <p className="text-2xl font-black text-gray-900">{burnout.score ?? 0}%</p>
            </div>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${burnout.level === 'critical' ? 'bg-red-50 text-red-600' :
            burnout.level === 'moderate' ? 'bg-amber-50 text-amber-600' :
              'bg-emerald-50 text-emerald-600'
            }`}>{burnout.level || 'low'}</span>
        </motion.div>
      </div>

      {/* Badges & Achievements */}
      <motion.div {...fadeIn} transition={{ delay: 0.6 }} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Award size={18} className="text-indigo-600" />
          Badges & Achievements
        </h3>
        <BadgeGrid badges={metrics?.badges} />
      </motion.div>

      {/* Skills Matrix */}
      <motion.div {...fadeIn} transition={{ delay: 0.7 }} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          Professional Skills Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(metrics?.skills || []).map((skill, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{skill.skill_name}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Lvl {skill.proficiency_level}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${skill.proficiency_level * 10}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                Total XP: {skill.total_xp}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DeveloperDashboard;
