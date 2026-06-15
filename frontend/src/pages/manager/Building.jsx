import { useState, useEffect } from 'react'
import { Building2, Save, RefreshCw, Clock, MapPin, Layers, LayoutGrid, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'

export default function ManagerBuilding() {
  const [buildingData, setBuildingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Edit fields
  const [formData, setFormData] = useState({
    buildingName: '',
    address: '',
    weekdayHours: '',
    weekendHours: '',
    is247: false
  })

  const fetchBuildingInfo = async () => {
    setLoading(true)
    try {
      const response = await api.get('/parking/buildings/info')
      if (response.data && response.data.success) {
        const data = response.data.data
        setBuildingData(data)
        setFormData({
          buildingName: data.building_name || '',
          address: data.address || '',
          weekdayHours: data.operation_hours?.weekday_hours || '06:00 - 22:00',
          weekendHours: data.operation_hours?.weekend_hours || '08:00 - 20:00',
          is247: data.operation_hours?.is_24_7 || false
        })
      }
    } catch (error) {
      console.error('Error fetching building info:', error)
      toast.error('Failed to load building details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuildingInfo()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await api.put('/parking/buildings/info', {
        building_name: formData.buildingName,
        address: formData.address,
        weekday_hours: formData.weekdayHours || undefined,
        weekend_hours: formData.weekendHours || undefined,
        is_24_7: false
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Building settings updated')
        fetchBuildingInfo()
      }
    } catch (error) {
      console.error('Error updating building info:', error)
      toast.error(error.message || 'Failed to update building info')
    } finally {
      setFormSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading building parameters...</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-in flex flex-col lg:flex-row gap-6 h-full">
      {/* LEFT PANEL: OVERVIEW & REAL-TIME STATS */}
      <div className="flex-1 space-y-6">
        <div className="card">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                {buildingData?.building_name} Overview
              </h2>
              <p className="text-xs text-slate-400">ID: {buildingData?.building_id} • Status: {buildingData?.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <Layers className="text-blue-500 shrink-0" size={20} />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Floors</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white font-mono">{buildingData?.total_floors} Levels</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <LayoutGrid className="text-blue-500 shrink-0" size={20} />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Slots</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white font-mono">{buildingData?.total_slots} Slots</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Building Address</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                {buildingData?.address || 'No Address configured'}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Operation Mode</span>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Weekdays: {buildingData?.operation_hours?.weekday_hours} • Weekends: {buildingData?.operation_hours?.weekend_hours}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* OCCUPANCY CHARTS/DETAILS */}
        {buildingData?.current_occupancy && (
          <div className="card">
            <h3 className="subsection-title">Real-Time Occupancy Rate</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-500">Filled Slots</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {buildingData.current_occupancy.total_occupied} / {buildingData.total_slots} slots
                </span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${buildingData.current_occupancy.occupancy_rate}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: CONFIGURATION FORM */}
      <div className="w-full lg:w-96">
        <div className="card h-full">
          <h3 className="subsection-title flex items-center gap-2">
            Adjust Building Info
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Modify general operating hours, location details, and names. Changes apply instantly.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Building Name *</label>
              <input
                type="text"
                required
                value={formData.buildingName}
                onChange={(e) => setFormData(prev => ({ ...prev, buildingName: e.target.value }))}
                className="input-field"
                placeholder="e.g. Smartpark Central"
              />
            </div>

            <div>
              <label className="label">Address *</label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="input-field py-2 resize-none"
                placeholder="e.g. 123 Parking Way, Tower A"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
              <div>
                <label className="label">Mon - Fri Hours *</label>
                <input
                  type="text"
                  required
                  pattern="^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$"
                  value={formData.weekdayHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, weekdayHours: e.target.value }))}
                  className="input-field font-mono"
                  placeholder="06:00 - 22:00"
                />
              </div>
              <div>
                <label className="label">Weekend Hours *</label>
                <input
                  type="text"
                  required
                  pattern="^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$"
                  value={formData.weekendHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, weekendHours: e.target.value }))}
                  className="input-field font-mono"
                  placeholder="08:00 - 20:00"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
              disabled={formSubmitting}
            >
              {formSubmitting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
