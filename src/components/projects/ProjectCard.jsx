import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MoreHorizontal, X } from 'lucide-react'

export const ProjectCard = ({ project, user, onApprove, onReject, onAssignLeader, onManageGitHub }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TRACK': return 'bg-green-100 text-green-600'
      case 'AT_RISK': return 'bg-yellow-100 text-yellow-600'
      case 'DELAYED': return 'bg-red-100 text-red-600'
      case 'PLANNING': return 'bg-blue-100 text-blue-600'
      case 'PENDING': return 'bg-gray-100 text-gray-600'
      case 'APPROVED': return 'bg-indigo-100 text-indigo-600'
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
      transition={{ delay: project.id * 0.1 }}
    >
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Key:</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {project.project_key || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Risk Score:</span>
              <span className={`font-semibold ${getRiskColor(project.risk || 0)}`}>
                {project.risk || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'manager' && project.status === 'APPROVED' && (
                <Button size="sm" variant="primary" onClick={() => onAssignLeader(project.id)}>
                  Assign Team Leader
                </Button>
              )}
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 underline text-xs">
                  GitHub Repo
                </a>
              )}
              {project.project_key && import.meta.env.VITE_JIRA_BASE_URL && (
                <a href={`${import.meta.env.VITE_JIRA_BASE_URL}/browse/${project.project_key}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-600 underline text-xs">
                  JIRA
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
