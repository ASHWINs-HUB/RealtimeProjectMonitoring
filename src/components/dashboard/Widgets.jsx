import React from 'react';
import { motion } from 'framer-motion';

export const RiskScoreCard = ({ score = 0, label = "Risk Score", size = "md" }) => {
    const getRiskColor = (s) => {
        if (s < 40) return '#10b981'; // Emerald/Green
        if (s < 70) return '#f59e0b'; // Amber/Yellow
        return '#ef4444'; // Red/Danger
    };

    const getRiskbg = (s) => {
        if (s < 40) return 'rgba(16, 185, 129, 0.1)';
        if (s < 70) return 'rgba(245, 158, 11, 0.1)';
        return 'rgba(239, 68, 68, 0.1)';
    };

    const color = getRiskColor(score);
    const bgColor = getRiskbg(score);

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const sizeClass = size === "lg" ? "w-64 h-64" : "w-48 h-48";

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 transition-colors duration-500`} style={{ backgroundColor: color }} />

            <div className="relative z-10 flex flex-col items-center">
                <div className={`relative ${sizeClass} flex items-center justify-center`}>
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            fill="transparent"
                            stroke="#f1f5f9"
                            strokeWidth="12"
                            className="transition-all duration-500"
                        />
                        <motion.circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            fill="transparent"
                            stroke={color}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-4xl font-black tracking-tighter text-slate-900"
                        >
                            {Math.round(score)}%
                        </motion.span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Risk Level</span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{label}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ backgroundColor: bgColor, color: color }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                        {score < 40 ? 'Safe Horizon' : score < 70 ? 'Warning Zone' : 'Danger Protocol'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const KPICard = ({ title, value, trend, trendValue, icon: Icon, colorClass = "indigo" }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${colorClass}-50 text-${colorClass}-600`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                    {trend === 'up' ? '↑' : '↓'} {trendValue}%
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
            </div>

            {/* Mini Sparkline Mockup */}
            <div className="mt-4 h-8 flex items-end gap-1 opacity-20">
                {[2, 4, 3, 5, 4, 6, 8, 7, 9, 7].map((h, i) => (
                    <div key={i} className={`flex-1 bg-${colorClass}-600 rounded-t-sm`} style={{ height: `${h * 10}%` }} />
                ))}
            </div>
        </motion.div>
    );
};

export const AlertWidget = ({ type = 'warning', title, message }) => {
    const isDanger = type === 'danger';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative overflow-hidden p-5 rounded-3xl border-l-[6px] ${isDanger
                    ? 'bg-rose-50/50 border-rose-500 shadow-xl shadow-rose-500/10'
                    : 'bg-amber-50/50 border-amber-500 shadow-xl shadow-amber-500/10'
                }`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${isDanger ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-white'}`}>
                    <Zap size={18} className={isDanger ? 'fill-current' : ''} />
                </div>
                <div>
                    <h4 className={`text-sm font-black uppercase tracking-tight ${isDanger ? 'text-rose-900' : 'text-amber-900'}`}>
                        {title}
                    </h4>
                    <p className={`text-[13px] font-medium leading-relaxed mt-1 ${isDanger ? 'text-rose-700' : 'text-amber-700'}`}>
                        {message}
                    </p>
                </div>
            </div>

            {isDanger && (
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Zap size={80} className="text-rose-600" />
                </div>
            )}
        </motion.div>
    );
};
