import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { RiskAlertBanner, RiskScoreGauge } from '@/components/ui/RiskAlerts';
import {
  Users, Heart, RefreshCw, Shield, BarChart3,
  TrendingDown, Activity, AlertTriangle, Eye
} from 'lucide-react';

/**
 * HR Dashboard — Role-specific
 * Shows:
 * - Burnout probability trends
 * - High-risk department overview
 * - Employee risk distribution
 * - Long-term productivity decline signals
 *
 * Removes: Code-level analytics, PR technical metrics
 * Alerts: Warning > 60%, Danger > 75%
 */
export const HRDashboard = () => {
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
      toast.success('Burnout analysis refreshed');
      fetchData();
    } catch {
      toast.error('Refresh failed');
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

  const hrRisk = metrics?.hr_risk_score ?? 0;
  const thresholds = metrics?.thresholds || { warning: 60, danger: 75 };
  const alerts = (metrics?.alerts || []).filter((_, i) => !dismissedAlerts.includes(i));
  const burnoutRisks = metrics?.burnout_risks || [];
  const riskDistribution = metrics?.risk_distribution || { low: 0, medium: 0, high: 0 };
  const totalEmployees = metrics?.total_employees ?? 0;

  const totalRiskCount = riskDistribution.low + riskDistribution.medium + riskDistribution.high;

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">HR Wellness Center</h1>
          <p className="text-gray-500 font-medium">Employee burnout monitoring & workforce health</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </header>

      <RiskAlertBanner alerts={alerts} onDismiss={(i) => setDismissedAlerts(p => [...p, i])} />

      {/* Top Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div {...fadeIn} className="bg-gradient-to-br from-gray-900 to-purple-950 p-6 rounded-[2rem] text-white shadow-2xl flex flex-col items-center justify-center">
          <RiskScoreGauge score={hrRisk} label="Workforce Risk" size="lg" thresholds={thresholds} />
          <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${metrics?.risk_level === 'danger' ? 'bg-red-500/20 text-red-300' :
              metrics?.risk_level === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
            }`}>
            {metrics?.risk_level === 'danger' ? 'Critical Burnout' : metrics?.risk_level === 'warning' ? 'Elevated Risk' : 'Healthy'}
          </span>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Workforce</p>
              <p className="text-3xl font-black text-gray-900">{totalEmployees}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">Active team members being monitored</p>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <Heart size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">At-Risk Employees</p>
              <p className="text-3xl font-black text-red-600">{burnoutRisks.length}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">Showing burnout signals (&gt;40%)</p>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <BarChart3 size={20} className="text-indigo-600" />
            </div>
            <h4 className="font-black text-gray-900 text-[10px] uppercase tracking-widest">Risk Distribution</h4>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                <span className="text-emerald-600">Low Risk</span>
                <span className="text-gray-400">{riskDistribution.low}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalRiskCount > 0 ? (riskDistribution.low / totalRiskCount) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                <span className="text-amber-600">Medium Risk</span>
                <span className="text-gray-400">{riskDistribution.medium}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalRiskCount > 0 ? (riskDistribution.medium / totalRiskCount) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                <span className="text-red-600">High Risk</span>
                <span className="text-gray-400">{riskDistribution.high}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalRiskCount > 0 ? (riskDistribution.high / totalRiskCount) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Burnout Risk Table */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Heart size={18} className="text-red-500" />
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Burnout Risk Monitoring</h3>
          <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {burnoutRisks.length} employee{burnoutRisks.length !== 1 ? 's' : ''} flagged
          </span>
        </div>
        {burnoutRisks.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Burnout Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {burnoutRisks.sort((a, b) => b.burnout_score - a.burnout_score).map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-black text-xs">
                        {emp.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {emp.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${emp.burnout_score >= 70 ? 'bg-red-500' :
                            emp.burnout_score >= 50 ? 'bg-amber-500' : 'bg-orange-400'
                          }`} style={{ width: `${emp.burnout_score}%` }} />
                      </div>
                      <span className="text-xs font-black text-gray-700">{emp.burnout_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${emp.level === 'critical' ? 'bg-red-50 text-red-600' :
                        emp.level === 'moderate' ? 'bg-amber-50 text-amber-600' :
                          'bg-orange-50 text-orange-600'
                      }`}>{emp.level}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500">
                      {emp.burnout_score >= 70 ? '🔴 Mandatory leave / workload redistribution' :
                        emp.burnout_score >= 50 ? '🟡 Schedule 1:1 check-in' :
                          '💬 Monitor workload'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <Heart size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold">No burnout risks detected</p>
            <p className="text-xs">All team members are currently within healthy ranges.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HRDashboard;
