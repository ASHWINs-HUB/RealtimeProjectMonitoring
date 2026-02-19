import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Plus, Search, Mail, Phone, MapPin, MoreHorizontal, User, Loader2 } from 'lucide-react'
import api from '@/services/api'
import { useToast } from '@/components/ui/Toast'

export const TeamPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetchTeam = useCallback(async () => {
    try {
      const data = await api.getUsers()
      setTeamMembers(data.users || [])
    } catch (error) {
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
  }

  const filteredTeamMembers = teamMembers.filter(member => {
    const status = member.is_active ? 'active' : 'inactive'
    const matchesFilter = filter === 'all' || status === filter
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Manage team members and roles</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={20} className="mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {teamMembers.filter(m => m.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {teamMembers.filter(m => m.role === 'developer').length}
            </div>
            <div className="text-sm text-gray-600">Developers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {teamMembers.filter(m => m.role === 'manager' || m.role === 'hr').length}
            </div>
            <div className="text-sm text-gray-600">Leadership</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={20} className="text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{member.role?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(member.is_active)}`}>
                      {member.is_active ? 'active' : 'inactive'}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <span className="truncate">{member.email}</span>
                  </div>

                  {member.department && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Department</span>
                      <span className="font-medium text-gray-900">{member.department}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Joined</span>
                    <span className="font-medium text-gray-900">{member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 bg-gray-50 hover:bg-gray-100 border-none">
                    <Mail size={14} className="mr-1" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default TeamPage
