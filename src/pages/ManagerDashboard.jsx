import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { GitBranch, CheckCircle, AlertCircle, Users, Code, Merge } from 'lucide-react'

const repositoryStatus = [
  { name: 'Frontend', status: 'healthy', branches: 12, prs: 8 },
  { name: 'Backend', status: 'warning', branches: 18, prs: 15 },
  { name: 'API', status: 'healthy', branches: 8, prs: 5 },
  { name: 'Mobile', status: 'critical', branches: 15, prs: 12 },
]

const moduleProgress = [
  { name: 'Authentication', progress: 100, status: 'completed' },
  { name: 'User Management', progress: 85, status: 'in-progress' },
  { name: 'Payment Gateway', progress: 60, status: 'in-progress' },
  { name: 'Analytics', progress: 30, status: 'pending' },
  { name: 'Reporting', progress: 45, status: 'in-progress' },
]

const sprintAnalytics = [
  { sprint: 'Sprint 1', completed: 8, planned: 10 },
  { sprint: 'Sprint 2', completed: 9, planned: 10 },
  { sprint: 'Sprint 3', completed: 7, planned: 12 },
  { sprint: 'Sprint 4', completed: 11, planned: 11 },
  { sprint: 'Sprint 5', completed: 10, planned: 10 },
  { sprint: 'Sprint 6', completed: 8, planned: 9 },
]

const mergeApprovals = [
  { id: '#234', title: 'Fix authentication bug', author: 'John Doe', time: '2 hours ago', status: 'pending' },
  { id: '#235', title: 'Add payment integration', author: 'Jane Smith', time: '4 hours ago', status: 'approved' },
  { id: '#236', title: 'Update user dashboard', author: 'Mike Johnson', time: '6 hours ago', status: 'pending' },
  { id: '#237', title: 'Optimize database queries', author: 'Sarah Wilson', time: '1 day ago', status: 'rejected' },
]

export const ManagerDashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-success'
      case 'warning': return 'text-warning'
      case 'critical': return 'text-danger'
      default: return 'text-secondary-text'
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100'
      case 'warning': return 'bg-yellow-100'
      case 'critical': return 'bg-red-100'
      default: return 'bg-gray-100'
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold text-primary-text mb-2">Manager Dashboard</h1>
        <p className="text-secondary-text">Repository status and team performance overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-text">Active Repos</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">4</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <GitBranch className="text-primary-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-text">Open PRs</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">40</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Merge className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-text">Team Members</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">12</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-text">Code Reviews</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">28</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Code className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Repository Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repositoryStatus.map((repo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <GitBranch size={20} className="text-secondary-text" />
                      <div>
                        <p className="font-medium text-primary-text">{repo.name}</p>
                        <p className="text-sm text-secondary-text">{repo.branches} branches, {repo.prs} PRs</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusBg(repo.status)}`}></div>
                      <span className={`text-sm font-medium ${getStatusColor(repo.status)}`}>
                        {repo.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Module Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moduleProgress.map((module, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-primary-text">{module.name}</p>
                      <span className="text-sm text-secondary-text">{module.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          module.progress === 100 ? 'bg-success' :
                          module.progress >= 70 ? 'bg-primary-accent' :
                          module.progress >= 40 ? 'bg-warning' :
                          'bg-danger'
                        }`}
                        style={{ width: `${module.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Sprint Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sprintAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="sprint" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#4F46E5" name="Completed" />
                  <Bar dataKey="planned" fill="#E5E7EB" name="Planned" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Merge Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mergeApprovals.map((pr, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-primary-text">{pr.id}</span>
                        <span className="text-sm text-secondary-text">{pr.title}</span>
                      </div>
                      <p className="text-xs text-secondary-text mt-1">
                        {pr.author} • {pr.time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      pr.status === 'approved' ? 'bg-green-100 text-success' :
                      pr.status === 'pending' ? 'bg-yellow-100 text-warning' :
                      'bg-red-100 text-danger'
                    }`}>
                      {pr.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ManagerDashboard
