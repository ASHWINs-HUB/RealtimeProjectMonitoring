import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Send, Clock, CheckCircle2, XCircle,
    Layout, Briefcase, Calendar, AlertCircle,
    FileText, ArrowRight
} from 'lucide-react';

export const StakeholderDashboard = () => {
    const { user } = useAuthStore();
    const toast = useToast();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'medium',
        deadline: '',
        budget: ''
    });

    const fetchProposals = useCallback(async () => {
        try {
            const data = await api.getProjects();
            // Filter projects where I am the creator
            setProposals(data.projects || []);
        } catch (error) {
            toast.error('Failed to load your proposals');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchProposals(); }, [fetchProposals]);

    const handleSubmitProposal = async (e) => {
        e.preventDefault();
        try {
            await api.createProject(formData);
            toast.success('Project proposal submitted!');
            setShowForm(false);
            setFormData({ name: '', description: '', priority: 'medium', deadline: '', budget: '' });
            fetchProposals();
        } catch (error) {
            toast.error(error.message || 'Submission failed');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'proposed': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'pending': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Proposals Hub</h1>
                    <p className="text-gray-500 font-medium">Welcome, {user.name}. Track your proposed projects and submit new ones.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                    <Plus size={20} />
                    PROPOSE NEW PROJECT
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 font-bold">Total Submitted</span>
                                <span className="text-xl font-black text-gray-900">{proposals.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 font-bold">In Review</span>
                                <span className="text-xl font-black text-amber-600">{proposals.filter(p => p.status === 'proposed').length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 font-bold">Approved</span>
                                <span className="text-xl font-black text-emerald-600">{proposals.filter(p => ['pending', 'active'].includes(p.status)).length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-2xl">
                        <Briefcase size={32} className="mb-4 text-indigo-200" />
                        <h3 className="text-xl font-black leading-tight mb-2">Ready to scale?</h3>
                        <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80">
                            Our AI-driven execution engine ensures your approved projects are delivered with precision.
                        </p>
                    </div>
                </div>

                {/* Proposals List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Recent Proposals</h3>
                    {proposals.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500 font-bold">No proposals submitted yet.</p>
                        </div>
                    ) : (
                        proposals.map(proposal => (
                            <motion.div
                                key={proposal.id}
                                layout
                                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(proposal.status)}`}>
                                            {proposal.status}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(proposal.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase">
                                        {proposal.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 font-medium line-clamp-1 max-w-md">
                                        {proposal.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-4 hidden md:block">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Budget</p>
                                        <p className="text-lg font-black text-gray-900">${proposal.budget || '0'}</p>
                                    </div>
                                    <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Proposal Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden border border-indigo-50"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Propose New Project</h2>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Submission Form</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-200 rounded-2xl transition-colors">
                                    <Plus className="rotate-45 text-gray-400" size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitProposal} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Project Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter a bold project title..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Project Objective</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Describe the mission of this project..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                                        <select
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Budget ($)</label>
                                        <input
                                            type="number"
                                            placeholder="Estimated budget..."
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900"
                                            value={formData.budget}
                                            onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Deadline</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-900"
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                                >
                                    <Send size={18} />
                                    SUBMIT MISSION PROPOSAL
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StakeholderDashboard;
