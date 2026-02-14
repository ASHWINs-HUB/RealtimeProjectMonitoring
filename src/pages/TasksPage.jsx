import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckSquare, Plus, Search, Filter, Calendar, User, MoreHorizontal } from 'lucide-react'

const mockTasks = [
  { id: 1, title: 'Setup authentication system', status: 'completed', priority: 'high', assignee: 'John Doe', project: 'E-commerce Platform', dueDate: '2024-02-15' },
  { id: 2, title: 'Design user dashboard', status: 'in-progress', priority: 'high', assignee: 'Jane Smith', project: 'E-commerce Platform', dueDate: '2024-02-20' },
  { id: 3, title: 'Implement payment gateway', status: 'in-progress', priority: 'medium', assignee: 'Mike Johnson', project: 'Mobile App', dueDate: '2024-02-25' },
  { id: 4, title: 'Create API documentation', status: 'todo', priority: 'low', assignee: 'Sarah Wilson', project: 'API Integration', dueDate: '2024-03-01' },
  { id: 5, title: 'Database optimization', status: 'review', priority: 'high', assignee: 'Tom Brown', project: 'Database Migration', dueDate: '2024-02-18' },
  { id: 6, title: 'Mobile responsive testing', status: 'todo', priority: 'medium', assignee: 'Alice Green', project: 'Mobile App', dueDate: '2024-02-28' },
]

export const TasksPage = () => {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-600'
      case 'in-progress': return 'bg-blue-100 text-blue-600'
      case 'review': return 'bg-yellow-100 text-yellow-600'
      case 'todo': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600'
      case 'medium': return 'bg-orange-100 text-orange-600'
      case 'low': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredTasks = mockTasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track all tasks</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={20} className="mr-2" />
          New Task
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </select>
              <Button variant="secondary">
                <Filter size={20} className="mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Task</th>
                  <th className="text-left p-4 font-medium text-gray-700">Assignee</th>
                  <th className="text-left p-4 font-medium text-gray-700">Project</th>
                  <th className="text-left p-4 font-medium text-gray-700">Priority</th>
                  <th className="text-left p-4 font-medium text-gray-700">Status</th>
                  <th className="text-left p-4 font-medium text-gray-700">Due Date</th>
                  <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <CheckSquare size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{task.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <User size={12} className="text-gray-600" />
                        </div>
                        <span className="text-gray-600">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{task.project}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar size={16} />
                        <span>{task.dueDate}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button className="p-1 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{mockTasks.length}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {mockTasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
              {mockTasks.filter(t => t.status === 'review').length}
            </div>
            <div className="text-sm text-gray-600">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {mockTasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
