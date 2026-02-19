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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div {...fadeIn} className="bg-gradient-to-br from-gray-900 to-indigo-950 p-6 rounded-[2rem] text-white shadow-2xl flex flex-col items-center justify-center">
          <RiskScoreGauge score={managerRisk} label="Portfolio Risk" size="lg" thresholds={thresholds} />
          <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${metrics?.risk_level === 'danger' ? 'bg-red-500/20 text-red-300' :
              metrics?.risk_level === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
            }`}>
            {metrics?.risk_level === 'danger' ? 'Critical' : metrics?.risk_level === 'warning' ? 'Elevated' : 'Healthy'}
          </span>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Target size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Predictability</p>
              <p className="text-3xl font-black text-emerald-600">{deliveryPredictability}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deliveryPredictability}%` }} />
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">High-Risk Projects</p>
              <p className="text-3xl font-black text-red-600">{highRiskTeams.length}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">
            Out of {projectRisks.length} active projects
          </p>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Layers size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Projects</p>
              <p className="text-3xl font-black text-gray-900">{projectRisks.length}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">Under your management</p>
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
