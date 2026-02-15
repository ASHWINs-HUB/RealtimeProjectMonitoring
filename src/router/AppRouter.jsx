import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from './ProtectedRoute'

// Layout Components
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'

// Auth Pages
import { Login } from '@/pages/Login'
import { RegisterPage } from '@/pages/Register'
import { Unauthorized } from '@/pages/Unauthorized'

// Simple dashboard components
import { ProjectsPage } from '@/pages/ProjectsPage'
import { TeamPage } from '@/pages/TeamPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const AppRouter = () => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthLayout>
    )
  }

  return (
    <MainLayout>
      <Routes>
        {/* Dashboard Routes - Simple Content */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['hr', 'manager', 'team_leader', 'developer']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome to your dashboard!</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Team</h3>
                    <p className="text-2xl font-bold text-purple-600">5</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Analytics</h3>
                    <p className="text-2xl font-bold text-orange-600">3</p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Manager Routes */}
        <Route 
          path="/manager/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage your team and projects</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Active Projects</h3>
                    <p className="text-2xl font-bold text-blue-600">8</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
                    <p className="text-2xl font-bold text-green-600">15</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Performance</h3>
                    <p className="text-2xl font-bold text-purple-600">92%</p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Team Leader Routes */}
        <Route 
          path="/team-leader/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['team_leader']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">Team Leader Dashboard</h1>
                <p className="text-gray-600 mt-2">Lead your team to success</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Team Tasks</h3>
                    <p className="text-2xl font-bold text-blue-600">24</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                    <p className="text-2xl font-bold text-green-600">18</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Progress</h3>
                    <p className="text-2xl font-bold text-orange-600">75%</p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Developer Routes */}
        <Route 
          path="/developer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['developer']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
                <p className="text-gray-600 mt-2">Track your work and progress</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">In Progress</h3>
                    <p className="text-2xl font-bold text-orange-600">4</p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Common Routes */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute allowedRoles={['hr', 'manager', 'team_leader']}>
              <ProjectsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/team" 
          element={
            <ProtectedRoute allowedRoles={['manager', 'team_leader']}>
              <TeamPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Default redirect based on role */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={
                user?.role === 'hr' ? '/dashboard' :
                user?.role === 'manager' ? '/manager/dashboard' :
                user?.role === 'team_leader' ? '/team-leader/dashboard' :
                '/developer/dashboard'
              } 
              replace 
            />
          } 
        />
      </Routes>
    </MainLayout>
  )
}
