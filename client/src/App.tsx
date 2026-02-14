import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard components
import HRDashboard from './pages/hr/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';
import TeamLeaderDashboard from './pages/team-leader/Dashboard';
import DeveloperDashboard from './pages/developer/Dashboard';

// Project pages
import ProjectsList from './pages/ProjectsList';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';

// Module pages
import ModuleDetails from './pages/ModuleDetails';
import TaskBoard from './pages/TaskBoard';

// Analytics pages
import Analytics from './pages/Analytics';
import RiskAssessment from './pages/RiskAssessment';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Redirect based on role */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* Dashboard routes */}
                <Route path="dashboard" element={<ProtectedRoute roles={['hr']}><HRDashboard /></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute roles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute roles={['team_leader']}><TeamLeaderDashboard /></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute roles={['developer']}><DeveloperDashboard /></ProtectedRoute>} />
                
                {/* Project routes */}
                <Route path="projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
                <Route path="projects/new" element={<ProtectedRoute roles={['hr', 'manager']}><CreateProject /></ProtectedRoute>} />
                <Route path="projects/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
                
                {/* Module routes */}
                <Route path="modules/:moduleId" element={<ProtectedRoute><ModuleDetails /></ProtectedRoute>} />
                <Route path="modules/:moduleId/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
                
                {/* Analytics routes */}
                <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="risk-assessment" element={<ProtectedRoute roles={['hr', 'manager']}><RiskAssessment /></ProtectedRoute>} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4aed88',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ff4b4b',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
