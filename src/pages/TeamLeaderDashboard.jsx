import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckSquare, Clock, AlertTriangle, Users, GitPullRequest, TrendingUp } from 'lucide-react'

const kanbanTasks = {
  todo: [
    { id: 1, title: 'Setup authentication flow', priority: 'high', assignee: 'John Doe' },
    { id: 2, title: 'Design user profile page', priority: 'medium', assignee: 'Jane Smith' },
    { id: 3, title: 'Implement search functionality', priority: 'low', assignee: 'Mike Johnson' },
  ],
  inProgress: [
    { id: 4, title: 'Build dashboard components', priority: 'high', assignee: 'Sarah Wilson' },
    { id: 5, title: 'Integrate payment API', priority: 'high', assignee: 'Tom Brown' },
  ],
  review: [
    { id: 6, title: 'Add unit tests', priority: 'medium', assignee: 'John Doe' },
    { id: 7, title: 'Optimize database queries', priority: 'medium', assignee: 'Jane Smith' },
  ],
  done: [
    { id: 8, title: 'Setup project structure', priority: 'high', assignee: 'Mike Johnson' },
    { id: 9, title: 'Create CI/CD pipeline', priority: 'high', assignee: 'Sarah Wilson' },
  ],
}

const prReviewQueue = [
  { id: '#234', title: 'Fix authentication bug', author: 'John Doe', files: 5, time: '2 hours ago' },
  { id: '#235', title: 'Add payment integration', author: 'Jane Smith', files: 12, time: '4 hours ago' },
  { id: '#236', title: 'Update user dashboard', author: 'Mike Johnson', files: 8, time: '6 hours ago' },
  { id: '#237', title: 'Optimize database queries', author: 'Sarah Wilson', files: 3, time: '1 day ago' },
]

const developerWorkload = [
  { name: 'John Doe', tasks: 8, completed: 6, efficiency: 75 },
  { name: 'Jane Smith', tasks: 10, completed: 8, efficiency: 80 },
  { name: 'Mike Johnson', tasks: 6, completed: 4, efficiency: 67 },
  { name: 'Sarah Wilson', tasks: 9, completed: 7, efficiency: 78 },
  { name: 'Tom Brown', tasks: 7, completed: 5, efficiency: 71 },
]

export const TeamLeaderDashboard = () => {
  const [draggedTask, setDraggedTask] = useState(null)

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

  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, column) => {
    e.preventDefault()
    // Handle task movement between columns
    setDraggedTask(null)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold text-primary-text mb-2">Team Leader Dashboard</h1>
        <p className="text-secondary-text">Task management and team performance overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-text">Total Tasks</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">32</p>
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
                  <p className="text-sm text-secondary-text">In Progress</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">12</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-blue-600" size={24} />
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
                  <p className="text-sm text-secondary-text">Sprint Risk</p>
                  <p className="text-2xl font-semibold text-warning mt-1">24%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-warning" size={24} />
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
                  <p className="text-sm text-secondary-text">Team Size</p>
                  <p className="text-2xl font-semibold text-primary-text mt-1">5</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Kanban Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {Object.entries(kanbanTasks).map(([column, tasks]) => (
                <div
                  key={column}
                  className="bg-gray-50 rounded-lg p-4"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column)}
                >
                  <h3 className="font-medium text-primary-text mb-3 capitalize">
                    {column.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className="bg-white p-3 rounded-lg border border-border cursor-move hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-primary-text mb-2">
                          {task.title}
                        </p>
                        <p className="text-xs text-secondary-text">
                          {task.assignee}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>PR Review Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prReviewQueue.map((pr, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <GitPullRequest size={16} className="text-primary-accent" />
                        <span className="font-medium text-primary-text">{pr.id}</span>
                        <span className="text-sm text-secondary-text">{pr.title}</span>
                      </div>
                      <p className="text-xs text-secondary-text mt-1">
                        {pr.author} • {pr.files} files • {pr.time}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Developer Workload</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={developerWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#4F46E5" name="Total Tasks" />
                  <Bar dataKey="completed" fill="#16A34A" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default TeamLeaderDashboard
