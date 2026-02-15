import React, { useState, useEffect } from 'react'
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
  const [form, setForm] = useState({ jira_project_key: '', jira_project_name: '' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      if (!form.jira_project_key || !form.jira_project_name) {
        setFormError('All fields are required');
        setCreating(false);
        return;
      }
      const newProject = await apiService.createProject(form);
      setProjects([newProject, ...projects]);
      setShowModal(false);
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
                <input type="text" name="jira_project_key" value={form.jira_project_key} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jira Project Name</label>
                <input type="text" name="jira_project_name" value={form.jira_project_name} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button variant="secondary" className="w-full sm:w-auto">
              <Filter size={20} className="mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-10">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: project.id * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FolderKanban className="text-indigo-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.jira_project_name || project.name}</h3>
                        <p className="text-sm text-gray-600">{project.team || ''}</p>
                      </div>
                    </div>
                    {user?.role === 'manager' && project.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleApprove(project.id)}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(project.id)}>Reject</Button>
                      </div>
                    )}
                    {user?.role === 'manager' && project.status === 'APPROVED' && (
                      <Button size="sm" variant="primary" onClick={() => openAssignModal(project.id)}>
                        Assign Team Leader
                      </Button>
                    )}
                    {project.github_repo_url && (
                      <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 underline text-xs">GitHub Repo</a>
                    )}
                        {/* Assign Team Leader Modal */}
                        {assignModal.open && (
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
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className={`text-sm font-medium ${getRiskColor(project.risk || 0)}`}>
                        {project.risk || 0}% Risk
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Deadline</span>
                      <span className="font-medium">{project.deadline || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
