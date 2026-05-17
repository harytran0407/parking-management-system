import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Menu, X } from 'lucide-react'

export default function Sidebar({ navigationItems = [] }) {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar-wrapper fixed lg:relative h-screen overflow-y-auto transition-all duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="pt-6 pb-6 pr-6 pl-16 lg:p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-white">Smartpark</h2>
          <p className="text-xs text-gray-400 mt-1">Parking Management</p>
        </div>

        <nav className="p-6 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-dark-700 bg-dark-900">
          <div className="mb-4 p-3 bg-dark-700 rounded-lg">
            <p className="text-sm text-gray-300">
              <span className="font-semibold">{user?.name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
        />
      )}
    </>
  )
}
