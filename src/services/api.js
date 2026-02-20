const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this._redirecting = false; // Prevent multiple 401 redirects
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
        // Don't auto-redirect for auth endpoints (login, register, verify-admin)
        const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/verify-admin');
        if (!isAuthEndpoint && !this._redirecting) {
          this._redirecting = true;
          this.removeToken();
          localStorage.removeItem('pp-auth'); // Clear stale zustand persisted state
          window.location.href = '/login';
          throw new Error('Session expired');
        }
        // For auth endpoints, just throw the error without redirect
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Authentication failed');
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

  async getRiskThresholds() {
    return this.request('/analytics/risk-thresholds');
  }

  async getRoleRiskMetrics() {
    return this.request('/analytics/role-risk');
  }

  async triggerEscalationCheck() {
    return this.request('/analytics/escalation-check', { method: 'POST' });
  }

  async getDeliveryVelocity(projectId) {
    return this.request(`/analytics/project/${projectId}/delivery-velocity`);
  }

  async getSprintVelocity(projectId) {
    return this.request(`/analytics/project/${projectId}/sprint-velocity`);
  }

  async getTeamPerformance(projectId) {
    return this.request(`/analytics/project/${projectId}/team-performance`);
  }

  async getMetricsHistory(projectId) {
    return this.request(`/analytics/project/${projectId}/metrics-history`);
  }

  async verifyAdmin(email, password) {
    return this.request('/auth/verify-admin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async createUser(userData) {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateRole(userId, role) {
    return this.request('/auth/update-role', {
      method: 'PUT',
      body: JSON.stringify({ userId, role })
    });
  }

  async approveProject(projectId, data) {
    return this.request(`/projects/${projectId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async rejectProject(projectId, reason) {
    return this.request(`/projects/${projectId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // ============ TEAM MANAGEMENT ============
  async getMyTeam() {
    return this.request('/team/my-team');
  }

  async addTeamMember(memberData) {
    return this.request('/team/add-member', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async getTeamStats(teamLeaderId) {
    return this.request(`/team/team-stats/${teamLeaderId}`);
  }

  async getManagerTeamLeaders() {
    return this.request('/team/my-team-leaders');
  }

  async getHRManagers() {
    return this.request('/team/managers');
  }

  async getManagerStatsDetails(managerId) {
    return this.request(`/team/manager-stats/${managerId}`);
  }
}

export const api = new ApiService();
export default api;
