import { Bell, Settings } from 'lucide-react'

export default function Header({ title = 'Dashboard' }) {
  return (
    <header className="header-wrapper">
      <div className="pl-6 lg:pl-0">
        <h1 className="text-1xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
          <Bell size={20} className="text-gray-300" />
        </button>
        <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
          <Settings size={20} className="text-gray-300" />
        </button>
      </div>
    </header>
  )
}
