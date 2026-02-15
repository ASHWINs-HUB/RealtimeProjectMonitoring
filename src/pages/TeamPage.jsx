import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Plus, Search, Mail, Phone, MapPin, MoreHorizontal, User } from 'lucide-react'

const mockTeamMembers = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@company.com', 
    role: 'HR Manager',
    department: 'Human Resources',
    location: 'New York',
    status: 'active',
    avatar: null,
    joinDate: '2022-01-15',
    projects: 8
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@company.com', 
    role: 'Project Manager',
    department: 'Engineering',
    location: 'San Francisco',
    status: 'active',
    avatar: null,
    joinDate: '2021-06-20',
    projects: 12
  },
  { 
    id: 3, 
    name: 'Mike Johnson', 
    email: 'mike@company.com', 
    role: 'Team Leader',
    department: 'Engineering',
    location: 'Remote',
    status: 'active',
    avatar: null,
    joinDate: '2021-11-10',
    projects: 6
  },
  { 
    id: 4, 
    name: 'Sarah Wilson', 
    email: 'sarah@company.com', 
    role: 'Senior Developer',
    department: 'Engineering',
    location: 'Austin',
    status: 'active',
    avatar: null,
    joinDate: '2022-03-05',
    projects: 4
  },
  { 
    id: 5, 
    name: 'Tom Brown', 
    email: 'tom@company.com', 
    role: 'Developer',
    department: 'Engineering',
    location: 'Seattle',
    status: 'active',
    avatar: null,
    joinDate: '2022-08-12',
    projects: 3
  },
  { 
    id: 6, 
    name: 'Alice Green', 
    email: 'alice@company.com', 
    role: 'UI/UX Designer',
    department: 'Design',
    location: 'Boston',
    status: 'inactive',
    avatar: null,
    joinDate: '2023-02-01',
    projects: 2
  },
]

export const TeamPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600'
      case 'inactive': return 'bg-red-100 text-red-600'
      case 'on-leave': return 'bg-yellow-100 text-yellow-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredTeamMembers = mockTeamMembers.filter(member => {
    const matchesFilter = filter === 'all' || member.status === filter
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

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
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{mockTeamMembers.length}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {mockTeamMembers.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {mockTeamMembers.filter(m => m.department === 'Engineering').length}
            </div>
            <div className="text-sm text-gray-600">Engineering</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {mockTeamMembers.filter(m => m.department === 'Design').length}
            </div>
            <div className="text-sm text-gray-600">Design</div>
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
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <span>{member.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{member.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium text-gray-900">{member.department}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Projects</span>
                    <span className="font-medium text-gray-900">{member.projects}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Joined</span>
                    <span className="font-medium text-gray-900">{member.joinDate}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Mail size={14} className="mr-1" />
                    Email
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Phone size={14} className="mr-1" />
                    Call
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
