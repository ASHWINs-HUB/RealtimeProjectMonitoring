import React from 'react';
import { motion } from 'framer-motion';
import {
    Award, Zap, Bird, History, ShieldAlert, FastForward,
    GitBranch, CheckCircle2, Ghost, Sparkles, Trophy, Milestone
} from 'lucide-react';

const BADGE_MAP = {
    'EARLY_BIRD': { icon: Milestone, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    'ON_TIME_NINJA': { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    'LATE_RECOVERY': { icon: History, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    'CRITICAL_SMASHER': { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    'HIGH_SPEED_DEV': { icon: FastForward, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'FIRST_COMMIT': { icon: GitBranch, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'TASK_MASTER': { icon: CheckCircle2, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
    'BUG_HUNTER': { icon: Ghost, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
    'CODE_PURIST': { icon: Sparkles, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    'RELIABLE_DEV': { icon: Award, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100' },
};

export const BadgeGrid = ({ badges = [], size = 'md' }) => {
    if (!badges || badges.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <Trophy size={32} className="text-slate-300 mb-2 opacity-50" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No milestones achieved yet</p>
            </div>
        );
    }

    const containerSize = size === 'sm' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5';
    const cardPadding = size === 'sm' ? 'p-3' : 'p-4';
    const iconContainerSize = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
    const iconSize = size === 'sm' ? 18 : 24;

    return (
        <div className={`grid ${containerSize} gap-4`}>
            {badges.map((badge, idx) => {
                const config = BADGE_MAP[badge.code] || { icon: Trophy, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' };
                const Icon = config.icon;

                return (
                    <motion.div
                        key={badge.id || idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`
                            relative flex flex-col items-center text-center ${cardPadding} rounded-2xl bg-white border ${config.border}
                            hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group cursor-default
                        `}
                    >
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 rounded-2xl ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity -z-10`} />

                        <div className={`
                            ${iconContainerSize} rounded-xl ${config.bg} flex items-center justify-center mb-3 shadow-inner
                            group-hover:scale-110 transition-transform duration-500
                        `}>
                            <Icon size={iconSize} className={`${config.color} group-hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">
                                {badge.name}
                            </p>
                            {badge.earned_at && (
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {new Date(badge.earned_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                                </p>
                            )}
                        </div>

                        {/* XP Reward Indicator */}
                        {badge.xp_reward && (
                            <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform">
                                +{badge.xp_reward} XP
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};
