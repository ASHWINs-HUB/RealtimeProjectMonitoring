import React, { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb, AlertTriangle, TrendingUp, Info,
    Zap, Brain, MessageSquare, ChevronRight,
    ArrowRight, ShieldCheck, Target, RefreshCw,
    Search, Filter
} from 'lucide-react';

export const InsightsPage = () => {
    const toast = useToast();
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInsights = useCallback(async () => {
        try {
            const res = await api.getInsights();
            setInsights(res.insights || []);
        } catch (error) {
            toast.error('Failed to fetch AI insights');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchInsights(); }, [fetchInsights]);

    const getInsightIcon = (type) => {
        switch (type) {
            case 'risk_alert': return <AlertTriangle className="text-rose-500" />;
            case 'burnout_warning': return <Zap className="text-amber-500" />;
            case 'overdue_tasks': return <Target className="text-indigo-500" />;
            default: return <Lightbulb className="text-emerald-500" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-rose-50 border-rose-100 text-rose-700';
            case 'medium': return 'bg-amber-50 border-amber-100 text-amber-700';
            default: return 'bg-emerald-50 border-emerald-100 text-emerald-700';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="relative">
                    <Brain size={48} className="text-indigo-600 animate-pulse" />
                    <Zap size={24} className="text-amber-400 absolute -top-2 -right-2 animate-bounce" />
                </div>
                <p className="text-gray-500 font-bold animate-pulse">Consulting AI Models...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-end justify-between border-b border-gray-100 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                            <Brain size={20} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900">AI Logic Studio</h1>
                    </div>
                    <p className="text-gray-500 text-lg">Machine-generated insights and actionable recommendations.</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchInsights(); }}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-500 hover:text-indigo-600"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 gap-6">
                {insights.length === 0 ? (
                    <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[32px] p-20 text-center">
                        <ShieldCheck size={64} className="mx-auto text-emerald-300 mb-6" />
                        <h3 className="text-xl font-bold text-emerald-900">All Systems Stable</h3>
                        <p className="text-emerald-700 mt-2 max-w-md mx-auto">Our AI models haven't detected any critical risks or burnout signals across your current projects.</p>
                    </div>
                ) : (
                    insights.map((insight, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all overflow-hidden flex flex-col md:flex-row"
                        >
                            <div className={`md:w-3 center flex items-center justify-center ${insight.severity === 'high' ? 'bg-rose-500' :
                                    insight.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />

                            <div className="p-8 flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            {getInsightIcon(insight.type)}
                                        </div>
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getSeverityColor(insight.severity)}`}>
                                                {insight.severity} Priority
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-900 mt-1">{insight.title}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {insight.details && (
                                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                                            <ul className="space-y-3">
                                                {Array.isArray(insight.details) ? insight.details.map((detail, di) => (
                                                    <li key={di} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 font-medium">{detail.name || detail.title}</span>
                                                        <span className="font-black text-gray-900">
                                                            {detail.risk_score || detail.burnout_score}% Index
                                                        </span>
                                                    </li>
                                                )) : (
                                                    <li className="text-sm text-gray-600">{insight.details}</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                                <MessageSquare size={16} className="text-emerald-600" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">Recommended Action: <span className="text-indigo-600 font-black">{insight.action}</span></p>
                                        </div>
                                        <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all text-sm group">
                                            Address Now
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* AI Vision Banner */}
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-300">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black mb-4">Autonomous Risk Guard</h2>
                        <p className="text-indigo-100 text-lg leading-relaxed mb-8">
                            ProjectPulse employs specialized agents that monitor task complexity, workload patterns, and delivery velocity 24/7.
                            When certain thresholds are met, the AI Logic Studio automatically generates these studio cards.
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-4 border-indigo-600 bg-indigo-400" />
                                ))}
                            </div>
                            <p className="text-sm font-bold opacity-80">Join 3,400+ managers using AI oversight</p>
                        </div>
                    </div>
                    <div className="w-full md:w-64 h-64 bg-white/10 backdrop-blur-3xl rounded-[40px] border border-white/20 p-8 flex flex-col justify-center">
                        <TrendingUp size={48} className="mb-4 text-emerald-400" />
                        <p className="text-2xl font-black">94.2%</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Prediction Accuracy</p>
                    </div>
                </div>
            </section>
        </div>
    );
};
