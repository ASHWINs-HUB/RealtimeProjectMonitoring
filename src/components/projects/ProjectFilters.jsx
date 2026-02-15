import React from 'react'
import { Button } from '@/components/ui/Button'
import { Search, Filter } from 'lucide-react'

export const ProjectFilters = ({ onSearch, onFilter }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex-1 flex items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={onFilter}>
          <Filter size={16} className="mr-1" />
          Filter
        </Button>
      </div>
    </div>
  )
}
