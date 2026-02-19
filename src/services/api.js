const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('pp_token');
  }

  setToken(token) {
    localStorage.setItem('pp_token', token);
  }

  removeToken() {
    localStorage.removeItem('pp_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  // ============ AUTH ============
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getUsers(role) {
    const query = role ? `?role=${role}` : '';
    return this.request(`/auth/users${query}`);
  }

  logout() {
    this.removeToken();
  }

  // ============ PROJECTS ============
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async acceptProject(id) {
    return this.request(`/projects/${id}/accept`, { method: 'POST' });
  }

  async declineProject(id) {
    return this.request(`/projects/${id}/decline`, { method: 'POST' });
  }

  async getProjectStats() {
    return this.request('/projects/stats');
  }

  // ============ SCOPES ============
  async createScope(projectId, data) {
    return this.request(`/projects/${projectId}/scopes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScopes(projectId) {
    return this.request(`/projects/${projectId}/scopes`);
  }

  // ============ TASKS ============
  async createTask(projectId, data) {
    return this.request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjectTasks(projectId) {
    return this.request(`/projects/${projectId}/tasks`);
  }

  async getAssignedTasks() {
    return this.request('/tasks/assigned');
  }

  async updateTaskStatus(taskId, data) {
    return this.request(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createBranch(taskId) {
    return this.request(`/tasks/${taskId}/create-branch`, {
      method: 'POST',
    });
  }

  // ============ TEAMS ============
  async getTeams() {
    return this.request('/teams');
  }

  async createTeam(data) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ NOTIFICATIONS ============
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  // ============ ANALYTICS ============
  async getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  async getProjectRisk(projectId) {
    return this.request(`/analytics/project/${projectId}/risk`);
  }

  async getSprintDelay(projectId) {
    return this.request(`/analytics/project/${projectId}/sprint-delay`);
  }

  async getCompletionForecast(projectId) {
    return this.request(`/analytics/project/${projectId}/forecast`);
  }

  async getDeveloperPerformance(userId) {
    return this.request(`/analytics/developer/${userId}/performance`);
  }

  async getBurnoutScore(userId) {
    return this.request(`/analytics/developer/${userId}/burnout`);
  }

  async getMyPerformance() {
    return this.request('/analytics/my-performance');
  }

  async getJiraAnalytics(projectId) {
    return this.request(`/analytics/project/${projectId}/jira`);
  }

  async getGithubAnalytics(projectId) {
    return this.request(`/analytics/project/${projectId}/github`);
  }

  async getInsights() {
    return this.request('/analytics/insights');
  }

  async triggerBatchCompute() {
    return this.request('/analytics/compute-all', { method: 'POST' });
  }
}

export const api = new ApiService();
export default api;
