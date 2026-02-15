import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { FolderKanban, Plus } from 'lucide-react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectFilters } from '@/components/projects/ProjectFilters'
import { ProjectActions } from '@/components/projects/ProjectActions'
import apiService from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export const ProjectsPage = () => {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    apiService.getProjects().then(setProjects).finally(() => setLoading(false))
  }, [])

  const handleOpenModal = (project = null) => {
    setEditingProject(project)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProject(null)
  }

  const handleProjectCreated = (newProject) => {
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? newProject : p))
    } else {
      setProjects([newProject, ...projects])
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleFilter = () => {
    // Filter logic can be implemented here
  }

  const handleAssignLeader = (projectId) => {
    // Open assign modal logic
    console.log('Assign leader for project:', projectId)
  }

  const handleManageGitHub = (project) => {
    // Open GitHub management modal
    console.log('Manage GitHub for project:', project)
  }

  const handleViewOffers = (projectId) => {
    // Navigate to offers page
    console.log('View offers for project:', projectId)
  }

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleOpenModal()}>
            <Plus size={20} className="mr-2" />
            New Project
          </Button>
        )}
      </div>

      <ProjectFilters onSearch={handleSearch} onFilter={handleFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No projects found.</div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="relative">
              <ProjectCard 
                project={project} 
                user={user}
                onApprove={(id) => console.log('Approve:', id)}
                onReject={(id) => console.log('Reject:', id)}
                onAssignLeader={handleAssignLeader}
                onManageGitHub={handleManageGitHub}
              />
              <div className="absolute top-2 right-2">
                <ProjectActions
                  project={project}
                  user={user}
                  onAssignLeader={handleAssignLeader}
                  onManageGitHub={handleManageGitHub}
                  onViewOffers={handleViewOffers}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <ProjectForm
        showModal={showModal}
        onClose={handleCloseModal}
        onProjectCreated={handleProjectCreated}
        project={editingProject}
      />
    </motion.div>
  )
}
