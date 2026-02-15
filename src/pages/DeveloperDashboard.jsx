import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckSquare, GitBranch, GitPullRequest, TrendingUp, Clock, AlertCircle } from 'lucide-react'

const assignedTasks = [
  { id: 'TASK-001', title: 'Implement user authentication', priority: 'high', status: 'in-progress', dueDate: '2024-02-15' },
  { id: 'TASK-002', title: 'Fix navigation menu bug', priority: 'medium', status: 'todo', dueDate: '2024-02-18' },
  { id: 'TASK-003', title: 'Add unit tests for API', priority: 'low', status: 'todo', dueDate: '2024-02-20' },
  { id: 'TASK-004', title: 'Optimize database queries', priority: 'high', status: 'review', dueDate: '2024-02-12' },
  { id: 'TASK-005', title: 'Update documentation', priority: 'low', status: 'done', dueDate: '2024-02-10' },
]

const branchStatus = [
  { name: 'main', status: 'clean', commits: 142, lastUpdate: '2 hours ago' },
  { name: 'feature/auth', status: 'ahead', commits: 8, lastUpdate: '1 day ago' },
  { name: 'bugfix/navigation', status: 'behind', commits: 3, lastUpdate: '3 days ago' },
  { name: 'hotfix/security', status: 'clean', commits: 2, lastUpdate: '5 hours ago' },
]

const prStatus = [
  { id: '#234', title: 'Implement user authentication', status: 'pending', reviews: 2, time: '2 hours ago' },
  { id: '#235', title: 'Fix navigation menu bug', status: 'approved', reviews: 3, time: '1 day ago' },
  { id: '#236', title: 'Add unit tests for API', status: 'changes-requested', reviews: 1, time: '2 days ago' },
]

const performanceMetrics = [
  { month: 'Jan', tasks: 18, completed: 16, efficiency: 89 },
  { month: 'Feb', tasks: 22, completed: 20, efficiency: 91 },
  { month: 'Mar', tasks: 19, completed: 17, efficiency: 89 },
  { month: 'Apr', tasks: 25, completed: 23, efficiency: 92 },
  { month: 'May', tasks: 21, completed: 19, efficiency: 90 },
  { month: 'Jun', tasks: 20, completed: 18, efficiency: 90 },
]

export const DeveloperDashboard = () => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-danger text-white'
      case 'medium': return 'bg-warning text-white'
      case 'low': return 'bg-gray-200 text-gray-700'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-success'
      case 'in-progress': return 'bg-blue-100 text-blue-600'
      case 'review': return 'bg-yellow-100 text-warning'
      case 'todo': return 'bg-gray-100 text-secondary-text'
      default: return 'bg-gray-100 text-secondary-text'
    }
  }

  const getBranchStatusColor = (status) => {
    switch (status) {
      case 'clean': return 'text-success'
      case 'ahead': return 'text-blue-600'
      case 'behind': return 'text-warning'
      default: return 'text-secondary-text'
    }
  }

  const getPRStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-success'
      case 'pending': return 'bg-yellow-100 text-warning'
      case 'changes-requested': return 'bg-red-100 text-danger'
      default: return 'bg-gray-100 text-secondary-text'
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
        <h1 className="text-2xl font-semibold text-primary-text mb-2">Developer Dashboard</h1>
        <p className="text-secondary-text">Personal tasks and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-text">Assigned Tasks</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">5</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="text-primary-accent" size={24} />
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
                  <p className="text-sm text-secondary-text">Active Branches</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">4</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GitBranch className="text-blue-600" size={24} />
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
                  <p className="text-2xl font-semibold text-primary-text mt-1">3</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <GitPullRequest className="text-success" size={24} />
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
                  <p className="text-sm text-secondary-text">Efficiency</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">90%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-warning" size={24} />
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
              <CardTitle>Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-primary-text">{task.id}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-primary-text">{task.title}</p>
                      <p className="text-xs text-secondary-text mt-1">Due: {task.dueDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
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
              <CardTitle>Branch Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {branchStatus.map((branch, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <GitBranch size={20} className="text-secondary-text" />
                      <div>
                        <p className="font-medium text-primary-text">{branch.name}</p>
                        <p className="text-sm text-secondary-text">{branch.commits} commits • {branch.lastUpdate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        branch.status === 'clean' ? 'bg-success' :
                        branch.status === 'ahead' ? 'bg-blue-600' :
                        'bg-warning'
                      }`}></div>
                      <span className={`text-sm font-medium ${getBranchStatusColor(branch.status)}`}>
                        {branch.status}
                      </span>
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
              <CardTitle>Pull Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prStatus.map((pr, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <GitPullRequest size={16} className="text-primary-accent" />
                        <span className="font-medium text-primary-text">{pr.id}</span>
                      </div>
                      <p className="text-sm text-primary-text mt-1">{pr.title}</p>
                      <p className="text-xs text-secondary-text mt-1">
                        {pr.reviews} reviews • {pr.time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPRStatusColor(pr.status)}`}>
                      {pr.status.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    name="Tasks Assigned"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#16A34A" 
                    strokeWidth={2}
                    name="Tasks Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DeveloperDashboard
