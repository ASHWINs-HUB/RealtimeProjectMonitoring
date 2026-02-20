import React from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

const RADIAN = Math.PI / 180;

export const TrendChart = ({ data, color = "#6366f1" }) => (
    <div className="h-64 w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Risk Trend (Last 30 Days)</h4>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter italic">Live Analysis</span>
            </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        padding: '12px'
                    }}
                    itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                    animationDuration={2000}
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

export const ComparisonChart = ({ data, category = "Team Progress" }) => (
    <div className="h-64 w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3 mb-6">{category}</h4>
        <ResponsiveContainer width="100%" height="80%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar
                    dataKey="value"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                    animationDuration={1500}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#a855f7'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export const DistributionChart = ({ data }) => {
    const COLORS = ['#6366f1', '#a855f7', '#f43f5e', '#fbbf24'];

    return (
        <div className="h-64 w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3 mb-2">Category Distribution</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={500}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const HeatmapChart = ({ data }) => {
    // Heatmap usually implementation varies, but we'll use a stylized grid for "Commit Activity"
    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3 mb-6">Activity Heatmap</h4>
            <div className="grid grid-cols-7 gap-2">
                {[...Array(28)].map((_, i) => {
                    const opacity = Math.random() * 0.8 + 0.1;
                    return (
                        <div
                            key={i}
                            className="aspect-square rounded-md bg-indigo-500 hover:scale-110 transition-transform cursor-pointer"
                            style={{ opacity }}
                            title={`Activity Rank: ${Math.floor(opacity * 10)}`}
                        />
                    );
                })}
            </div>
            <div className="mt-4 flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <span>Less Activity</span>
                <span>Elite Burst</span>
            </div>
        </div>
    );
};
