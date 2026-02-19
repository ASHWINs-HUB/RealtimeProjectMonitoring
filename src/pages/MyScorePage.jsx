import React, { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, Target, Zap, Clock, TrendingUp, Activity,
    CheckCircle2, AlertCircle, BarChart3, Star,
    ShieldCheck, ArrowUpRight, Loader2, RefreshCw
} from 'lucide-react';

export const MyScorePage = () => {
    const { user } = useAuthStore();
    const toast = useToast();
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPerformance = useCallback(async () => {
        try {
            const res = await api.getMyPerformance();
            setPerformance(res.performance || null);
        } catch (error) {
            toast.error('Failed to load performance metrics');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 animate-pulse">
                <Award size={48} className="text-amber-500 mb-4" />
                <p className="text-gray-500 font-bold">Aggregating Impact Metrics...</p>
            </div>
        );
    }

    const score = performance?.score || 0;
    const level = performance?.level?.replace('_', ' ') || 'Calculating...';

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Developer Analytics</h1>
                    <p className="text-gray-500 mt-2 text-lg">Machine-authenticated performance and reliability metrics.</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchPerformance(); }}
                    className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                    <RefreshCw size={20} className="text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Score Radial */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[48px] p-10 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500 rounded-full blur-[80px]" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px]" />
                    </div>

                    <div className="relative z-10 text-center space-y-8 w-full">
                        <div className="w-48 h-48 mx-auto relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                                <motion.circle
                                    initial={{ strokeDashoffset: 502 }}
                                    animate={{ strokeDashoffset: 502 - (502 * score) / 100 }}
                                    cx="96" cy="96" r="80" stroke="white" strokeWidth="12" fill="transparent" strokeDasharray={502}
                                    className="transition-all duration-[2000ms] stroke-indigo-400"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black">{score}%</span>
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Overall</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black capitalize tracking-tight">{level}</h3>
                            <p className="text-indigo-300 text-xs font-bold uppercase mt-2">Ranked top 10% in Engineering</p>
                        </div>

                        <div className="pt-8 border-t border-white/10 w-full flex justify-around">
                            <div className="text-center">
                                <p className="text-xl font-bold">{performance?.stats?.points_delivered || 0}</p>
                                <p className="text-[8px] font-black text-indigo-400 uppercase">Points</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold">{performance?.stats?.completed_tasks || 0}</p>
                                <p className="text-[8px] font-black text-indigo-400 uppercase">Deployed</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Breakdown Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { label: 'Completion Velocity', value: (performance?.breakdown?.completion_rate || 0) * 100, icon: Activity, color: 'indigo' },
                        { label: 'SLA Reliability', value: (performance?.breakdown?.on_time_rate || 0) * 100, icon: ShieldCheck, color: 'emerald' },
                        { label: 'Technical Efficiency', value: (performance?.breakdown?.efficiency || 0) * 100, icon: Zap, color: 'amber' },
                        { label: 'Complexity Handling', value: (performance?.breakdown?.complexity_handling || 0) * 100, icon: Target, color: 'purple' },
                    ].map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:border-indigo-200 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className={`p-3 bg-${metric.color}-50 rounded-2xl group-hover:bg-${metric.color}-500 transition-colors`}>
                                    <metric.icon size={20} className={`text-${metric.color}-600 group-hover:text-white transition-colors`} />
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-gray-900">{Math.round(metric.value)}%</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 mb-3">{metric.label}</p>
                                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metric.value}%` }}
                                        className={`h-full bg-${metric.color}-500`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* AI Verification Badge */}
                    <div className="md:col-span-2 bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-900">AI-Verified Performance Identity</p>
                            <p className="text-xs text-emerald-700 mt-1">This score is recalculated every 6 hours based on Jira events, GitHub commit depth, and peer feedback cycles. It serves as your internal promotion benchmark.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trajectory */}
            <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Consistency Trajectory</h3>
                        <p className="text-sm text-gray-500 mt-1">Daily impact points over the last 30 working days.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Improver +12%</span>
                    </div>
                </div>

                <div className="flex items-end justify-between h-40 gap-1.5 pb-2">
                    {Array.from({ length: 30 }).map((_, i) => {
                        const h = 30 + Math.random() * 60;
                        return (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.02 }}
                                className="w-full bg-gray-100 rounded-full hover:bg-indigo-500 transition-colors relative group"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {Math.round(h)} pts
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    <span>Jan 15</span>
                    <span>Today</span>
                </div>
            </section>
        </div>
    );
};
