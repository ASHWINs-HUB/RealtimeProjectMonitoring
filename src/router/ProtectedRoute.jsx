import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
