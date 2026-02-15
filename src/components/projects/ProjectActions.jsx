import React from 'react'
import { Button } from '@/components/ui/Button'
import { MoreHorizontal, GitBranch, Users } from 'lucide-react'

export const ProjectActions = ({ project, user, onAssignLeader, onManageGitHub, onViewOffers }) => {
  const [showDropdown, setShowDropdown] = React.useState(false)

  const handleAssignLeader = () => {
    onAssignLeader(project.id)
    setShowDropdown(false)
  }

  const handleManageGitHub = () => {
    onManageGitHub(project)
    setShowDropdown(false)
  }

  const handleViewOffers = () => {
    onViewOffers(project.id)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2"
      >
        <MoreHorizontal size={16} />
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border border-gray-200 z-10">
          <div className="py-1">
            {user?.role === 'manager' && project.status === 'APPROVED' && (
              <button
                onClick={handleAssignLeader}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Users size={16} className="mr-2" />
                Assign Team Leader
              </button>
            )}
            
            <button
              onClick={handleManageGitHub}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <GitBranch size={16} className="mr-2" />
              Manage GitHub
            </button>

            {user?.role === 'manager' && (
              <button
                onClick={handleViewOffers}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <span className="mr-2">📋</span>
                View Offers
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
