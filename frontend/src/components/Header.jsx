import React, { useState, useRef, useEffect } from 'react'
import { Bell, Sun, Moon, User, LogOut } from 'lucide-react' 
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth' // Import để lấy thông tin user và logout
import { useNavigate } from 'react-router-dom' // Import để chuyển trang Edit Profile

export default function Header({ title = 'Dashboard' }) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State quản lý việc đóng/mở menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  // Ref dùng để xác định vùng của menu (giúp click ra ngoài thì đóng)
  const dropdownRef = useRef(null)

  // Hàm bắt sự kiện click ra ngoài menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Lấy chữ cái đầu tiên của tên user (Nếu không có thì mặc định là chữ 'U')
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  // Xử lý khi bấm đăng xuất
  const handleLogout = () => {
    setIsDropdownOpen(false)
    logout()
  }

  // Xử lý khi bấm chuyển trang Edit Profile
  const handleEditProfile = () => {
    setIsDropdownOpen(false)
    navigate('/user/profile')
  }

  return (
    <header className="header-wrapper flex items-center justify-between transition-colors duration-300">
      <div className="pl-6 lg:pl-0">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
      </div>
      
      <div className="flex items-center gap-3 lg:gap-4 ml-auto">
        {/* Nút đổi Theme */}
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors focus:outline-none"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-yellow-400" /> 
          ) : (
            <Moon size={20} className="text-slate-600" /> 
          )}
        </button>

        {/* Nút Thông báo (Bell) */}
        <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors focus:outline-none relative mr-2">
          <Bell size={20} className="text-slate-600 dark:text-gray-300" />
          {/* Chấm đỏ báo có thông báo mới (Tùy chọn) */}
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        
        {/* AVATAR & DROPDOWN MENU */}
        <div className="relative" ref={dropdownRef}>
          {/* Nút Avatar */}
          {/* Nút Avatar ĐÃ FIX */}
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </button>

          {/* Menu thả xuống */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 origin-top-right">
              
              {/* Phần Header của Menu (Hiển thị tên & Role) */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                  {user?.name || 'Tài khoản khách'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize mt-0.5">
                  {user?.role || 'Guest'}
                </p>
              </div>

              {/* Phần Danh sách tính năng */}
              <div className="p-1.5">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <User size={16} />
                  Edit Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  )
}