import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import {
    RiskScoreCard, KPICard, AlertWidget
} from '@/components/dashboard/Widgets';
import {
    TrendChart, ComparisonChart, DistributionChart, HeatmapChart
} from '@/components/dashboard/Charts';
import {
    Users, Activity, GitPullRequest, Code2, AlertCircle,
    Clock, TrendingUp, Bug, CheckCircle2, RefreshCw, Zap, ShieldCheck,
    FolderKanban, BarChart3, Lightbulb
} from 'lucide-react';

const mockTrendData = [
    { name: 'Mon', value: 34 }, { name: 'Tue', value: 45 }, { name: 'Wed', value: 38 },
    { name: 'Thu', value: 52 }, { name: 'Fri', value: 48 }, { name: 'Sat', value: 42 }, { name: 'Sun', value: 39 }
];

const mockComparisonData = [
    { name: 'Alpha', value: 85 }, { name: 'Beta', value: 72 }, { name: 'Delta', value: 91 }, { name: 'Gamma', value: 64 }
];

const mockDistData = [
    { name: 'Critical', value: 15 }, { name: 'High', value: 25 }, { name: 'Medium', value: 40 }, { name: 'Low', value: 20 }
];

export const SmartDashboard = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-48 bg-slate-100 rounded-[2rem]" />
                ))}
            </div>
        );
    }

    const renderDeveloperWidgets = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RiskScoreCard score={28} label="Personal Delivery Risk" />
                <div className="lg:col-span-2 space-y-6">
                    <AlertWidget
                        title="PR Performance Optimization"
                        message="Your last 3 PRs have 40% higher review latency than the team average. Consider breaking down tasks into smaller atomic commits."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <KPICard title="Your Commit Freq" value="12.4/day" trend="up" trendValue={12} icon={Code2} />
                        <KPICard title="Avg Review Time" value="4.2h" trend="down" trendValue={8} icon={Clock} colorClass="amber" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrendChart data={mockTrendData} />
                <HeatmapChart />
            </div>
        </div>
    );

    const renderTeamLeaderWidgets = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                    <RiskScoreCard score={45} label="Squad Operational Risk" size="lg" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <KPICard title="PR Rejection Rate" value="14.2%" trend="up" trendValue={5} icon={GitPullRequest} colorClass="rose" />
                    <KPICard title="Bug Reopen Rate" value="3.1%" trend="down" trendValue={18} icon={Bug} colorClass="emerald" />
                    <KPICard title="Blocked Issues" value="7" trend="up" trendValue={24} icon={AlertCircle} colorClass="amber" />
                    <KPICard title="Velocity Velocity" value="42pts" trend="up" trendValue={2} icon={TrendingUp} />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ComparisonChart data={mockComparisonData} category="Member Performance Index" />
                </div>
                <AlertWidget
                    type="danger"
                    title="Critical Sprint Obstruction"
                    message="3 core dependencies are currently blocked by the Infrastructure team. Sprint commitment is at 45% risk."
                />
            </div>
        </div>
    );

    const renderManagerWidgets = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <RiskScoreCard score={62} label="Portfolio Delivery Risk" size="lg" />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <KPICard title="Overall Predictability" value="88%" trend="down" trendValue={4} icon={Activity} />
                        <KPICard title="System Efficiency" value="94.2%" trend="up" trendValue={1} icon={Zap} colorClass="amber" />
                    </div>
                    <AlertWidget
                        title="Resource Reallocation Required"
                        message="Machine Learning Hub is severely under-resourced for the current sprint cycle. Predictability is dropping."
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendChart data={mockTrendData} />
                <DistributionChart data={mockDistData} />
            </div>
        </div>
    );

    const renderHRWidgets = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <RiskScoreCard score={14} label="Talent Burnout Index" size="lg" />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <KPICard title="Employee Satisfaction" value="4.8/5" trend="up" trendValue={2} icon={Users} colorClass="emerald" />
                        <KPICard title="Attrtion Risk" value="Minimal" trend="down" trendValue={100} icon={ShieldCheck} colorClass="indigo" />
                    </div>
                    <AlertWidget
                        title="Cultural Alignment Peak"
                        message="Team cohesion metrics are at an all-time high following the recent remote-work flexibility update."
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3 mb-8">Workforce Burnout Heatmap</h4>
                    <HeatmapChart />
                </div>
                <TrendChart data={mockTrendData} color="#f43f5e" />
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pb-20"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Command <span className="text-indigo-600">Center</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.3em] mt-2">
                        {user.role} <span className="mx-2 opacity-20">|</span> Intelligence Stream v2.4.0
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 text-indigo-600">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Sync Active</span>
                    </div>
                    <button className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-indigo-600">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {user.role === 'developer' && renderDeveloperWidgets()}
            {user.role === 'team_leader' && renderTeamLeaderWidgets()}
            {user.role === 'manager' && renderManagerWidgets()}
            {user.role === 'hr' && renderHRWidgets()}
            {user.role === 'admin' && renderManagerWidgets()} {/* fallback for admin */}
        </motion.div>
    );
};
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';
