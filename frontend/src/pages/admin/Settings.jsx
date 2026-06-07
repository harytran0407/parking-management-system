import React, { useState } from 'react';
import { Info, Wifi, Clock, Zap } from 'lucide-react';

export default function SystemConfiguration() {
  const [config, setConfig] = useState({
    buildingName: 'Trung Hòa Parking Tower',
    address: 'Số 1 Trung Hòa, Cầu Giấy, Hà Nội',
    totalFloors: 8,
    totalSlots: 500,
  });

  const [hours, setHours] = useState({
    weekday_open: '06:00',
    weekday_close: '22:00',
    weekend_open: '07:00',
    weekend_close: '23:00',
    is24_7: false,
  });

  const [features, setFeatures] = useState({
    aiSlotAllocation: true,
    bookingSystem: true,
    vnPayIntegration: true,
  });

  const [systemHealth] = useState({
    gateResponse: 42,
    sensorAccuracy: 99.8,
  });

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleHourChange = (field, value) => {
    setHours(prev => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (feature) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="w-full space-y-6 animate-slide-in">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          System Configuration
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage site-wide parameters, operational hours, and system features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONFIG */}
        <div className="lg:col-span-2 space-y-6">
          {/* GENERAL SETTINGS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Info size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">General Settings</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Building Name
                </label>
                <input
                  type="text"
                  value={config.buildingName}
                  onChange={(e) => handleConfigChange('buildingName', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => handleConfigChange('address', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Total Floors
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{config.totalFloors}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Total Slots
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{config.totalSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OPERATIONAL HOURS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Operational Hours</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hours.is24_7}
                  onChange={(e) => handleHourChange('is24_7', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">24/7 Operation</span>
              </label>
            </div>

            {!hours.is24_7 && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full" />
                    Weekday (Mon - Fri)
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase">Opening</label>
                      <input
                        type="time"
                        value={hours.weekday_open}
                        onChange={(e) => handleHourChange('weekday_open', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase">Closing</label>
                      <input
                        type="time"
                        value={hours.weekday_close}
                        onChange={(e) => handleHourChange('weekday_close', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    Weekend (Sat - Sun)
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase">Opening</label>
                      <input
                        type="time"
                        value={hours.weekend_open}
                        onChange={(e) => handleHourChange('weekend_open', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase">Closing</label>
                      <input
                        type="time"
                        value={hours.weekend_close}
                        onChange={(e) => handleHourChange('weekend_close', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hours.is24_7 && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                  This facility operates 24/7. Gate access is always available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* SYSTEM HEALTH */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-5">
              <Wifi size={18} className="opacity-80" />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">LIVE</span>
            </div>
            <h3 className="text-xl font-bold mb-5">System Health</h3>
            <p className="text-xs opacity-80 mb-4">Real-time status of IoT sensors and gate controllers.</p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase">Gate Response</span>
                  <span className="text-lg font-bold">{systemHealth.gateResponse}ms</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${(systemHealth.gateResponse / 100) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase">Sensor Accuracy</span>
                  <span className="text-lg font-bold">{systemHealth.sensorAccuracy}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${systemHealth.sensorAccuracy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE FLAGS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Feature Flags</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'aiSlotAllocation', label: 'AI Slot Allocation', desc: 'Optimize parking flow' },
                { key: 'bookingSystem', label: 'Booking System', desc: 'Allow advance reservations' },
                { key: 'vnPayIntegration', label: 'VNPay Integration', desc: 'Electronic payments' },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{feature.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feature.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleFeature(feature.key)}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                      features[feature.key]
                        ? 'bg-blue-600'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        features[feature.key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 justify-end">
        <button className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Reset to Default
        </button>
        <button className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Save System Configuration
        </button>
      </div>
    </div>
  );
}
