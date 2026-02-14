import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { Login } from '@/pages/Login'
import { Unauthorized } from '@/pages/Unauthorized'
import { HRDashboard } from '@/pages/HRDashboard'
import { ManagerDashboard } from '@/pages/ManagerDashboard'
import { TeamLeaderDashboard } from '@/pages/TeamLeaderDashboard'
import { DeveloperDashboard } from '@/pages/DeveloperDashboard'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { TasksPage } from '@/pages/TasksPage'
import { TeamPage } from '@/pages/TeamPage'
import { RepositoryPage } from '@/pages/RepositoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuthStore } from '@/store/authStore'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

const RoleBasedRoute = ({ children, requiredRole }) => {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

const DashboardRouter = () => {
  const { user } = useAuthStore()
  
  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'hr':
        return <HRDashboard />
      case 'manager':
        return <ManagerDashboard />
      case 'team_leader':
        return <TeamLeaderDashboard />
      case 'developer':
        return <DeveloperDashboard />
      default:
        return <Navigate to="/login" replace />
    }
  }
  
  return (
    <MainLayout>
      {getDashboardComponent()}
    </MainLayout>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />
        
        {/* Project Routes */}
        <Route path="/projects" element={
          <ProtectedRoute>
            <MainLayout><ProjectsPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Analytics Routes */}
        <Route path="/analytics" element={
          <RoleBasedRoute requiredRole="hr">
            <MainLayout><AnalyticsPage /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/analytics" element={
          <RoleBasedRoute requiredRole="manager">
            <MainLayout><AnalyticsPage /></MainLayout>
          </RoleBasedRoute>
        } />
        
        {/* Repository Routes */}
        <Route path="/repository" element={
          <RoleBasedRoute requiredRole="manager">
            <MainLayout><RepositoryPage /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/repository" element={
          <RoleBasedRoute requiredRole="team_leader">
            <MainLayout><RepositoryPage /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/repository" element={
          <RoleBasedRoute requiredRole="developer">
            <MainLayout><RepositoryPage /></MainLayout>
          </RoleBasedRoute>
        } />
        
        {/* Tasks Routes */}
        <Route path="/tasks" element={
          <RoleBasedRoute requiredRole="team_leader">
            <MainLayout><TasksPage /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/tasks" element={
          <RoleBasedRoute requiredRole="developer">
            <MainLayout><TasksPage /></MainLayout>
          </RoleBasedRoute>
        } />
        
        {/* Team Routes */}
        <Route path="/team" element={
          <RoleBasedRoute requiredRole="hr">
            <MainLayout><TeamPage /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/team" element={
          <RoleBasedRoute requiredRole="manager">
            <MainLayout><TeamPage /></MainLayout>
          </RoleBasedRoute>
        } />
        
        {/* Settings Routes */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout><SettingsPage /></MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Direct role routes */}
        <Route path="/hr" element={
          <RoleBasedRoute requiredRole="hr">
            <MainLayout><HRDashboard /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/manager" element={
          <RoleBasedRoute requiredRole="manager">
            <MainLayout><ManagerDashboard /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/team-leader" element={
          <RoleBasedRoute requiredRole="team_leader">
            <MainLayout><TeamLeaderDashboard /></MainLayout>
          </RoleBasedRoute>
        } />
        <Route path="/developer" element={
          <RoleBasedRoute requiredRole="developer">
            <MainLayout><DeveloperDashboard /></MainLayout>
          </RoleBasedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
