import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { RiskAlertBanner, RiskScoreGauge } from '@/components/ui/RiskAlerts';
import {
  BarChart3, TrendingUp, RefreshCw, AlertTriangle,
  Layers, Target, Shield, Activity, Gauge
} from 'lucide-react';

/**
 * Manager Dashboard — Role-specific
 * Shows:
 * - Cross-team performance risk
 * - Sprint spillover trends
 * - High-risk teams
 * - Delivery predictability
 * - Manager-level risk score
 *
 * Alerts: Warning > 50%, Danger > 70%
 */
export const ManagerDashboard = () => {
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
      toast.success('Risk recalculation triggered');
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

  const managerRisk = metrics?.manager_risk_score ?? 0;
  const thresholds = metrics?.thresholds || { warning: 50, danger: 70 };
  const alerts = (metrics?.alerts || []).filter((_, i) => !dismissedAlerts.includes(i));
  const projectRisks = metrics?.project_risks || [];
  const highRiskTeams = metrics?.high_risk_teams || [];
  const deliveryPredictability = metrics?.delivery_predictability ?? 100;

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manager Command Center</h1>
          <p className="text-gray-500 font-medium">Cross-team risk analysis & delivery oversight</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Recalculating...' : 'Recalculate Risk'}
        </button>
      </header>

      <RiskAlertBanner alerts={alerts} onDismiss={(i) => setDismissedAlerts(p => [...p, i])} />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                <Target size={24} className="text-emerald-400" />
              </div>
              <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">Delivery Predictability</p>
            </div>
            <div className="flex items-end gap-3 mb-6">
              <p className="text-5xl font-black text-white">{deliveryPredictability}%</p>
              <TrendingUp size={24} className="text-emerald-400 mb-2" />
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${deliveryPredictability}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/20">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em]">Risk Exposure</p>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <p className="text-5xl font-black text-white">{highRiskTeams.length}</p>
              <p className="text-xs font-bold text-red-300 mb-2 uppercase">Critical Flag</p>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
              Out of {projectRisks.length} global projects
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                <Layers size={24} className="text-indigo-300" />
              </div>
              <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em]">Portfolio Scope</p>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <p className="text-5xl font-black text-white">{projectRisks.length}</p>
              <p className="text-xs font-bold text-indigo-400 mb-2 uppercase">Active Hub</p>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Total monitored units</p>
          </div>
        </motion.div>
      </div>

      {/* Project Risk Table */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Shield size={18} className="text-indigo-600" />
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Cross-Team Project Risk</h3>
        </div>
        {projectRisks.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projectRisks.sort((a, b) => b.risk_score - a.risk_score).map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{p.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.risk_score >= 70 ? 'bg-red-500' :
                          p.risk_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} style={{ width: `${p.risk_score}%` }} />
                      </div>
                      <span className="text-xs font-black text-gray-700">{p.risk_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${p.risk_level === 'critical' ? 'bg-red-50 text-red-600' :
                      p.risk_level === 'high' ? 'bg-orange-50 text-orange-600' :
                        p.risk_level === 'medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                      }`}>
                      {p.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <Layers size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold">No projects assigned</p>
            <p className="text-xs">Projects assigned to you will appear here with risk analysis.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManagerDashboard;
