import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'
import apiService from '@/services/api'

export const ProjectForm = ({ showModal, onClose, onProjectCreated, project }) => {
  const [form, setForm] = useState({
    jira_project_key: project?.project_key || '',
    jira_project_name: project?.name || '',
    description: project?.description || '',
    repo_name: project?.repo_name || '',
    deadline: project?.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
  })
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    const newForm = { ...form, [name]: type === 'checkbox' ? checked : value }
    
    // Auto-generate project key when project name changes
    if (name === 'jira_project_name') {
      const generatedKey = generateProjectKey(value)
      if (!form.jira_project_key || form.jira_project_key === generateProjectKey(form.jira_project_name)) {
        newForm.jira_project_key = generatedKey
      }
    }
    
    setForm(newForm)
  }

  const generateProjectKey = (projectName) => {
    if (!projectName) return ''
    const words = projectName.trim().split(/\s+/)
    const key = words.map(word => word.charAt(0).toUpperCase()).join('')
    return key.slice(0, 10)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    try {
      if (!form.jira_project_key || !form.jira_project_name) {
        setFormError('Project key and name are required')
        setCreating(false)
        return
      }

      const payload = {
        jira_project_key: form.jira_project_key.trim(),
        jira_project_name: form.jira_project_name.trim(),
        description: form.description.trim() || undefined,
        repo_name: form.repo_name.trim() || undefined,
        deadline: form.deadline || undefined
      }

      console.log('Creating project with payload:', payload)
      const res = await apiService.createProject(payload)
      console.log('Project creation response:', res)

      const created = res.project || res
      console.log('Created project:', created)
      onProjectCreated(created)

      if (res.jira) {
        alert(`JIRA project created: ${res.jira.key || form.jira_project_key}`)
      }

      onClose()
      setForm({ jira_project_key: '', jira_project_name: '', description: '', repo_name: '', deadline: '' })
    } catch (err) {
      console.error('Project creation error:', err)
      setFormError(err.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-2 p-1" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">
          {project ? 'Edit Project' : 'Create New Project'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              type="text"
              name="jira_project_name"
              value={form.jira_project_name}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Enter project name"
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              Project key will be auto-generated from name
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project Key</label>
            <input
              type="text"
              name="jira_project_key"
              value={form.jira_project_key}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Auto-generated or enter manually"
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              {form.jira_project_key && form.jira_project_name && 
               form.jira_project_key === generateProjectKey(form.jira_project_name)
                ? '✓ Auto-generated from project name'
                : 'Manually entered or modified'
              }
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="One-line summary for dashboards / README"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Repository name (optional)</label>
              <input
                name="repo_name"
                value={form.repo_name}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="org/repo-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deadline (optional)</label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {creating ? 'Creating project…' : project ? 'Update project' : 'Create project'}
              </Button>
            </div>
          </div>

          {formError && <div className="text-red-600 text-sm">{formError}</div>}
        </form>
      </div>
    </div>
  )
}
