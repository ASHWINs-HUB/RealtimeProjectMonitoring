import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import {
  Search, Filter, Plus, ChevronRight, FolderKanban,
  GitBranch, Target, AlertTriangle, CheckCircle2,
  Calendar, Users, BarChart3, Clock, X, Loader2,
  ThumbsUp, ThumbsDown, Eye, User
} from 'lucide-react';

export const ProjectsPage = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [newProject, setNewProject] = useState({
    name: '', description: '', project_key: '', deadline: '',
    create_github_repo: true, create_jira_project: true,
    manager_ids: []
  });

  const fetchProjects = useCallback(async () => {
    try {
      const [projData, usersData] = await Promise.all([
        api.getProjects(),
        api.getUsers('manager').catch(() => ({ users: [] }))
      ]);
      setProjects(projData.projects || []);
      setManagers(usersData.users || []);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createProject(newProject);
      toast.success('Project created successfully!');
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', project_key: '', deadline: '', create_github_repo: true, create_jira_project: true, manager_ids: [] });
      fetchProjects();
    } catch (error) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveProject = async () => {
    setApproving(true);
    try {
      await api.approveProject(selectedProject.id, {
        manager_ids: selectedProject.manager_ids || [],
        create_github_repo: true,
        github_repo_private: false
      });
      toast.success('Project proposal approved!');
      setShowApprovalModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      toast.error(error.message || 'Failed to approve project');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectProject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setApproving(true);
    try {
      await api.rejectProject(selectedProject.id, rejectionReason);
      toast.success('Project proposal rejected');
      setShowApprovalModal(false);
      setSelectedProject(null);
      setRejectionReason('');
      fetchProjects();
    } catch (error) {
      toast.error(error.message || 'Failed to reject project');
    } finally {
      setApproving(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.project_key?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-gray-500 mt-1">Manage and track all corporate projects</p>
        </div>
        {user?.role === 'hr' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all text-sm"
          >
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name or key..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'completed', 'proposed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <FolderKanban size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-lg">No projects match your criteria</p>
            <button onClick={() => { setSearch(''); setFilter('all'); }} className="text-indigo-600 font-bold mt-2">Clear all filters</button>
          </div>
        ) : (
          filteredProjects.map(project => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group p-6 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FolderKanban size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${project.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  project.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    project.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                      project.status === 'proposed' ? 'bg-purple-50 text-purple-700' :
                        'bg-gray-50 text-gray-600'
                  }`}>
                  {project.status?.replace('_', ' ')}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-xs font-bold text-indigo-500 mb-3">{project.project_key}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                  {project.description || 'No description provided for this project.'}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold text-gray-400">Project Vitality</span>
                  <span className="text-sm font-bold text-gray-900">{project.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        +
                      </div>
                    </div>
                    {project.creator_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={12} />
                        <span>{project.creator_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role === 'hr' && project.status === 'proposed' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowApprovalModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          <ThumbsUp size={14} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowApprovalModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 font-bold rounded-xl text-sm hover:bg-red-600 hover:text-white transition-all"
                        >
                          <ThumbsDown size={14} /> Reject
                        </button>
                      </>
                    )}
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      {user?.role === 'hr' && project.status === 'proposed' ? 'Review' : 'Manage'} <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Create New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Project Name</label>
                <input
                  type="text" id="project-name" required
                  value={newProject.name}
                  onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-bold"
                  placeholder="E-Commerce Platform"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Key (3-5 uppercase letters)</label>
                <input
                  type="text" id="project-key" required maxLength={5}
                  value={newProject.project_key}
                  onChange={e => setNewProject(prev => ({ ...prev, project_key: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="ECOM"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                <textarea
                  id="project-description" rows={2}
                  value={newProject.description}
                  onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                  placeholder="Brief project objective..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Manager(s)</label>
                <select
                  multiple
                  id="manager-selection"
                  value={newProject.manager_ids}
                  onChange={e => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                    setNewProject(prev => ({ ...prev, manager_ids: selectedIds }));
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[100px]"
                >
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.department || 'N/A'})</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple managers</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                <input
                  type="date" id="project-deadline"
                  value={newProject.deadline}
                  onChange={e => setNewProject(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Integration toggles */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Integrations</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" id="create-jira"
                    checked={newProject.create_jira_project}
                    onChange={e => setNewProject(prev => ({ ...prev, create_jira_project: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Create Jira Project (auto-sync issues)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" id="create-github"
                    checked={newProject.create_github_repo}
                    onChange={e => setNewProject(prev => ({ ...prev, create_github_repo: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Create GitHub Repository</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" id="submit-project" disabled={creating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Create</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Approval/Rejection Modal for HR */}
      {showApprovalModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Project Proposal</h2>
                <p className="text-sm text-gray-500 mt-1">Stakeholder: {selectedProject.creator_name}</p>
              </div>
              <button onClick={() => {
                setShowApprovalModal(false);
                setSelectedProject(null);
                setRejectionReason('');
              }} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">{selectedProject.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedProject.description}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Budget: ${selectedProject.budget || 'Not specified'}</span>
                  <span>Priority: {selectedProject.priority || 'Medium'}</span>
                  {selectedProject.deadline && <span>Deadline: {new Date(selectedProject.deadline).toLocaleDateString()}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Manager(s)</label>
                <select
                  multiple
                  value={selectedProject.manager_ids || []}
                  onChange={e => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                    setSelectedProject(prev => ({ ...prev, manager_ids: selectedIds }));
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[100px]"
                >
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.department || 'N/A'})</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple managers</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rejection Reason (if rejecting)</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Provide a reason for rejection..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedProject(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectProject}
                  disabled={approving}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approving ? <Loader2 size={18} className="animate-spin" /> : <><ThumbsDown size={18} /> Reject</>}
                </button>
                <button
                  onClick={handleApproveProject}
                  disabled={approving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approving ? <Loader2 size={18} className="animate-spin" /> : <><ThumbsUp size={18} /> Approve</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
