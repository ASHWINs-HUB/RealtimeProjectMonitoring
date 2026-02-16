import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { MainLayout } from '@/layouts/MainLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { HRDashboard } from '@/pages/HRDashboard';
import { ManagerDashboard } from '@/pages/ManagerDashboard';
import { TeamLeaderDashboard } from '@/pages/TeamLeaderDashboard';
import { DeveloperDashboard } from '@/pages/DeveloperDashboard';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { MyScorePage } from '@/pages/MyScorePage';
import { TeamManagementPage } from '@/pages/TeamManagementPage';
import { motion, AnimatePresence } from 'framer-motion';

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Unified Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading: loading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) checkAuth();
  }, [isAuthenticated, checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Simple Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'hr': return <HRDashboard />;
    case 'manager': return <ManagerDashboard />;
    case 'team_leader': return <TeamLeaderDashboard />;
    case 'developer': return <DeveloperDashboard />;
    default: return <Navigate to="/login" />;
  }
};

const App = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<PageTransition><DashboardRouter /></PageTransition>} />

          <Route path="/projects" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'team_leader']}><PageTransition><ProjectsPage /></PageTransition></ProtectedRoute>} />
          <Route path="/projects/:id" element={<PageTransition><ProjectDetailPage /></PageTransition>} />

          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['hr', 'manager']}><PageTransition><AnalyticsPage /></PageTransition></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute allowedRoles={['hr', 'manager']}><PageTransition><InsightsPage /></PageTransition></ProtectedRoute>} />

          <Route path="/team" element={<ProtectedRoute allowedRoles={['hr', 'manager']}><PageTransition><TeamManagementPage /></PageTransition></ProtectedRoute>} />

          <Route path="/tasks" element={<ProtectedRoute allowedRoles={['developer', 'team_leader']}><PageTransition><DeveloperDashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/my-score" element={<ProtectedRoute allowedRoles={['developer']}><PageTransition><MyScorePage /></PageTransition></ProtectedRoute>} />

          {/* Fallback to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default App;
