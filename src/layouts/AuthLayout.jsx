import React from 'react'

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </div>
  )
}
