import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Zap, Shield, Briefcase, FolderKanban, BarChart3, Settings,
  Home, Users, Lightbulb, CheckSquare, X, LogOut, Bell, Menu,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { RoleSwitcher, ProfileDropdown } from '@/components/dashboard/TopBarActions';

// Role-based navigation configuration
const ROLE_NAV = {
  admin: [
    { path: '/dashboard', label: 'Admin Hub', icon: Shield },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/analytics', label: 'Global Analytics', icon: BarChart3 },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ],
  stakeholder: [
    { path: '/dashboard', label: 'Proposals', icon: Briefcase },
    { path: '/projects', label: 'My Projects', icon: FolderKanban },
    { path: '/analytics', label: 'Portfolio Stats', icon: BarChart3 },
  ],
  hr: [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/insights', label: 'Insights', icon: Lightbulb },
  ],
  manager: [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/team', label: 'Team', icon: Users },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/insights', label: 'Insights', icon: Lightbulb },
  ],
  team_leader: [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/team-analytics', label: 'Team Analytics', icon: BarChart3 },
    { path: '/team-members', label: 'Team Members', icon: Users },
  ],
  developer: [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]
};

export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = ROLE_NAV[user?.role] || [];

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    admin: 'Global Admin',
    stakeholder: 'Stakeholder',
    hr: 'HR Admin',
    manager: 'Manager',
    team_leader: 'Team Leader',
    developer: 'Developer'
  };

  const roleColors = {
    admin: 'from-gray-900 to-black',
    stakeholder: 'from-blue-600 to-cyan-500',
    hr: 'from-violet-500 to-purple-600',
    manager: 'from-blue-500 to-indigo-600',
    team_leader: 'from-teal-500 to-cyan-600',
    developer: 'from-orange-500 to-amber-600'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-100/80
        transform transition-all duration-500 ease-in-out
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex-shrink-0
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:w-[80px]'}
      `}>
        <div className="flex flex-col h-full bg-slate-50/30">
          {/* Brand */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 bg-gradient-to-br ${roleColors[user?.role] || 'from-indigo-600 to-violet-600'} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0 transition-transform duration-500 ${!sidebarOpen && 'lg:scale-90 lg:-translate-x-1'}`}>
                  <Zap size={18} className="text-white fill-current" />
                </div>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <h1 className="text-base font-black tracking-tight text-slate-800">
                      ProjectPulse
                    </h1>
                    <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest leading-none">AI Hub</p>
                  </motion.div>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
            <p className={`px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${!sidebarOpen && 'lg:hidden'}`}>
              Console
            </p>
            <ul className="space-y-1 mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path
                  || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group
                        ${isActive
                          ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                          : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'
                        }
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0
                        ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-400'}
                      `}>
                        <Icon size={16} className="transition-transform group-hover:scale-110" />
                      </div>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="tracking-tight whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className={`p-4 mx-4 mb-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden ${!sidebarOpen && 'lg:mx-2 lg:p-2 lg:rounded-2xl'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${roleColors[user?.role] || 'from-gray-400 to-gray-500'} rounded-2xl rotate-3 flex items-center justify-center shadow-lg flex-shrink-0`}>
                <span className="text-white font-black text-xs -rotate-3">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{roleLabels[user?.role]}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 text-xs font-black text-rose-500 bg-rose-50/50 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 ${sidebarOpen ? 'px-3 py-2.5' : 'p-2.5'}`}
            >
              <LogOut size={14} />
              {sidebarOpen && "LOGOUT"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 h-20 flex items-center px-4 sm:px-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-200/50 group shadow-inner"
                id="sidebar-toggle"
              >
                {sidebarOpen ? <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" /> : <Menu size={18} />}
              </button>
              <div className="flex items-center gap-3">
                <div className="h-8 w-[2px] bg-slate-200 hidden lg:block rounded-full" />
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {navItems.find(item => item.path === location.pathname)?.label || 'Overview'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <RoleSwitcher />

              <div className="h-6 w-px bg-slate-100 mx-2 hidden sm:block" />

              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all group"
                  id="notification-bell"
                >
                  <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-4 ring-rose-500/10" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-20"
                    >
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Risk Alerts</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => { markAllAsRead(); }}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                              <Bell size={20} className="text-slate-300" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No active threats</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map(notif => (
                            <div
                              key={notif.id}
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors
                                ${!notif.is_read ? 'bg-indigo-50/30' : ''}
                              `}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) navigate(notif.link);
                                setNotifOpen(false);
                              }}
                            >
                              <p className="text-[13px] font-bold text-slate-900 leading-snug">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-2">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-6 w-px bg-slate-100 mx-2 hidden sm:block" />

              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-0 px-4 pb-4 sm:pt-0 sm:px-6 sm:pb-6 lg:pt-0 lg:px-8 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>

        {/* Professional Dark Footer */}
        <footer className="mt-auto bg-[#040405] border-t border-slate-800/30 pt-16 pb-8 px-8 overflow-hidden relative">
          {/* Subtle Indigo Glow background accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
              {/* Brand Section */}
              <div className="md:col-span-4 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Zap size={20} className="text-white fill-current" />
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-white uppercase flex flex-col leading-none">
                    ProjectPulse
                    <span className="text-[10px] text-indigo-400 tracking-[0.4em] font-black mt-1">AI HUB</span>
                  </h1>
                </div>
                <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-sm">
                  The ultimate command center for modern engineering teams.
                  Leveraging predictive ML to turn raw development data into actionable delivery insights.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                    <GitBranch size={16} />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                    <Briefcase size={16} />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                    <CheckSquare size={16} />
                  </a>
                </div>
              </div>

              {/* Navigation Group 1 */}
              <div className="md:col-span-2 space-y-6">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-l-2 border-indigo-600 pl-3">Ecosystem</h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Portfolio View', icon: FolderKanban },
                    { label: 'ML Analytics', icon: BarChart3 },
                    { label: 'Team Pulse', icon: Users },
                    { label: 'Smart Insights', icon: Lightbulb }
                  ].map(link => (
                    <li key={link.label}>
                      <a href="#" className="flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-indigo-400 transition-colors group">
                        <link.icon size={12} className="opacity-50 group-hover:opacity-100" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Navigation Group 2 */}
              <div className="md:col-span-2 space-y-6">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-l-2 border-indigo-600 pl-3">Solutions</h4>
                <ul className="space-y-3 font-bold">
                  {['Jira Real-time', 'GitHub Webhooks', 'Risk Prediction', 'Resource Loading'].map(item => (
                    <li key={item}>
                      <a href="#" className="text-[13px] text-slate-500 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Section */}
              <div className="md:col-span-4 space-y-6">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest border-l-2 border-indigo-600 pl-3">Infrastructure</h4>
                <div className="space-y-4">
                  <div className="bg-[#0e0e11] border border-slate-800/60 rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Engine v4.0</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Operational</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                        <span>API Latency</span>
                        <span className="text-white">42ms</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[94%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800/40 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                  © {new Date().getFullYear()} PROJECTPULSE
                </p>
                <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-tighter hidden md:block">
                  Proprietary AI Framework for Enterprise Development
                </p>
              </div>

              <div className="flex items-center gap-6">
                {['Terms', 'Privacy', 'Security', 'SLA'].map(legal => (
                  <a key={legal} href="#" className="text-[11px] font-black text-slate-600 hover:text-white transition-colors tracking-widest uppercase">
                    {legal}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
