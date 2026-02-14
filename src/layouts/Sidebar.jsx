import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  Code2, 
  Settings, 
  Menu, 
  X,
  Users,
  GitBranch,
  CheckSquare,
  ChevronDown
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['hr', 'manager', 'team_leader', 'developer'], path: '/' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['hr', 'manager', 'team_leader'], path: '/projects' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['hr', 'manager'], path: '/analytics' },
  { id: 'repository', label: 'Repository', icon: Code2, roles: ['manager', 'team_leader', 'developer'], path: '/repository' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['team_leader', 'developer'], path: '/tasks' },
  { id: 'team', label: 'Team', icon: Users, roles: ['hr', 'manager'], path: '/team' },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['hr', 'manager', 'team_leader', 'developer'], path: '/settings' },
]

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  )

  const handleItemClick = (item) => {
    navigate(item.path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsCollapsed(true)
    }
  }

  // Get current active item based on pathname
  const getActiveItem = () => {
    const currentPath = location.pathname
    return menuItems.find(item => item.path === currentPath)?.id || 'dashboard'
  }

  const activeItem = getActiveItem()

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 fixed lg:relative z-50"
    >
      {/* Logo and collapse button */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-gray-900 truncate">ProjectPulse</span>
          )}
        </motion.div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          {isCollapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group',
                    activeItem === item.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
