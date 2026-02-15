import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { 
  Github, 
  Plus, 
  Search, 
  Settings, 
  Activity,
  Users,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react'
import apiService from '@/services/api'

export const GitHubIntegration = () => {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [creatingRepo, setCreatingRepo] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    private: false,
    autoInit: true
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const repos = await apiService.getGitHubRepos()
      setRepositories(repos)
    } catch (err) {
      setError('Failed to fetch repositories. Please check your GitHub token.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRepository = async (e) => {
    e.preventDefault()
    setCreatingRepo(true)
    setError('')
    setSuccess('')

    try {
      const createdRepo = await apiService.createGitHubRepo(newRepo)
      setRepositories([createdRepo, ...repositories])
      setSuccess('Repository created successfully!')
      setShowCreateForm(false)
      setNewRepo({ name: '', description: '', private: false, autoInit: true })
    } catch (err) {
      setError(err.message || 'Failed to create repository')
    } finally {
      setCreatingRepo(false)
    }
  }

  const handleConnectRepository = async (repo) => {
    try {
      // This would connect the repository to a project
      await apiService.request('/integrations/github/connect', {
        method: 'POST',
        body: JSON.stringify({
          repo_url: repo.html_url,
          repo_name: repo.full_name,
          private: repo.private
        })
      })
      setSuccess(`Repository ${repo.name} connected successfully!`)
    } catch (err) {
      setError('Failed to connect repository')
    }
  }

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">GitHub Integration</h1>
          <p className="text-gray-600">Manage your repositories and connect them to projects</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gray-900 hover:bg-gray-800"
        >
          <Plus size={20} className="mr-2" />
          Create Repository
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle size={20} className="text-red-600 mr-3" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle size={20} className="text-green-600 mr-3" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Create Repository Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowCreateForm(false)}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
            >
              <span className="text-gray-500">×</span>
            </button>
            <h2 className="text-xl font-bold mb-4">Create New Repository</h2>
            <form onSubmit={handleCreateRepository} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Repository Name</label>
                <input
                  type="text"
                  value={newRepo.name}
                  onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="my-awesome-project"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newRepo.description}
                  onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Project description..."
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRepo.private}
                    onChange={(e) => setNewRepo({ ...newRepo, private: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Private repository</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRepo.autoInit}
                    onChange={(e) => setNewRepo({ ...newRepo, autoInit: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Initialize with README</span>
                </label>
              </div>
              <Button
                type="submit"
                disabled={creatingRepo}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                {creatingRepo ? 'Creating...' : 'Create Repository'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading repositories...</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Github size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first repository to get started'}
            </p>
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Github size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {repo.private && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Private</span>
                        )}
                        <span>{repo.language || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {repo.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{repo.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <GitBranch size={16} />
                        <span>{repo.forks_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users size={16} />
                        <span>{repo.watchers_count || 0}</span>
                      </div>
                    </div>
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(repo.html_url, '_blank')}
                      className="flex-1"
                    >
                      <LinkIcon size={16} className="mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleConnectRepository(repo)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <LinkIcon size={16} className="mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
