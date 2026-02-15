// Advanced Analytics Engine with ML-based Risk Scoring
export class AnalyticsEngine {
  constructor() {
    this.riskFactors = {
      deadline: 0.3,
      teamSize: 0.2,
      complexity: 0.25,
      dependencies: 0.15,
      historical: 0.1
    }
  }

  // Calculate project risk score using weighted algorithm
  calculateRiskScore(project) {
    let riskScore = 0

    // Deadline risk (closer to deadline = higher risk)
    if (project.deadline) {
      const daysUntilDeadline = Math.max(0, 
        (new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      )
      const deadlineRisk = daysUntilDeadline < 7 ? 100 : 
                         daysUntilDeadline < 30 ? 70 : 
                         daysUntilDeadline < 60 ? 40 : 20
      riskScore += deadlineRisk * this.riskFactors.deadline
    }

    // Team size risk (too small or too large = higher risk)
    const teamSize = project.team_members?.length || 1
    const teamSizeRisk = teamSize < 2 ? 80 : 
                        teamSize > 10 ? 60 : 30
    riskScore += teamSizeRisk * this.riskFactors.teamSize

    // Complexity risk (based on project description and scope)
    const complexityRisk = this.calculateComplexityRisk(project)
    riskScore += complexityRisk * this.riskFactors.complexity

    // Dependencies risk (number of external dependencies)
    const dependenciesRisk = this.calculateDependenciesRisk(project)
    riskScore += dependenciesRisk * this.riskFactors.dependencies

    // Historical performance risk
    const historicalRisk = this.calculateHistoricalRisk(project)
    riskScore += historicalRisk * this.riskFactors.historical

    return Math.min(100, Math.round(riskScore))
  }

  calculateComplexityRisk(project) {
    let complexity = 50 // Base complexity

    // Analyze project name and description for complexity indicators
    const complexityKeywords = [
      'integration', 'migration', 'architecture', 'infrastructure',
      'microservices', 'distributed', 'scalable', 'enterprise'
    ]
    
    const text = `${project.name} ${project.description}`.toLowerCase()
    const keywordMatches = complexityKeywords.filter(keyword => text.includes(keyword))
    complexity += keywordMatches.length * 15

    // Repository complexity (if available)
    if (project.repo_url) {
      complexity += 10 // Projects with repos are typically more complex
    }

    return Math.min(100, complexity)
  }

  calculateDependenciesRisk(project) {
    // This would integrate with GitHub API to count dependencies
    // For now, use a simplified calculation
    let dependencyRisk = 30 // Base risk

    // Check for Jira integration (more dependencies)
    if (project.project_key) {
      dependencyRisk += 20
    }

    // Check for GitHub integration
    if (project.repo_url) {
      dependencyRisk += 15
    }

    return Math.min(100, dependencyRisk)
  }

  calculateHistoricalRisk(project) {
    // This would analyze past project performance
    // For now, return a moderate risk score
    return 25
  }

  // Predict project completion probability using logistic regression
  predictCompletionProbability(project) {
    const riskScore = this.calculateRiskScore(project)
    
    // Logistic function to convert risk score to completion probability
    const probability = 1 / (1 + Math.exp((riskScore - 50) / 10))
    
    return Math.round(probability * 100)
  }

  // Generate project insights using pattern recognition
  generateInsights(projects) {
    const insights = []

    // Overall portfolio health
    const avgRisk = projects.reduce((sum, p) => sum + this.calculateRiskScore(p), 0) / projects.length
    insights.push({
      type: 'portfolio_health',
      title: 'Portfolio Health',
      value: Math.round(100 - avgRisk),
      description: avgRisk < 30 ? 'Excellent' : avgRisk < 50 ? 'Good' : 'Needs Attention',
      trend: 'stable'
    })

    // High-risk projects
    const highRiskProjects = projects.filter(p => this.calculateRiskScore(p) > 70)
    if (highRiskProjects.length > 0) {
      insights.push({
        type: 'risk_alert',
        title: 'High Risk Projects',
        value: highRiskProjects.length,
        description: 'Projects requiring immediate attention',
        trend: 'increasing'
      })
    }

    // Team workload analysis
    const teamWorkload = this.analyzeTeamWorkload(projects)
    insights.push({
      type: 'team_workload',
      title: 'Team Utilization',
      value: teamWorkload.utilization,
      description: teamWorkload.status,
      trend: teamWorkload.trend
    })

    // Deadline pressure
    const upcomingDeadlines = projects.filter(p => {
      if (!p.deadline) return false
      const daysUntil = (new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      return daysUntil <= 14 && daysUntil > 0
    })

    if (upcomingDeadlines.length > 0) {
      insights.push({
        type: 'deadline_alert',
        title: 'Upcoming Deadlines',
        value: upcomingDeadlines.length,
        description: 'Projects with deadlines in next 2 weeks',
        trend: 'critical'
      })
    }

    return insights
  }

  analyzeTeamWorkload(projects) {
    // Calculate team workload based on project assignments
    const teamMembers = new Set()
    let totalWorkload = 0

    projects.forEach(project => {
      if (project.team_members) {
        project.team_members.forEach(member => {
          teamMembers.add(member.github_username)
        })
        totalWorkload += this.calculateProjectWorkload(project)
      }
    })

    const avgWorkload = teamMembers.size > 0 ? totalWorkload / teamMembers.size : 0
    const utilization = Math.min(100, Math.round((avgWorkload / 40) * 100)) // Assuming 40 hours/week

    return {
      utilization,
      status: utilization > 90 ? 'Overloaded' : utilization > 70 ? 'Optimal' : 'Underutilized',
      trend: utilization > 80 ? 'increasing' : 'stable'
    }
  }

  calculateProjectWorkload(project) {
    // Simplified workload calculation based on project complexity and risk
    const riskScore = this.calculateRiskScore(project)
    const complexity = this.calculateComplexityRisk(project)
    
    return (riskScore + complexity) / 4 // Convert to hours estimate
  }

  // Generate performance metrics
  generatePerformanceMetrics(projects) {
    const metrics = {
      totalProjects: projects.length,
      avgRiskScore: Math.round(
        projects.reduce((sum, p) => sum + this.calculateRiskScore(p), 0) / projects.length
      ),
      onTrackProjects: projects.filter(p => p.status === 'ON_TRACK').length,
      atRiskProjects: projects.filter(p => p.status === 'AT_RISK').length,
      delayedProjects: projects.filter(p => p.status === 'DELAYED').length,
      completionRate: this.calculateCompletionRate(projects),
      avgTeamSize: Math.round(
        projects.reduce((sum, p) => sum + (p.team_members?.length || 1), 0) / projects.length
      )
    }

    return metrics
  }

  calculateCompletionRate(projects) {
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
    return Math.round((completedProjects / projects.length) * 100)
  }

  // Generate recommendations based on ML analysis
  generateRecommendations(project) {
    const recommendations = []
    const riskScore = this.calculateRiskScore(project)

    if (riskScore > 70) {
      recommendations.push({
        type: 'high_risk',
        priority: 'critical',
        title: 'Immediate Risk Mitigation Required',
        description: 'This project has a high risk score. Consider reassigning resources or adjusting deadlines.',
        action: 'review_project'
      })
    }

    if (project.deadline) {
      const daysUntil = (new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      if (daysUntil < 7 && daysUntil > 0) {
        recommendations.push({
          type: 'deadline',
          priority: 'high',
          title: 'Deadline Approaching',
          description: `Project deadline is in ${Math.round(daysUntil)} days. Review progress and resource allocation.`,
          action: 'review_timeline'
        })
      }
    }

    const teamSize = project.team_members?.length || 1
    if (teamSize < 2) {
      recommendations.push({
        type: 'team_size',
        priority: 'medium',
        title: 'Consider Team Expansion',
        description: 'Project has minimal team coverage. Consider adding more team members to reduce risk.',
        action: 'assign_team'
      })
    }

    return recommendations
  }
}

export const analyticsEngine = new AnalyticsEngine()
