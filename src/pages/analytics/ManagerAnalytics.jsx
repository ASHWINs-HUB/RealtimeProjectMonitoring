import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Users,
  Target,
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react'
import { analyticsEngine } from '@/services/analyticsEngine'
import apiService from '@/services/api'

export const ManagerAnalytics = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [analytics, setAnalytics] = useState({
    metrics: {},
    insights: [],
    recommendations: [],
    riskDistribution: {},
    performanceTrends: []
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const projectsData = await apiService.getProjects()
      setProjects(projectsData)

      // Calculate real analytics using ML engine
      const metrics = analyticsEngine.generatePerformanceMetrics(projectsData)
      const insights = analyticsEngine.generateInsights(projectsData)
      const riskDistribution = calculateRiskDistribution(projectsData)
      const performanceTrends = calculatePerformanceTrends(projectsData)
      const recommendations = generateRecommendations(projectsData)

      setAnalytics({
        metrics,
        insights,
        recommendations,
        riskDistribution,
        performanceTrends
      })
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateRiskDistribution = (projects) => {
    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    projects.forEach(project => {
      const riskScore = analyticsEngine.calculateRiskScore(project)
      if (riskScore < 30) distribution.low++
      else if (riskScore < 50) distribution.medium++
      else if (riskScore < 70) distribution.high++
      else distribution.critical++
    })

    return distribution
  }

  const calculatePerformanceTrends = (projects) => {
    // Simulate trend data (in real app, this would come from historical data)
    return [
      { period: 'Week 1', completion: 85, risk: 25 },
      { period: 'Week 2', completion: 88, risk: 22 },
      { period: 'Week 3', completion: 82, risk: 28 },
      { period: 'Week 4', completion: 90, risk: 20 }
    ]
  }

  const generateRecommendations = (projects) => {
    const allRecommendations = []
    projects.forEach(project => {
      const projectRecommendations = analyticsEngine.generateRecommendations(project)
      allRecommendations.push(...projectRecommendations)
    })
    
    // Group by priority and limit
    const critical = allRecommendations.filter(r => r.priority === 'critical').slice(0, 2)
    const high = allRecommendations.filter(r => r.priority === 'high').slice(0, 3)
    const medium = allRecommendations.filter(r => r.priority === 'medium').slice(0, 2)
    
    return [...critical, ...high, ...medium]
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend) => {
    return trend > 0 ? 
      <TrendingUp size={16} className="text-green-600" /> : 
      <TrendingDown size={16} className="text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time project analytics and insights</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw size={20} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.metrics.totalProjects}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(5)}
                  <span className="text-sm text-green-600 ml-1">+12%</span>
                </div>
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
                <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.metrics.avgRiskScore}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(-3)}
                  <span className="text-sm text-red-600 ml-1">-8%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.metrics.completionRate}%</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(7)}
                  <span className="text-sm text-green-600 ml-1">+5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Utilization</p>
                <p className="text-2xl font-bold text-gray-900">78%</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(2)}
                  <span className="text-sm text-green-600 ml-1">+3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.riskDistribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(level).split(' ')[0]}`}></div>
                    <span className="capitalize text-sm font-medium">{level}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold">{count}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getRiskColor(level).split(' ')[0]}`}
                        style={{ width: `${(count / projects.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity size={20} className="mr-2" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performanceTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{trend.period}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Completion:</span>
                      <span className="text-sm font-medium">{trend.completion}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Risk:</span>
                      <span className="text-sm font-medium">{trend.risk}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp size={20} className="mr-2" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      insight.trend === 'critical' ? 'bg-red-100 text-red-800' :
                      insight.trend === 'increasing' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.trend}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-indigo-600">{insight.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target size={20} className="mr-2" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recommendations.map((rec, index) => (
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
      </div>
    </motion.div>
  )
}
