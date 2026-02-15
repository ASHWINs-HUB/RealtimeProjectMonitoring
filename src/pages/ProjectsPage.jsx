import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FolderKanban, Plus, Search, Filter, MoreHorizontal, X } from 'lucide-react'
import apiService from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export const ProjectsPage = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    jira_project_key: '',
    jira_project_name: '',
    description: '',
    repo_name: '',
    deadline: ''
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  // Assignment modal state
  const [assignModal, setAssignModal] = useState({ open: false, projectId: null });
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Fetch team leaders for assignment
  const openAssignModal = async (projectId) => {
    setAssignError('');
    setSelectedLeader('');
    setAssignModal({ open: true, projectId });
    try {
      const users = await apiService.getUsers('team_leader');
      setTeamLeaders(users);
    } catch {
      setTeamLeaders([]);
    }
  };
  const closeAssignModal = () => setAssignModal({ open: false, projectId: null });

  const handleAssignLeader = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssigning(true);
    try {
      if (!selectedLeader) {
        setAssignError('Please select a team leader');
        setAssigning(false);
        return;
      }
      const updated = await apiService.request(`/projects/${assignModal.projectId}/team`, {
        method: 'POST',
        body: JSON.stringify({ github_username: selectedLeader })
      });
      setProjects(projects.map(p => p.id === assignModal.projectId ? { ...p, ...updated } : p));
      setAssignModal({ open: false, projectId: null });
    } catch (err) {
      setAssignError(err.message || 'Failed to assign team leader');
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    apiService.getProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  // Manager: Approve/Reject project
  const handleApprove = async (projectId) => {
    try {
      const updated = await apiService.request(`/projects/${projectId}/approve`, { method: 'PUT' });
      setProjects(projects.map(p => p.id === projectId ? { ...p, ...updated } : p));
    } catch (err) {
      alert('Failed to approve project: ' + (err.message || 'Error'));
    }
  };
  const handleReject = async (projectId) => {
    try {
      const updated = await apiService.request(`/projects/${projectId}/reject`, { method: 'PUT' });
      setProjects(projects.map(p => p.id === projectId ? { ...p, ...updated } : p));
    } catch (err) {
      alert('Failed to reject project: ' + (err.message || 'Error'));
    }
  };

  const handleOpenModal = () => {
    setForm({ jira_project_key: '', jira_project_name: '' });
    setFormError('');
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      if (!form.jira_project_key || !form.jira_project_name) {
        setFormError('Project key and name are required');
        setCreating(false);
        return;
      }

      const payload = {
        jira_project_key: form.jira_project_key.trim(),
        jira_project_name: form.jira_project_name.trim(),
        description: form.description.trim() || undefined,
        repo_name: form.repo_name.trim() || undefined,
        deadline: form.deadline || undefined
      };

      const res = await apiService.createProject(payload);

      // API returns { project, jira } from backend controller
      const created = res.project || res;
      setProjects([created, ...projects]);

      if (res.jira) {
        // quick user feedback that JIRA project was created
        alert(`JIRA project created: ${res.jira.key || form.jira_project_key}`);
      }

      setShowModal(false);
      setForm({ jira_project_key: '', jira_project_name: '', description: '', repo_name: '', deadline: '' });
    } catch (err) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TRACK': return 'bg-green-100 text-green-600';
      case 'AT_RISK': return 'bg-yellow-100 text-yellow-600';
      case 'DELAYED': return 'bg-red-100 text-red-600';
      case 'PLANNING': return 'bg-blue-100 text-blue-600';
      case 'PENDING': return 'bg-gray-100 text-gray-600';
      case 'APPROVED': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  const getRiskColor = (risk) => {
    if (risk < 20) return 'text-green-600';
    if (risk < 50) return 'text-yellow-600';
    if (risk < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage all your projects</p>
        </div>
        {user?.role === 'hr' && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleOpenModal}>
            <Plus size={20} className="mr-2" />
            New Project
          </Button>
        )}
      </div>
      {/* Modal for HR to create project */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button className="absolute top-2 right-2 p-1" onClick={handleCloseModal}><X size={20} /></button>
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jira Project Key</label>
                <input type="text" name="jira_project_key" value={form.jira_project_key} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="E.g. PROJ" required />
                <div className="text-xs text-gray-400 mt-1">Unique project key (used by JIRA and analytics).</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Jira Project Name</label>
                <input type="text" name="jira_project_name" value={form.jira_project_name} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Full project name" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="One-line summary for dashboards / README"></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Repository name (optional)</label>
                  <input name="repo_name" value={form.repo_name} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="org/repo-name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team members (comma separated)</label>
                  <input name="team_members" value={form.team_members} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="alice@example.com, bob@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline (optional)</label>
                  <input type="date" name="deadline" value={form.deadline} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {creating ? 'Creating project…' : 'Create project and JIRA'}
                  </Button>
                </div>
              </div>

              {formError && <div className="text-red-600 text-sm">{formError}</div>}
            </form>
          </div>
        </div>
      )}
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search projects..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <Button variant="outline" size="sm"><Filter size={16} className="mr-1" />Filter</Button>
        </div>
      </div>
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No projects found.</div>
        ) : projects.map(project => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: project.id * 0.1 }}
          >
            <Card className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">{project.jira_project_name}</CardTitle>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>{project.status}</span>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Key:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{project.jira_project_key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Risk Score:</span>
                    <span className={`font-semibold ${getRiskColor(project.risk_score || 0)}`}>{project.risk_score || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role === 'manager' && project.status === 'APPROVED' && (
                      <Button size="sm" variant="primary" onClick={() => openAssignModal(project.id)}>
                        Assign Team Leader
                      </Button>
                    )}
                    {project.github_repo_url && (
                      <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 underline text-xs">GitHub Repo</a>
                    )}
                    {project.jira_project_key && import.meta.env.VITE_JIRA_BASE_URL && (
                      <a href={`${import.meta.env.VITE_JIRA_BASE_URL}/browse/${project.jira_project_key}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-600 underline text-xs">JIRA</a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Assign Team Leader Modal */}
            {assignModal.open && assignModal.projectId === project.id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                  <button className="absolute top-2 right-2 p-1" onClick={closeAssignModal}><X size={20} /></button>
                  <h2 className="text-xl font-bold mb-4">Assign Team Leader</h2>
                  <form onSubmit={handleAssignLeader} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Select Team Leader</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={selectedLeader} onChange={e => setSelectedLeader(e.target.value)} required>
                        <option value="">-- Select --</option>
                        {teamLeaders.map(tl => (
                          <option key={tl.id} value={tl.github_username || tl.email}>{tl.name} ({tl.github_username || tl.email})</option>
                        ))}
                      </select>
                    </div>
                    {assignError && <div className="text-red-600 text-sm">{assignError}</div>}
                    <Button type="submit" disabled={assigning} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      {assigning ? 'Assigning...' : 'Assign'}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
