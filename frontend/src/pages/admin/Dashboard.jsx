import React, { useState, useEffect } from 'react';
import {
  Car, TrendingUp, AlertTriangle, Ticket, RefreshCw, Clock,
  DollarSign, Users, Activity,
} from 'lucide-react';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    total_slots: 500,
    occupied_slots: 320,
    available_slots: 180,
    today_revenue: 12400000,
    active_sessions: 1248,
    occupancy_rate: 82,
    alerts: [
      { type: 'sensor_malfunction', location: 'Section B, Level 3', time: '2m ago' },
      { type: 'overstay_detected', plate: '29A-123.45', time: '15m ago' },
      { type: 'maintenance_scheduled', title: 'Elevator #2 maintenance', time: '1h ago' },
    ],
    sessions: [
      { vehicle: 'Standard SUV', plate: '308-882.91', entry: 'Oct 24, 14:22', location: 'Level 2, Zone B-12', duration: '2h 14m', status: 'ACTIVE' },
      { vehicle: 'Premium Sedan', plate: '330-335.22', entry: 'Oct 24, 13:45', location: 'Level 1, VIP-04', duration: '2h 51m', status: 'ACTIVE' },
      { vehicle: 'EV-Motorbike', plate: '29A-667.23', entry: 'Oct 24, 16:10', location: 'Lobby, Moto-02', duration: '0h 26m', status: 'PARKED' },
    ],
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const occupancyColor =
    dashboardData.occupancy_rate > 85 ? '#E24B4A'
    : dashboardData.occupancy_rate > 60 ? '#BA7517'
    : '#185FA5';

  return (
    <div className="w-full space-y-4 animate-slide-in pb-0">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">
            System Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDate(currentTime)} — {formatTime(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900/40">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            Live monitoring
          </div>
        </div>
      </div>

      {/* 5 METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Total Slots',
            value: dashboardData.total_slots,
            icon: <Car size={18} />,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/40',
          },
          {
            label: "Today's Revenue",
            value: (dashboardData.today_revenue / 1000000).toFixed(1) + 'M VND',
            icon: <DollarSign size={18} />,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            small: true,
          },
          {
            label: 'Active Sessions',
            value: dashboardData.active_sessions,
            icon: <Activity size={18} />,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/40',
          },
          {
            label: 'Occupancy Rate',
            value: dashboardData.occupancy_rate + '%',
            icon: <TrendingUp size={18} />,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/40',
          },
          {
            label: 'Active Alerts',
            value: dashboardData.alerts.length,
            icon: <AlertTriangle size={18} />,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-950/40',
          },
        ].map((m, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                {m.label}
              </p>
              <p className={`font-semibold text-slate-800 dark:text-white ${m.small ? 'text-base' : 'text-xl'}`}>
                {m.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${m.bg} ${m.color} shrink-0`}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* OCCUPANCY + ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Occupancy card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Car size={16} className="text-blue-500" />
              Lot Occupancy Status
            </h4>
            <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
              <TrendingUp size={11} /> Rising
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dashboardData.occupancy_rate}%`, backgroundColor: occupancyColor }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1.5">
            <span>0% empty</span>
            <span style={{ color: occupancyColor }}>{dashboardData.occupancy_rate}% filled</span>
            <span>100% full</span>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-center">
            {[
              { label: 'Total', value: dashboardData.total_slots, color: 'text-slate-700 dark:text-slate-300' },
              { label: 'Occupied', value: dashboardData.occupied_slots, color: 'text-slate-800 dark:text-white' },
              { label: 'Available', value: dashboardData.available_slots, color: 'text-blue-600 dark:text-blue-400' },
            ].map((o, i) => (
              <div key={i} className={i === 1 ? 'border-x border-slate-100 dark:border-slate-800' : ''}>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                  {o.label}
                </p>
                <p className={`text-lg font-semibold mt-1 ${o.color}`}>{o.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            Active Alerts
          </h4>

          <div className="space-y-2 overflow-y-auto max-h-[200px]">
            {dashboardData.alerts.map((alert, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border bg-red-50/60 border-red-100 dark:bg-red-950/10 dark:border-red-900/40 text-red-700 dark:text-red-400 flex items-start gap-2 text-xs font-medium"
              >
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[10px] uppercase tracking-wide block mb-0.5">
                    {alert.type.replace(/_/g, ' ')}
                  </span>
                  <p className="text-[11px]">{alert.location || alert.plate || alert.title}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REAL-TIME SESSION FEED */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Real-time Session Feed</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">VEHICLE / TAG</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">ENTRY TIME</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">LOCATION</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">DURATION</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.sessions.map((session, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{session.vehicle}</p>
                      <p className="text-slate-500">{session.plate}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{session.entry}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{session.location}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{session.duration}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold ${
                      session.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
