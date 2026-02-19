import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { RiskAlertBanner, RiskScoreGauge } from '@/components/ui/RiskAlerts';
import {
  Users, BarChart3, Clock, AlertTriangle, RefreshCw,
  TrendingDown, Shield, Activity, GitPullRequest, Layers
} from 'lucide-react';

/**
 * Team Leader Dashboard — Role-specific
 * Shows ONLY team metrics:
 * - Team sprint delay %
 * - Average PR review time
 * - Team commit health
 * - Blocked issues
 * - Team risk score
 *
 * Alerts: Warning > 45%, Danger > 65%
 */
export const TeamLeaderDashboard = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const riskData = await api.getRoleRiskMetrics().catch(() => null);
      setMetrics(riskData?.metrics || {});
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.triggerBatchCompute();
      toast.success('Synchronized with Jira & GitHub');
      fetchData();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const teamRisk = metrics?.team_risk_score ?? 0;
  const thresholds = metrics?.thresholds || { warning: 45, danger: 65 };
  const alerts = (metrics?.alerts || []).filter((_, i) => !dismissedAlerts.includes(i));
  const members = metrics?.team_members || [];
  const sprintDelayPct = metrics?.sprint_delay_pct ?? 0;
  const blockedIssues = metrics?.blocked_issues ?? 0;

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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Overview</h1>
          <p className="text-gray-500 font-medium">Team performance, sprint health & risk monitoring</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </header>

      {/* Risk Alerts */}
      <RiskAlertBanner alerts={alerts} onDismiss={(i) => setDismissedAlerts(p => [...p, i])} />

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Team Risk Score */}
        <motion.div {...fadeIn} className="bg-gradient-to-br from-gray-900 to-indigo-950 p-6 rounded-[2rem] text-white shadow-2xl flex flex-col items-center justify-center">
          <RiskScoreGauge score={teamRisk} label="Team Risk" size="lg" thresholds={thresholds} />
          <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${metrics?.risk_level === 'danger' ? 'bg-red-500/20 text-red-300' :
              metrics?.risk_level === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
            }`}>
            {metrics?.risk_level === 'danger' ? 'High Risk' : metrics?.risk_level === 'warning' ? 'Moderate Risk' : 'On Track'}
          </span>
        </motion.div>

        {/* Sprint Delay */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-orange-50 rounded-xl">
              <TrendingDown size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sprint Delay</p>
              <p className={`text-3xl font-black ${sprintDelayPct > 30 ? 'text-red-600' : sprintDelayPct > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {sprintDelayPct}%
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${sprintDelayPct > 30 ? 'bg-red-500' : sprintDelayPct > 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(sprintDelayPct, 100)}%` }} />
          </div>
        </motion.div>

        {/* Blocked Issues */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blocked Issues</p>
              <p className="text-3xl font-black text-gray-900">{blockedIssues}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">Requires immediate attention</p>
        </motion.div>

        {/* Team Size */}
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Members</p>
              <p className="text-3xl font-black text-gray-900">{members.length}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">Active contributors</p>
        </motion.div>
      </div>

      {/* Team Members Risk Table */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Shield size={18} className="text-indigo-600" />
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Team Member Risk Scores</h3>
        </div>
        {members.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map(m => {
                const riskLevel = m.risk_score >= 60 ? 'danger' : m.risk_score >= 40 ? 'warning' : 'safe';
                return (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                          {m.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-gray-900">{m.performance}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${riskLevel === 'danger' ? 'bg-red-500' :
                              riskLevel === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} style={{ width: `${m.risk_score}%` }} />
                        </div>
                        <span className="text-xs font-black text-gray-700">{m.risk_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${riskLevel === 'danger' ? 'bg-red-50 text-red-600' :
                          riskLevel === 'warning' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                        }`}>
                        {riskLevel === 'danger' ? 'HIGH RISK' : riskLevel === 'warning' ? 'MODERATE' : 'HEALTHY'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold">No team members found</p>
            <p className="text-xs">Create a team and assign members to see risk metrics here.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeamLeaderDashboard;
