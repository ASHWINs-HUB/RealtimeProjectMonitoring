import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Unauthorized } from '@/pages/Unauthorized';
import { HRDashboard } from '@/pages/HRDashboard';
import { ManagerDashboard } from '@/pages/ManagerDashboard';
import { TeamLeaderDashboard } from '@/pages/TeamLeaderDashboard';
import { DeveloperDashboard } from '@/pages/DeveloperDashboard';
import { DeveloperTasks } from '@/pages/DeveloperTasks';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { MyScorePage } from '@/pages/MyScorePage';
import { TeamManagementPage } from '@/pages/TeamManagementPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TeamPage } from '@/pages/TeamPage';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { StakeholderDashboard } from '@/pages/StakeholderDashboard';

const AnalyticsRouter = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  if (['hr', 'manager', 'team_leader'].includes(user.role)) {
    return <AnalyticsPage />;
  }
  return <MyScorePage />;
};

const DashboardRouter = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin': return <AdminDashboard />;
    case 'stakeholder': return <StakeholderDashboard />;
    case 'hr': return <HRDashboard />;
    case 'manager': return <ManagerDashboard />;
    case 'team_leader': return <TeamLeaderDashboard />;
    case 'developer': return <DeveloperDashboard />;
    default: return <Unauthorized />;
  }
};

export const AppRouter = () => {
  const { user, isAuthenticated, isLoading: loading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Always verify authentication on mount to ensure session validity
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Syncing ProjectPulse AI...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes inside MainLayout */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'stakeholder', 'hr', 'manager', 'team_leader', 'developer']}><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* Project Routes */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />

        {/* Analytics & AI Insights */}
        <Route path="/analytics" element={<AnalyticsRouter />} />
        <Route path="/insights" element={<ProtectedRoute allowedRoles={['hr', 'manager']}><InsightsPage /></ProtectedRoute>} />

        {/* Team/User Management */}
        <Route path="/team" element={<ProtectedRoute allowedRoles={['hr', 'manager']}><TeamManagementPage /></ProtectedRoute>} />
        <Route path="/team-members" element={<ProtectedRoute allowedRoles={['team_leader']}><TeamPage /></ProtectedRoute>} />
        <Route path="/team-analytics" element={<AnalyticsRouter />} />

        {/* Developer Specifics */}
        <Route path="/tasks" element={<ProtectedRoute allowedRoles={['developer', 'team_leader']}><DeveloperTasks /></ProtectedRoute>} />
        <Route path="/task-management" element={<ProtectedRoute allowedRoles={['developer']}><DeveloperTasks /></ProtectedRoute>} />
        <Route path="/my-score" element={<ProtectedRoute allowedRoles={['developer']}><MyScorePage /></ProtectedRoute>} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
