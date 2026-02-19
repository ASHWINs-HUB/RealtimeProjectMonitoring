import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Calendar, CheckCircle2, Clock, GitBranch,
    LayoutDashboard, ListChecks, Target, AlertTriangle,
    Github, Send, Zap, ChevronRight, Activity, TrendingUp,
    FileText, Users, Plus, Loader2, ArrowLeft, X
} from 'lucide-react';

export const ProjectDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuthStore();
    const toast = useToast();
    const [project, setProject] = useState(null);
    const [scopes, setScopes] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [risk, setRisk] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [jiraAnalytics, setJiraAnalytics] = useState(null);
    const [githubAnalytics, setGithubAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showScopeModal, setShowScopeModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [activeScope, setActiveScope] = useState(null);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [newScope, setNewScope] = useState({ title: '', description: '', team_leader_id: '', deadline: '' });
    const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', deadline: '' });

    const fetchData = useCallback(async () => {
        try {
            const [projData, scopeData, taskData, riskData, forecastData, jiraData, githubData] = await Promise.all([
                api.getProject(id),
                api.getScopes(id).catch(() => ({ scopes: [] })),
                api.getProjectTasks(id).catch(() => ({ tasks: [] })),
                api.getProjectRisk(id).catch(() => null),
                api.getCompletionForecast(id).catch(() => null),
                api.getJiraAnalytics(id).catch(() => null),
                api.getGithubAnalytics(id).catch(() => null)
            ]);
            setProject(projData.project);
            setScopes(scopeData.scopes || []);
            setTasks(taskData.tasks || []);
            setRisk(riskData?.risk || null);
            setForecast(forecastData?.forecast || null);
            setJiraAnalytics(jiraData?.analytics || null);
            setGithubAnalytics(githubData?.analytics || null);

            if (user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin') {
                const tlData = await api.getUsers('team_leader').catch(() => ({ users: [] }));
                setTeamLeaders(tlData.users || []);
            }
            if (user?.role === 'team_leader' || user?.role === 'manager' || user?.role === 'admin') {
                const devData = await api.getUsers('developer').catch(() => ({ users: [] }));
                const tlData = await api.getUsers('team_leader').catch(() => ({ users: [] }));

                // If manager, they can assign tasks to team leaders
                // If team leader, they assign to developers
                if (user?.role === 'manager') {
                    setDevelopers(tlData.users || []);
                } else {
                    setDevelopers([...(devData.users || []), ...(tlData.users || [])]);
                }
            }
        } catch (error) {
            toast.error('Failed to load project details');
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateScope = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const scopeData = {
                ...newScope,
                team_leader_id: parseInt(newScope.team_leader_id),
                deadline: newScope.deadline || null
            };
            await api.createScope(id, scopeData);
            toast.success('Scope assigned to team leader!');
            setShowScopeModal(false);
            setNewScope({ title: '', description: '', team_leader_id: '', deadline: '' });
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to assign scope');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const taskData = {
                ...newTask,
                assigned_to: parseInt(newTask.assigned_to),
                due_date: newTask.deadline || null, // Backend uses due_date
                scope_id: activeScope.id
            };
            delete taskData.deadline; // Clean up the frontend property name

            await api.createTask(id, taskData);
            toast.success('Task created successfully!');
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', assigned_to: '', priority: 'medium', deadline: '' });
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async () => {
        setSubmitting(true);
        try {
            await api.acceptProject(id);
            toast.success('Project accepted! You can now assign scopes.');
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to accept project');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!window.confirm('Are you sure you want to decline this project assignment?')) return;
        setSubmitting(true);
        try {
            await api.declineProject(id);
            toast.success('Project assignment declined');
            window.location.href = '/projects';
        } catch (error) {
            toast.error(error.message || 'Failed to decline project');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Project Not Found</h2>
                <Link to="/projects" className="text-indigo-600 font-bold mt-4 block">Back to portfolio</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Link to="/projects" className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{project.project_key}</span>
                        </div>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={14} />
                            Timeline: {new Date(project.created_at).toLocaleDateString()} — {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Continuous'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-400 uppercase">Current Phase</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{project.status?.replace('_', ' ')}</p>
                    </div>
                    {user?.role === 'manager' && project.managers?.find(m => m.manager_id === user.id)?.status === 'pending' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDecline} disabled={submitting}
                                className="px-4 py-2 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 rounded-xl transition-all"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept} disabled={submitting}
                                className="px-6 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Accept Project
                            </button>
                        </div>
                    )}
                    <div className="h-10 w-[1px] bg-gray-200 mx-2 hidden sm:block" />
                    <div className={`p-3 rounded-2xl flex items-center gap-3 ${risk?.level === 'critical' || risk?.level === 'high' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${risk?.level === 'critical' || risk?.level === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                            <Zap size={20} className="text-white" />
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase ${risk?.level === 'critical' || risk?.level === 'high' ? 'text-red-700' : 'text-emerald-700'}`}>ML Risk Score</p>
                            <p className={`text-lg font-bold ${risk?.level === 'critical' || risk?.level === 'high' ? 'text-red-900' : 'text-emerald-900'}`}>{risk?.score || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'tasks', label: 'Tasks & Scopes', icon: ListChecks },
                    { id: 'analytics', label: 'AI Insights', icon: BarChart3 },
                    { id: 'team', label: 'Contributors', icon: Users }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="py-2">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-indigo-500" />
                                    Description
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {project.description || 'No detailed description available for this project. Managers should provide a clear vision to guide the team leaders and developers.'}
                                </p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-emerald-500" />
                                        Delivery Velocity
                                    </h3>
                                    <div className="flex items-center justify-center p-6 bg-emerald-50 rounded-2xl">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-emerald-900">{forecast?.daily_velocity || '0.0'}</p>
                                            <p className="text-xs font-bold text-emerald-700 uppercase mt-1">Daily Completion %</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4 italic text-center">Calculated based on cumulative task transitions in the last 30 days.</p>
                                </section>

                                <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Target size={18} className="text-amber-500" />
                                        Forecasted Completion
                                    </h3>
                                    <div className="flex items-center justify-center p-6 bg-amber-50 rounded-2xl">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-amber-900">{forecast?.estimated_completion_date || 'N/A'}</p>
                                            <p className="text-xs font-bold text-amber-700 uppercase mt-1">Reliability: {forecast?.confidence || 0}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${forecast?.on_track ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <span className="text-xs font-bold text-gray-600">{forecast?.on_track ? 'Project is on track' : 'System predicts potential delay'}</span>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-6">Progress Snapshot</h3>
                                <div className="relative w-40 h-40 mx-auto mb-6">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (project.progress || 0)) / 100} className="text-indigo-600 transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-gray-900">{project.progress || 0}%</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Overall</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tasks Completed</span>
                                        <span className="font-bold text-gray-900">{tasks.filter(t => t.status === 'done').length} / {tasks.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Active Scopes</span>
                                        <span className="font-bold text-gray-900">{scopes.length}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4">Integrations</h3>
                                <div className="space-y-3">
                                    <div className={`p-3 rounded-xl border ${project.github ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={18} className={project.github ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span className="text-sm font-bold text-gray-900">GitHub</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase bg-white px-2 py-1 rounded-lg shadow-sm border ${project.github ? 'text-emerald-600 border-emerald-100' : 'text-gray-400 border-gray-200'}`}>
                                                {project.github ? 'Connected' : 'Not Connected'}
                                            </span>
                                        </div>
                                        {project.github && (
                                            <div className="mt-2 pt-2 border-t border-indigo-100/50 space-y-1">
                                                <a href={project.github.repo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate block">{project.github.repo_url}</a>
                                                {githubAnalytics && (
                                                    <div className="flex gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-500">{githubAnalytics.totalCommits || 0} commits</span>
                                                        <span className="text-[10px] font-bold text-gray-500">{githubAnalytics.recentContributors || 0} contributors</span>
                                                        <span className="text-[10px] font-bold text-gray-500">{githubAnalytics.pullRequests?.open || 0} open PRs</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`p-3 rounded-xl border ${project.jira ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target size={18} className={project.jira ? 'text-blue-600' : 'text-gray-400'} />
                                                <span className="text-sm font-bold text-gray-900">Jira</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase bg-white px-2 py-1 rounded-lg shadow-sm border ${project.jira ? 'text-blue-600 border-blue-100' : 'text-gray-400 border-gray-200'}`}>
                                                {project.jira ? 'Active' : 'Not Connected'}
                                            </span>
                                        </div>
                                        {project.jira && (
                                            <div className="mt-2 pt-2 border-t border-blue-100/50 space-y-1">
                                                <p className="text-xs text-blue-600 font-bold">Key: {project.jira.jira_project_key}</p>
                                                {jiraAnalytics && (
                                                    <div className="flex gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-500">{jiraAnalytics.totalIssues || 0} issues</span>
                                                        <span className="text-[10px] font-bold text-gray-500">{jiraAnalytics.issueCompletionRate || 0}% resolved</span>
                                                        <span className="text-[10px] font-bold text-gray-500">{jiraAnalytics.avgResolutionDays || 0}d avg resolution</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-8">
                        {/* Manager Actions */}
                        {(user?.role === 'manager' || user?.role === 'admin') && (
                            <div className="flex justify-between items-center bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-900">Project Scoping</h3>
                                    <p className="text-xs text-indigo-700 font-medium">Define high-level requirements and assign them to team leaders</p>
                                </div>
                                <button
                                    onClick={() => setShowScopeModal(true)}
                                    className="px-6 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                                >
                                    <Plus size={16} /> New Scope
                                </button>
                            </div>
                        )}

                        {scopes.map(scope => (
                            <div key={scope.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{scope.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">Lead: <span className="font-bold text-gray-700">{scope.team_leader_name}</span></p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {((user?.role === 'team_leader' && user?.id === scope.team_leader_id) || user?.role === 'manager' || user?.role === 'admin') && (
                                            <button
                                                onClick={() => { setActiveScope(scope); setShowTaskModal(true); }}
                                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Plus size={14} /> New Task
                                            </button>
                                        )}
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Deadline</p>
                                            <p className="text-sm font-bold text-gray-900">{new Date(scope.deadline).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-0">
                                    <table className="w-full">
                                        <thead className="bg-white border-b border-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Task</th>
                                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Assignee</th>
                                                <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {tasks.filter(t => t.scope_id === scope.id).map(task => (
                                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-gray-900">{task.title}</p>
                                                        {task.jira_key && <p className="text-[10px] font-bold text-blue-500 mt-0.5">{task.jira_key}</p>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                                {task.assignee_name?.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-700">{task.assignee_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider
                               ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                                                                task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                                                    task.status === 'blocked' ? 'bg-red-50 text-red-700' :
                                                                        'bg-gray-50 text-gray-600'}
                             `}>
                                                            {task.status?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[10px] font-bold uppercase
                               ${task.priority === 'critical' || task.priority === 'high' ? 'text-orange-600' : 'text-gray-400'}
                             `}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {tasks.filter(t => t.scope_id === scope.id).length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-sm italic">
                                                        No tasks created for this scope yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {scopes.length === 0 && (
                            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-20 text-center">
                                <ListChecks size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">No Scopes Defined</p>
                                <p className="text-sm text-gray-400 mt-1">Managers should define project scopes to initiate execution.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        {/* Row 1: ML Risk + Sprint Forecast */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120} /></div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <Activity size={24} className="text-indigo-600" /> ML Risk Analysis
                                </h3>
                                <div className="space-y-8">
                                    {risk?.factors && Object.entries(risk.factors).map(([factor, impact]) => (
                                        <div key={factor}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest capitalize">{factor.replace('_', ' ')}</span>
                                                <span className={`text-sm font-black ${impact > 0.5 ? 'text-red-500' : 'text-emerald-500'}`}>{Math.round(impact * 100)}% Impact</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${impact > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, impact * 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 mt-8">
                                        <p className="text-sm font-bold text-indigo-900 mb-2">AI Recommendation</p>
                                        <p className="text-sm text-indigo-700 leading-relaxed italic">
                                            "Based on a {risk?.score}% risk score and current velocity patterns, we recommend
                                            {risk?.score > 50 ? ' re-evaluating the critical path tasks and increasing dev capacity.' : ' continuing with the current sprint plan as factors are stable.'}"
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-white">
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
                                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                        <TrendingUp size={24} className="text-indigo-400" /> Sprint Forecast
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                            <p className="text-xs font-bold text-indigo-300 uppercase mb-3 tracking-widest">Predicted Delay Probability</p>
                                            <div className="flex items-end gap-4">
                                                <span className="text-5xl font-black text-white">{forecast?.delay_probability || 12}%</span>
                                                <span className={`text-sm font-bold mb-2 px-2 py-1 rounded-lg ${(forecast?.delay_probability || 12) > 50 ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                                                    {(forecast?.delay_probability || 12) > 50 ? 'High Risk' : 'Low Probability'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                                <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-widest">Est. Completion</p>
                                                <p className="text-lg font-bold">{forecast?.estimated_completion_date || 'N/A'}</p>
                                            </div>
                                            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                                <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-widest">Model Confidence</p>
                                                <p className="text-lg font-bold">{risk?.confidence || forecast?.confidence || 0}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Row 2: Jira Analytics */}
                        {jiraAnalytics && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <section className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Target size={18} className="text-blue-600" /> Jira Issue Status
                                    </h3>
                                    <div className="space-y-3">
                                        {jiraAnalytics.statusDistribution && Object.entries(jiraAnalytics.statusDistribution).map(([status, count]) => (
                                            <div key={status} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${status === 'Done' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-blue-500' : status === 'To Do' ? 'bg-gray-400' : 'bg-amber-500'}`} />
                                                    <span className="text-sm text-gray-700">{status}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${status === 'Done' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'}`} style={{ width: `${jiraAnalytics.totalIssues > 0 ? (count / jiraAnalytics.totalIssues) * 100 : 0}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900 w-6 text-right">{count}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!jiraAnalytics.statusDistribution || Object.keys(jiraAnalytics.statusDistribution).length === 0) && (
                                            <p className="text-sm text-gray-400 italic text-center py-4">No issues tracked yet</p>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                                            <p className="text-xl font-black text-blue-900">{jiraAnalytics.totalIssues || 0}</p>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase">Total Issues</p>
                                        </div>
                                        <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                            <p className="text-xl font-black text-emerald-900">{jiraAnalytics.issueCompletionRate || 0}%</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Completion</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-purple-600" /> Priority Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        {jiraAnalytics.priorityDistribution && Object.entries(jiraAnalytics.priorityDistribution).map(([priority, count]) => (
                                            <div key={priority} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <span className={`text-sm font-bold ${priority === 'Highest' || priority === 'High' ? 'text-red-600' : priority === 'Medium' ? 'text-amber-600' : 'text-gray-600'}`}>{priority}</span>
                                                <span className="text-sm font-black text-gray-900">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 text-center p-3 bg-amber-50 rounded-xl">
                                        <p className="text-xl font-black text-amber-900">{jiraAnalytics.avgResolutionDays || 0}</p>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase">Avg Days to Resolve</p>
                                    </div>
                                </section>

                                <section className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-indigo-600" /> Recent Jira Issues
                                    </h3>
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {jiraAnalytics.recentIssues && jiraAnalytics.recentIssues.map((issue, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-blue-600">{issue.key}</span>
                                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${issue.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : issue.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{issue.status}</span>
                                                </div>
                                                <p className="text-xs text-gray-700 line-clamp-1">{issue.summary}</p>
                                            </div>
                                        ))}
                                        {(!jiraAnalytics.recentIssues || jiraAnalytics.recentIssues.length === 0) && (
                                            <p className="text-sm text-gray-400 italic text-center py-4">No recent issues</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Row 3: GitHub Analytics */}
                        {githubAnalytics && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <section className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <GitBranch size={18} className="text-indigo-600" /> Commit Activity
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="text-center p-3 bg-indigo-50 rounded-xl">
                                            <p className="text-xl font-black text-indigo-900">{githubAnalytics.totalCommits || 0}</p>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase">Total</p>
                                        </div>
                                        <div className="text-center p-3 bg-emerald-50 rounded-xl">
                                            <p className="text-xl font-black text-emerald-900">{githubAnalytics.recentCommits || 0}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Last 30 Days</p>
                                        </div>
                                    </div>
                                    {githubAnalytics.commitsByDay && Object.keys(githubAnalytics.commitsByDay).length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Daily Commits</p>
                                            <div className="flex items-end gap-0.5 h-20">
                                                {Object.entries(githubAnalytics.commitsByDay).slice(-14).map(([day, count], i) => {
                                                    const max = Math.max(...Object.values(githubAnalytics.commitsByDay));
                                                    return (
                                                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${max > 0 ? (count / max) * 100 : 0}%` }}
                                                            className="flex-1 bg-indigo-400 hover:bg-indigo-600 rounded-t-sm transition-colors cursor-pointer relative group" title={`${day}: ${count} commits`}>
                                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{count}</div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {githubAnalytics.lastCommit && (
                                        <div className="mt-3 p-2.5 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Latest Commit</p>
                                            <p className="text-xs text-gray-700 line-clamp-1 mt-0.5">{githubAnalytics.lastCommit.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">by {githubAnalytics.lastCommit.author}</p>
                                        </div>
                                    )}
                                </section>

                                <section className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Users size={18} className="text-purple-600" /> Contributors & PRs
                                    </h3>
                                    <div className="space-y-2 mb-4">
                                        {githubAnalytics.contributors?.slice(0, 5).map((c, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <img src={c.avatar_url} alt={c.login} className="w-6 h-6 rounded-full" />
                                                    <span className="text-sm font-medium text-gray-700">{c.login}</span>
                                                </div>
                                                <span className="text-xs font-bold text-indigo-600">{c.contributions} commits</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                                        <div className="text-center p-2 bg-emerald-50 rounded-xl">
                                            <p className="text-lg font-black text-emerald-700">{githubAnalytics.pullRequests?.merged || 0}</p>
                                            <p className="text-[9px] font-bold text-emerald-600 uppercase">Merged</p>
                                        </div>
                                        <div className="text-center p-2 bg-amber-50 rounded-xl">
                                            <p className="text-lg font-black text-amber-700">{githubAnalytics.pullRequests?.open || 0}</p>
                                            <p className="text-[9px] font-bold text-amber-600 uppercase">Open</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-xl">
                                            <p className="text-lg font-black text-gray-700">{githubAnalytics.pullRequests?.closed || 0}</p>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase">Closed</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText size={18} className="text-teal-600" /> Languages
                                    </h3>
                                    <div className="space-y-3">
                                        {githubAnalytics.languages && Object.entries(githubAnalytics.languages).sort(([, a], [, b]) => b - a).map(([lang, bytes]) => {
                                            const pct = githubAnalytics.totalLanguageBytes > 0 ? ((bytes / githubAnalytics.totalLanguageBytes) * 100).toFixed(1) : 0;
                                            return (
                                                <div key={lang}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-medium text-gray-700">{lang}</span>
                                                        <span className="text-xs font-bold text-gray-500">{pct}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* No integrations message */}
                        {!jiraAnalytics && !githubAnalytics && (
                            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
                                <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">No Integration Analytics Available</p>
                                <p className="text-sm text-gray-400 mt-1">GitHub and Jira integrations provide rich analytics when connected during project creation.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...new Set(tasks.map(t => t.assignee_name))].filter(Boolean).map(name => {
                            const userTasks = tasks.filter(t => t.assignee_name === name);
                            const completed = userTasks.filter(t => t.status === 'done').length;
                            const progress = userTasks.length > 0 ? (completed / userTasks.length) * 100 : 0;

                            return (
                                <motion.div
                                    key={name}
                                    whileHover={{ y: -5 }}
                                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center"
                                >
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-black text-white shadow-lg">
                                        {name.charAt(0)}
                                    </div>
                                    <h4 className="font-bold text-gray-900">{name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Developer</p>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-400">Contribution</span>
                                            <span className="text-indigo-600">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="flex justify-around pt-2">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900">{userTasks.length}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase">Tasks</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-emerald-600">{completed}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase">Done</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {tasks.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">No assigned developers yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showScopeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Assign New Scope</h2>
                                <button onClick={() => setShowScopeModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateScope} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Scope Title</label>
                                    <input
                                        type="text" required
                                        value={newScope.title}
                                        onChange={e => setNewScope({ ...newScope, title: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Mobile API Optimization"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        rows={3}
                                        value={newScope.description}
                                        onChange={e => setNewScope({ ...newScope, description: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        placeholder="Detailed requirements for this scope..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Leader</label>
                                        <select
                                            required
                                            value={newScope.team_leader_id}
                                            onChange={e => setNewScope({ ...newScope, team_leader_id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        >
                                            <option value="">Select Leader</option>
                                            {teamLeaders.map(tl => (
                                                <option key={tl.id} value={tl.id}>{tl.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                                        <input
                                            type="date" required
                                            value={newScope.deadline}
                                            onChange={e => setNewScope({ ...newScope, deadline: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit" disabled={submitting}
                                    className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Assign Scope'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showTaskModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                                    <p className="text-xs text-gray-500">Under: {activeScope?.title}</p>
                                </div>
                                <button onClick={() => setShowTaskModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title</label>
                                    <input
                                        type="text" required
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Implement Auth Middleware"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {user?.role === 'manager' ? 'Assign To (Team Leader)' : 'Assignee'}
                                    </label>
                                    <select
                                        required
                                        value={newTask.assigned_to}
                                        onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">Select {user?.role === 'manager' ? 'Leader' : 'Developer'}</option>
                                        {developers.map(dev => (
                                            <option key={dev.id} value={dev.id}>{dev.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                                        <input
                                            type="date"
                                            value={newTask.deadline}
                                            onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit" disabled={submitting}
                                    className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Task'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
