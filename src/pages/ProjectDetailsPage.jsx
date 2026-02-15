import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Target, 
  GitBranch,
  Activity,
  Settings,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react'
import apiService from '@/services/api'
import { analyticsEngine } from '@/services/analyticsEngine'

export const ProjectDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchProjectDetails()
  }, [id])

  const fetchProjectDetails = async () => {
    try {
      const projectData = await apiService.getProject(id)
      setProject(projectData)
    } catch (err) {
      console.error('Failed to fetch project details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft size={20} className="mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const riskScore = analyticsEngine.calculateRiskScore(project)
  const completionProbability = analyticsEngine.predictCompletionProbability(project)
  const recommendations = analyticsEngine.generateRecommendations(project)

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TRACK': return 'bg-green-100 text-green-800'
      case 'AT_RISK': return 'bg-yellow-100 text-yellow-800'
      case 'DELAYED': return 'bg-red-100 text-red-800'
      case 'PLANNING': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      case 'APPROVED': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk) => {
    if (risk < 30) return 'text-green-600'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Projects
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings size={20} className="mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Target size={24} className="text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {project.project_key || 'N/A'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Risk Score</p>
              <p className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
                {riskScore}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Probability</p>
              <p className="text-2xl font-bold text-indigo-600">
                {completionProbability}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.team_members?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-green-600">
                {project.progress || 0}%
              </p>
            </div>
          </div>

          {project.description && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar size={16} className="mr-2" />
                Timeline
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                {project.deadline && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deadline:</span>
                    <span className="text-sm font-medium">
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <GitBranch size={16} className="mr-2" />
                Integrations
              </h4>
              <div className="space-y-2">
                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm">GitHub Repository</span>
                    <ExternalLink size={16} className="text-gray-400" />
                  </a>
                )}
                {project.project_key && (
                  <a
                    href={`${process.env.VITE_JIRA_BASE_URL}/browse/${project.project_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm">Jira Project</span>
                    <ExternalLink size={16} className="text-gray-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border-l-4 border-yellow-500 pl-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => console.log('Action:', rec.action)}
                  >
                    Take Action
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      {project.team_members && project.team_members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users size={20} className="mr-2" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.team_members.map((member, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {member.name?.charAt(0)?.toUpperCase() || member.github_username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.name || member.github_username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.role || 'Developer'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
