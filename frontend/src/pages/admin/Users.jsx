import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [users] = useState([
    { id: 1, username: 'staff_nguyenvanA', fullName: 'Nguyễn Văn A', email: 'nguyenvana@parking.com', role: 'ParkingStaff', status: 'ACTIVE' },
    { id: 2, username: 'manager_tranvanB', fullName: 'Trần Văn B', email: 'tranvanb@parking.com', role: 'ParkingManager', status: 'ACTIVE' },
    { id: 3, username: 'admin_levanC', fullName: 'Lê Văn C', email: 'levanc@parking.com', role: 'SystemAdmin', status: 'ACTIVE' },
    { id: 4, username: 'user_phamvandD', fullName: 'Phạm Văn D', email: 'phamvand@parking.com', role: 'ParkingUser', status: 'INACTIVE' },
    { id: 5, username: 'staff_hoangthiE', fullName: 'Hoàng Thị E', email: 'hoangthie@parking.com', role: 'ParkingStaff', status: 'ACTIVE' },
    { id: 6, username: 'user_ngothiF', fullName: 'Ngô Thị F', email: 'ngothif@parking.com', role: 'ParkingUser', status: 'ACTIVE' },
    { id: 7, username: 'manager_buivang', fullName: 'Bùi Văng', email: 'buivang@parking.com', role: 'ParkingManager', status: 'ACTIVE' },
    { id: 8, username: 'user_dothiG', fullName: 'Đỗ Thị G', email: 'dothig@parking.com', role: 'ParkingUser', status: 'ACTIVE' },
  ]);

  const [stats] = useState({
    totalActiveUsers: 1284,
    passwordResets: 18,
    loginActivity: 'Normal',
  });

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return users.filter((user) =>
      user.username.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [searchTerm, users]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SystemAdmin':
        return 'bg-slate-900 text-white dark:bg-slate-700';
      case 'ParkingManager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      case 'ParkingStaff':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="w-full space-y-6 animate-slide-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            User Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto">
          <Plus size={18} />
          Create User
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">USERNAME</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">FULL NAME</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">EMAIL</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">ROLE</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">STATUS</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{user.username}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{user.fullName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                        <Eye size={16} className="text-slate-500" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                        <Edit2 size={16} className="text-slate-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Active Users</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{stats.totalActiveUsers.toLocaleString()}</p>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full">+12%</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password Resets</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{stats.passwordResets}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Last 24h</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Login Activity</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.loginActivity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
