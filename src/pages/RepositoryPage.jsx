import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GitBranch, Plus, Search, GitPullRequest, Star, Clock, MoreHorizontal, ExternalLink } from 'lucide-react'

const mockRepositories = [
  {
    id: 1,
    name: 'projectpulse-frontend',
    description: 'React frontend for ProjectPulse AI platform',
    language: 'JavaScript',
    stars: 45,
    forks: 12,
    openPRs: 3,
    lastCommit: '2 hours ago',
    status: 'active',
    url: 'https://github.com/company/projectpulse-frontend'
  },
  {
    id: 2,
    name: 'projectpulse-backend',
    description: 'Node.js backend API for ProjectPulse AI',
    language: 'JavaScript',
    stars: 38,
    forks: 8,
    openPRs: 5,
    lastCommit: '1 day ago',
    status: 'active',
    url: 'https://github.com/company/projectpulse-backend'
  },
  {
    id: 3,
    name: 'projectpulse-mobile',
    description: 'React Native mobile application',
    language: 'JavaScript',
    stars: 22,
    forks: 6,
    openPRs: 2,
    lastCommit: '3 days ago',
    status: 'active',
    url: 'https://github.com/company/projectpulse-mobile'
  },
  {
    id: 4,
    name: 'projectpulse-ml',
    description: 'Machine learning models and predictions',
    language: 'Python',
    stars: 56,
    forks: 15,
    openPRs: 8,
    lastCommit: '5 hours ago',
    status: 'active',
    url: 'https://github.com/company/projectpulse-ml'
  },
  {
    id: 5,
    name: 'projectpulse-docs',
    description: 'Documentation and guides',
    language: 'Markdown',
    stars: 18,
    forks: 4,
    openPRs: 1,
    lastCommit: '1 week ago',
    status: 'inactive',
    url: 'https://github.com/company/projectpulse-docs'
  }
]

const mockPullRequests = [
  {
    id: 1,
    title: 'Fix authentication bug in login flow',
    author: 'John Doe',
    repo: 'projectpulse-frontend',
    status: 'open',
    created: '2 hours ago',
    additions: 45,
    deletions: 12
  },
  {
    id: 2,
    title: 'Add real-time notifications',
    author: 'Jane Smith',
    repo: 'projectpulse-backend',
    status: 'open',
    created: '5 hours ago',
    additions: 120,
    deletions: 35
  },
  {
    id: 3,
    title: 'Update dependencies and security patches',
    author: 'Mike Johnson',
    repo: 'projectpulse-frontend',
    status: 'merged',
    created: '1 day ago',
    additions: 89,
    deletions: 67
  }
]

export const RepositoryPage = () => {
  const [activeTab, setActiveTab] = useState('repositories')
  const [searchTerm, setSearchTerm] = useState('')

  const getLanguageColor = (language) => {
    switch (language) {
      case 'JavaScript': return 'bg-yellow-100 text-yellow-700'
      case 'Python': return 'bg-blue-100 text-blue-700'
      case 'TypeScript': return 'bg-blue-100 text-blue-700'
      case 'Markdown': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600'
      case 'inactive': return 'bg-red-100 text-red-600'
      case 'archived': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPRStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-600'
      case 'merged': return 'bg-purple-100 text-purple-600'
      case 'closed': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredRepos = mockRepositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Repository</h1>
          <p className="text-gray-600">Manage code repositories and pull requests</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={20} className="mr-2" />
          New Repository
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('repositories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'repositories'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Repositories
          </button>
          <button
            onClick={() => setActiveTab('pull-requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pull-requests'
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
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{mockRepositories.length}</div>
                <div className="text-sm text-gray-600">Total Repos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {mockRepositories.reduce((sum, repo) => sum + repo.stars, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Stars</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {mockRepositories.reduce((sum, repo) => sum + repo.forks, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Forks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {mockRepositories.reduce((sum, repo) => sum + repo.openPRs, 0)}
                </div>
                <div className="text-sm text-gray-600">Open PRs</div>
              </CardContent>
            </Card>
          </div>

          {/* Repositories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRepos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <GitBranch className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                          <p className="text-sm text-gray-600">{repo.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(repo.status)}`}>
                          {repo.status}
                        </span>
                        <button className="p-1 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getLanguageColor(repo.language)}`}>
                          {repo.language}
                        </span>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Star size={14} />
                            <span>{repo.stars}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitBranch size={14} />
                            <span>{repo.forks}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <GitPullRequest size={14} />
                          <span>{repo.openPRs} open PRs</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={14} />
                          <span>{repo.lastCommit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button variant="secondary" size="sm" className="w-full">
                        <ExternalLink size={14} className="mr-2" />
                        View on GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'pull-requests' && (
        <>
          {/* PR Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {mockPullRequests.filter(pr => pr.status === 'open').length}
                </div>
                <div className="text-sm text-gray-600">Open</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {mockPullRequests.filter(pr => pr.status === 'merged').length}
                </div>
                <div className="text-sm text-gray-600">Merged</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  {mockPullRequests.filter(pr => pr.status === 'closed').length}
                </div>
                <div className="text-sm text-gray-600">Closed</div>
              </CardContent>
            </Card>
          </div>

          {/* Pull Requests List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-700">Pull Request</th>
                      <th className="text-left p-4 font-medium text-gray-700">Author</th>
                      <th className="text-left p-4 font-medium text-gray-700">Repository</th>
                      <th className="text-left p-4 font-medium text-gray-700">Status</th>
                      <th className="text-left p-4 font-medium text-gray-700">Changes</th>
                      <th className="text-left p-4 font-medium text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPullRequests.map((pr, index) => (
                      <motion.tr
                        key={pr.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <GitPullRequest size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">#{pr.id} {pr.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{pr.author}</td>
                        <td className="p-4 text-gray-600">{pr.repo}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getPRStatusColor(pr.status)}`}>
                            {pr.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="text-green-600">+{pr.additions}</span>
                            <span className="text-red-600">-{pr.deletions}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{pr.created}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  )
}
