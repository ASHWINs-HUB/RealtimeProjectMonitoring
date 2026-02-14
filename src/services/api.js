// API service for frontend-backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('token')
  }

  // Helper method to make API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add authorization header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Request failed')
      }

      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Authentication endpoints
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    if (response.token) {
      this.token = response.token
      localStorage.setItem('token', response.token)
    }
    
    return response
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      })
    } finally {
      this.token = null
      localStorage.removeItem('token')
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Project endpoints
  async getProjects() {
    return this.request('/projects')
  }

  async getProject(id) {
    return this.request(`/projects/${id}`)
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    })
  }

  async updateProject(id, projectData) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    })
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // Task endpoints
  async getTasks(projectId) {
    return this.request(`/projects/${projectId}/tasks`)
  }

  async createTask(projectId, taskData) {
    return this.request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(projectId, taskId, taskData) {
    return this.request(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    })
  }

  // User endpoints
  async getUsers(role = null) {
    const query = role ? `?role=${role}` : ''
    return this.request(`/users${query}`)
  }

  async getUser(id) {
    return this.request(`/users/${id}`)
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  // GitHub integration endpoints
  async getGitHubRepos() {
    return this.request('/github/repos')
  }

  async createGitHubRepo(repoData) {
    return this.request('/github/repos', {
      method: 'POST',
      body: JSON.stringify(repoData),
    })
  }

  async getPullRequests(projectId) {
    return this.request(`/projects/${projectId}/pull-requests`)
  }

  // Jira integration endpoints
  async getJiraIssues(projectId) {
    return this.request(`/projects/${projectId}/jira-issues`)
  }

  async createJiraIssue(projectId, issueData) {
    return this.request(`/projects/${projectId}/jira-issues`, {
      method: 'POST',
      body: JSON.stringify(issueData),
    })
  }

  // Analytics endpoints
  async getProjectMetrics(projectId) {
    return this.request(`/projects/${projectId}/metrics`)
  }

  async getTeamAnalytics() {
    return this.request('/analytics/team')
  }

  async getRiskPrediction(projectId) {
    return this.request(`/ml/predict-risk/${projectId}`)
  }

  async getDeliveryPrediction(projectId) {
    return this.request(`/ml/predict-delivery/${projectId}`)
  }
}

export const apiService = new ApiService()
export default apiService
