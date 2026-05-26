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
        const savedUserStr = localStorage.getItem(`profile_${email}`);
        let existingUser ={};
        if(savedUserStr){
           existingUser = JSON.parse(savedUserStr);
        }
      const userData = {
        id: existingUser.id || '1',
        email:email,
        name: existingUser.name || email.split('@')[0],
        role:role,
        phone: existingUser.phone || '',
        avatar: existingUser.avatar || 'https://via.placeholder.com/150'
      }
      
      setUser(userData)

      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('userRole', role)
      localStorage.setItem(`profile_${email}`,JSON.stringify(userData))
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

  // Update user
  const updateUser = useCallback((updateData) =>{
    setUser((prevUser) =>{
      const newUser = {...prevUser,...updateData};
        localStorage.setItem('user',JSON.stringify(newUser));
        //update mock database by email
        localStorage.setItem(`profile_${newUser.email}`,JSON.stringify(newUser));
        return newUser;
    });
  },[]);

  const loginWithGoogle = useCallback(async(googleToken) =>{
      setLoading(true)
      try{
        // [API INTEGRATION]
        await new Promise(resolve =>setTimeout(resolve,5000))

          const userData = {
        id: `G-${Math.floor(Math.random() * 10000)}`, // Tạo một ID ngẫu nhiên
        email: "google.user@gmail.com",               // Thực tế sẽ lấy từ Google
        name: "Google User",
        role: "User",                                 // Mặc định gán là User khi đăng nhập qua Google
        phone: '',
        avatar: 'https://www.svgrepo.com/show/475656/google-color.svg'
      }
      setUser(userData);
        // Save to local storage 
        localStorage.setItem('user',JSON.stringify(userData))
        localStorage.setItem('userRole',userData.role)
        localStorage.setItem(`profile_${userData.email}`,JSON.stringify(userData))
        return userData
      }catch (error) {
        console.error('Google login failed: ',error)
        throw error
      }finally{
        setLoading(false)
      }
  },[])
  const isAuthenticated = !!user


 return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated, updateUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}