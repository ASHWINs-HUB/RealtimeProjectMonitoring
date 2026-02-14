import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FolderKanban, Plus, Search, Filter, MoreHorizontal } from 'lucide-react'

const mockProjects = [
  { id: 1, name: 'E-commerce Platform', status: 'On Track', progress: 75, risk: 12, deadline: '2024-03-15', team: 'Team Alpha' },
  { id: 2, name: 'Mobile App Redesign', status: 'At Risk', progress: 45, risk: 68, deadline: '2024-02-28', team: 'Team Beta' },
  { id: 3, name: 'API Integration', status: 'On Track', progress: 90, risk: 8, deadline: '2024-03-30', team: 'Team Gamma' },
  { id: 4, name: 'Database Migration', status: 'Delayed', progress: 30, risk: 45, deadline: '2024-04-10', team: 'Team Delta' },
  { id: 5, name: 'Customer Portal', status: 'Planning', progress: 0, risk: 0, deadline: '2024-05-01', team: 'Team Alpha' },
]

export const ProjectsPage = () => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-green-100 text-green-600'
      case 'At Risk': return 'bg-yellow-100 text-yellow-600'
      case 'Delayed': return 'bg-red-100 text-red-600'
      case 'Planning': return 'bg-blue-100 text-blue-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getRiskColor = (risk) => {
    if (risk < 20) return 'text-green-600'
    if (risk < 50) return 'text-yellow-600'
    if (risk < 70) return 'text-orange-600'
    return 'text-red-600'
  }

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
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={20} className="mr-2" />
          New Project
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
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button variant="secondary" className="w-full sm:w-auto">
              <Filter size={20} className="mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: project.id * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FolderKanban className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.team}</p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <span className={`text-sm font-medium ${getRiskColor(project.risk)}`}>
                      {project.risk}% Risk
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Deadline</span>
                    <span className="font-medium">{project.deadline}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
