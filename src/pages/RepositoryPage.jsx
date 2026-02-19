import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GitBranch, Plus, Search, GitPullRequest, Star, Clock, MoreHorizontal, ExternalLink, Loader2 } from 'lucide-react'
import api from '@/services/api'
import { useToast } from '@/components/ui/Toast'

export const RepositoryPage = () => {
  const [activeTab, setActiveTab] = useState('repositories')
  const [searchTerm, setSearchTerm] = useState('')
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetchRepositories = useCallback(async () => {
    try {
      const data = await api.getProjects()
      const projects = data.projects || []

      // Extract repositories from project mappings
      const repos = projects
        .filter(p => p.status !== 'proposed')
        .map(p => {
          const githubMapping = p.project_mappings?.find(m => m.provider === 'github')
          return {
            id: p.id,
            name: githubMapping?.external_project_id || p.name.toLowerCase().replace(/\s+/g, '-'),
            description: p.description,
            status: p.status,
            url: githubMapping?.external_url || '#'
          }
        })

      setRepositories(repos)
    } catch (error) {
      toast.error('Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600'
      case 'pending': return 'bg-amber-100 text-amber-600'
      case 'completed': return 'bg-blue-100 text-blue-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Repositories</h1>
          <p className="text-gray-600">Track connected code repositories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('repositories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'repositories'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Repositories
          </button>
          <button
            onClick={() => setActiveTab('pull-requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pull-requests'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Pull Requests
          </button>
        </nav>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {activeTab === 'repositories' && (
        <>
          {/* Repository Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{repositories.length}</div>
                <div className="text-sm text-gray-600">Total Repos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {repositories.filter(r => r.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Repos</div>
              </CardContent>
            </Card>
          </div>

          {/* Repositories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRepos.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed text-sm font-bold uppercase tracking-widest">
                No active repositories found.
              </div>
            ) : (
              filteredRepos.map((repo, index) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <GitBranch className="text-indigo-600" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1">{repo.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded ${getStatusColor(repo.status)}`}>
                            {repo.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {repo.url !== '#' ? (
                          <a href={repo.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" size="sm" className="w-full bg-gray-50 hover:bg-gray-100 border-none">
                              <ExternalLink size={14} className="mr-2" />
                              View on GitHub
                            </Button>
                          </a>
                        ) : (
                          <Button disabled variant="secondary" size="sm" className="w-full opacity-50 cursor-not-allowed">
                            No Link Available
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'pull-requests' && (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed">
          <GitPullRequest size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Automated Sync</p>
          <p className="text-sm mt-2">Active PRs will appear here as they are created across projects.</p>
        </div>
      )}
    </motion.div>
  )
}

export default RepositoryPage
