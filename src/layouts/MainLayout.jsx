import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { 
  Menu, 
  X, 
  Home, 
  FolderKanban, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Github,
  Target,
  TrendingUp,
  CheckSquare
} from 'lucide-react'

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const getNavigationItems = () => {
    const items = []

    if (user?.role === 'hr') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/projects', label: 'Projects', icon: FolderKanban },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/insights', label: 'Insights', icon: TrendingUp },
        { path: '/integrations/github', label: 'GitHub', icon: Github },
        { path: '/integrations/jira', label: 'Jira', icon: Target }
      )
    }

    if (user?.role === 'manager') {
      items.push(
        { path: '/manager/dashboard', label: 'Dashboard', icon: Home },
        { path: '/projects', label: 'Projects', icon: FolderKanban },
        { path: '/team', label: 'Team', icon: Users },
        { path: '/manager/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/manager/insights', label: 'Insights', icon: TrendingUp },
        { path: '/integrations/github', label: 'GitHub', icon: Github },
        { path: '/integrations/jira', label: 'Jira', icon: Target }
      )
    }

    if (user?.role === 'team_leader') {
      items.push(
        { path: '/team-leader/dashboard', label: 'Dashboard', icon: Home },
        { path: '/projects', label: 'Projects', icon: FolderKanban },
        { path: '/team', label: 'Team', icon: Users },
        { path: '/team-leader/analytics', label: 'Team Analytics', icon: BarChart3 },
        { path: '/team-leader/insights', label: 'Insights', icon: TrendingUp },
        { path: '/team-members', label: 'Team Members', icon: Users }
      )
    }

    if (user?.role === 'developer') {
      items.push(
        { path: '/developer/dashboard', label: 'Dashboard', icon: Home },
        { path: '/tasks/assigned', label: 'Tasks Assigned', icon: CheckSquare },
        { path: '/tasks/management', label: 'Task Management', icon: Settings }
      )
    }

    return items
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header - spans full width */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <div className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2"></div>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ProjectPulse</h1>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full justify-start"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
