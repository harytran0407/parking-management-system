import React, { useState } from 'react';
import { Shield, Building2, Users, UserCheck, Plus, Edit2, Trash2 } from 'lucide-react';

export default function RoleManagement() {
  const [roles] = useState([
    {
      id: 1,
      name: 'SystemAdmin',
      badge: '#01',
      activeSeats: 3,
      icon: <Shield size={20} />,
      color: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
      permissions: [
        'Manage all system users & security',
        'Global system configuration & API access',
        'Financial auditing & revenue reports',
        'Full architectural control',
      ],
    },
    {
      id: 2,
      name: 'ParkingManager',
      badge: '#02',
      activeSeats: 5,
      icon: <Building2 size={20} />,
      color: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      permissions: [
        'Configure dynamic pricing models',
        'Manage floor plans & slot zoning',
        'View operational efficiency analytics',
        'Incident report management',
      ],
    },
    {
      id: 3,
      name: 'ParkingStaff',
      badge: '#03',
      activeSeats: 15,
      icon: <Users size={20} />,
      color: 'bg-cyan-50 dark:bg-cyan-950/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      permissions: [
        'Manual vehicle check-in/out',
        'Resolve lost ticket disputes',
        'Gate override control',
        'Live session monitoring',
      ],
    },
    {
      id: 4,
      name: 'ParkingUser',
      badge: '#04',
      activeSeats: 1250,
      icon: <UserCheck size={20} />,
      color: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      permissions: [
        'Register personal vehicles & RFID',
        'Digital wallet & payment processing',
        'Advance booking & slot reservation',
        'View personal parking history',
      ],
    },
  ]);

  return (
    <div className="w-full space-y-6 animate-slide-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Role Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage access levels and authority boundaries across the SmartPark ecosystem.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto">
          <Plus size={18} />
          Create New Role
        </button>
      </div>

      {/* ROLE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`${role.color} border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all hover:shadow-md`}
          >
            {/* HEADER */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-white dark:bg-slate-900 ${role.iconColor}`}>
                  {role.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {role.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      role.id === 1 ? 'bg-green-500'
                      : role.id === 2 ? 'bg-blue-500'
                      : role.id === 3 ? 'bg-cyan-500'
                      : 'bg-amber-500'
                    }`} />
                    {role.activeSeats} active {role.activeSeats === 1 ? 'seat' : 'seats'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400`}>
                {role.badge}
              </span>
            </div>

            {/* PERMISSIONS LIST */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                Key Permissions
              </p>
              <ul className="space-y-2">
                {role.permissions.map((permission, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      role.id === 1 ? 'bg-red-500'
                      : role.id === 2 ? 'bg-blue-500'
                      : role.id === 3 ? 'bg-cyan-500'
                      : 'bg-amber-500'
                    }`} />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                      {permission}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Edit2 size={14} />
                Edit All
              </button>
              {role.id !== 1 && role.id !== 4 && (
                <button className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* INFO SECTION */}
      <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 rounded-xl p-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <span className="text-blue-600 dark:text-blue-400">ℹ</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Need more granularity?
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Custom roles allow you to combine specific permission sets for unique staff requirements. You can clone an existing role and modify it to suit your facility's logistical workflow.
            </p>
            <div className="flex gap-2 mt-3">
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Documentation
              </button>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
