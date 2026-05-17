import React, { createContext, useState, useCallback } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  // CHANGE: Initialize state using a function (Lazy Initialization)
  // It checks localStorage at the very first millisecond when the app loads
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        return JSON.parse(savedUser) // If data exists, parse it into an Object and load it into State immediately
      } catch (e) {
        console.error("Error parsing user from localStorage:", e)
        return null
      }
    }
    return null // If no data exists, default to null
  })

  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password, role) => {
    setLoading(true)
    try {
      // Simulate API loading time (Mock API)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const userData = {
        id: '1',
        email,
        name: email.split('@')[0],
        role,
        avatar: 'https://via.placeholder.com/150'
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('userRole', role)
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
  }, [])

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}