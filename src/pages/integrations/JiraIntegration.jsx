import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { 
  Target, 
  Plus, 
  Search, 
  Settings, 
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import apiService from '@/services/api'

export const JiraIntegration = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingIssues: 0
  })

  useEffect(() => {
    fetchJiraProjects()
    fetchJiraStats()
  }, [])

  const fetchJiraProjects = async () => {
    try {
      setLoading(true)
      const jiraProjects = await apiService.getJiraProjects()
      setProjects(jiraProjects || [])
    } catch (err) {
      setError('Failed to fetch Jira projects. Please check your Jira credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fetchJiraStats = async () => {
    try {
      const statsData = await apiService.getJiraStats()
      setStats(statsData)
    } catch (err) {
      console.warn('Failed to fetch Jira stats:', err)
    }
  }

  const handleSyncProject = async (project) => {
    try {
      setSyncing(true)
      const syncedProject = await apiService.syncJiraProject(project.key)
      setProjects(projects.map(p => 
        p.key === project.key ? { ...p, ...syncedProject, synced: true } : p
      ))
      setSuccess(`Project ${project.name} synced successfully!`)
    } catch (err) {
      setError(`Failed to sync project ${project.name}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      const results = await Promise.all(
        projects.map(project => apiService.syncJiraProject(project.key))
      )
      setProjects(projects.map((p, index) => ({ 
        ...p, 
        ...results[index], 
        synced: true 
      })))
      setSuccess('All projects synced successfully!')
    } catch (err) {
      setError('Failed to sync some projects')
    } finally {
      setSyncing(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on hold': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Jira Integration</h1>
          <p className="text-gray-600">Manage your Jira projects and sync with analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSyncAll}
            disabled={syncing || projects.length === 0}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <RefreshCw size={20} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
          <Button
            onClick={fetchJiraProjects}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw size={20} className="mr-2" />
            Refresh
          </Button>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Issues</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingIssues}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search Jira projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading Jira projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No Jira projects available'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <motion.div
              key={project.id || project.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {project.key}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                          {project.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {project.synced && (
                    <CheckCircle size={20} className="text-green-600" />
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Lead</p>
                      <p className="font-medium">{project.lead?.displayName || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Issues</p>
                      <p className="font-medium">{project.issueCount || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Updated {new Date(project.updated || project.lastUpdated).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      {project.url && (
                        <button
                          onClick={() => window.open(project.url, '_blank')}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(project.url, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink size={16} className="mr-1" />
                      View in Jira
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSyncProject(project)}
                      disabled={syncing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <RefreshCw size={16} className={`mr-1 ${syncing ? 'animate-spin' : ''}`} />
                      {project.synced ? 'Synced' : 'Sync'}
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
