import { useState, useEffect } from 'react'
import { Grid, Plus, RefreshCw, Edit, Trash2, ShieldAlert, Sliders, BatteryCharging, Accessibility, Info, X } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'

export default function ManagerSlots() {
  const [slotsData, setSlotsData] = useState([])
  const [slotsSummary, setSlotsSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedVehicleType, setSelectedVehicleType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // Modal states
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  // Form states
  const [bulkCreateForm, setBulkCreateForm] = useState({
    zoneId: '',
    count: 10
  })
  const [editForm, setEditForm] = useState({
    slotId: '',
    slotName: '',
    isHandicap: false,
    isElectricCharging: false,
    clearSession: false
  })
  
  const [zones, setZones] = useState([])
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Load available zones
  const fetchZones = async () => {
    try {
      const response = await api.get('/parking/floors')
      if (response.data && response.data.success) {
        setZones(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
    }
  }

  // Load slots
  const fetchSlots = async () => {
    setLoading(true)
    try {
      const response = await api.get('/parking/slots', {
        params: {
          floor: selectedFloor ? parseInt(selectedFloor) : undefined,
          zone: selectedZone || undefined,
          vehicleTypeId: selectedVehicleType ? parseInt(selectedVehicleType) : undefined,
          status: selectedStatus || undefined,
          pageSize: 100 // Load more slots for management view
        }
      })
      if (response.data && response.data.success) {
        setSlotsSummary(response.data.data.summary)
        setSlotsData(response.data.data.slots || [])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load parking slots')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [selectedFloor, selectedZone, selectedVehicleType, selectedStatus])

  useEffect(() => {
    fetchZones()
  }, [])

  // Handle Bulk Create
  const handleBulkCreateSubmit = async (e) => {
    e.preventDefault()
    if (!bulkCreateForm.zoneId) {
      toast.error('Please select a Zone')
      return
    }

    setFormSubmitting(true)
    try {
      const response = await api.post('/parking/slots/bulk-create', {
        zone_id: parseInt(bulkCreateForm.zoneId),
        count: parseInt(bulkCreateForm.count)
      })

      if (response.data && response.data.success) {
        toast.success(`Successfully created ${response.data.data.slots_created} slots in ${response.data.data.zone_name}`)
        setIsBulkCreateOpen(false)
        fetchSlots()
      }
    } catch (error) {
      console.error('Bulk create error:', error)
      toast.error(error.message || 'Failed to bulk create slots')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (slot) => {
    setEditForm({
      slotId: slot.slot_id,
      slotName: slot.slot_name,
      isHandicap: slot.is_handicap || false,
      isElectricCharging: slot.is_electric_charging || false,
      clearSession: false
    })
    setIsEditOpen(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await api.put(`/parking/slots/${editForm.slotId}/edit`, {
        is_handicap: editForm.isHandicap,
        is_electric_charging: editForm.isElectricCharging,
        clear_session: editForm.clearSession
      })

      if (response.data && response.data.success) {
        toast.success('Slot updated successfully')
        setIsEditOpen(false)
        fetchSlots()
      }
    } catch (error) {
      console.error('Edit slot error:', error)
      toast.error(error.message || 'Failed to update slot')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Delete Slot
  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this parking slot? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/parking/slots/${slotId}`)
      toast.success('Slot deleted successfully')
      fetchSlots()
    } catch (error) {
      console.error('Delete slot error:', error)
      toast.error(error.message || 'Failed to delete slot (Must be AVAILABLE to delete)')
    }
  }

  // Handle quick update slot status (e.g. MAINTENANCE / AVAILABLE)
  const handleToggleMaintenance = async (slot) => {
    const nextStatus = slot.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
    const payload = {
      status: nextStatus,
      reason: nextStatus === 'MAINTENANCE' ? 'Manager manual lock' : 'Resolved',
      estimated_duration_minutes: nextStatus === 'MAINTENANCE' ? 120 : 0
    }

    try {
      await api.put(`/parking/slots/${slot.slot_id}/status`, payload)
      toast.success(`Slot status updated to ${nextStatus}`)
      fetchSlots()
    } catch (error) {
      console.error('Update status error:', error)
      toast.error(error.message || 'Failed to toggle maintenance status')
    }
  }

  return (
    <div className="animate-slide-in flex flex-col h-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="section-title mb-1">Parking Slots Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View real-time layout grid, edit slot attributes, bulk create or delete slots.
          </p>
        </div>
        <button
          onClick={() => setIsBulkCreateOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        >
          <Plus size={18} />
          Bulk Create Slots
        </button>
      </div>

      {/* SUMMARY STATS BAR */}
      {slotsSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Slots</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{slotsSummary.total_slots}</span>
          </div>
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center">
            <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">Available</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{slotsSummary.available}</span>
          </div>
          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center">
            <span className="text-xs font-bold text-red-500 uppercase block mb-1">Occupied</span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{slotsSummary.occupied}</span>
          </div>
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-center">
            <span className="text-xs font-bold text-amber-500 uppercase block mb-1">Reserved</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{slotsSummary.reserved}</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Maintenance</span>
            <span className="text-2xl font-bold text-slate-600 dark:text-slate-400 font-mono">{slotsSummary.maintenance}</span>
          </div>
        </div>
      )}

      {/* FILTER PANEL */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white mr-2">
            <Sliders size={16} className="text-blue-500" /> Filters
          </div>

          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="input-field w-32 py-1.5 px-3 text-sm font-medium"
          >
            <option value="">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="input-field w-32 py-1.5 px-3 text-sm font-medium"
          >
            <option value="">All Zones</option>
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
          </select>

          <select
            value={selectedVehicleType}
            onChange={(e) => setSelectedVehicleType(e.target.value)}
            className="input-field w-36 py-1.5 px-3 text-sm font-medium"
          >
            <option value="">All Vehicles</option>
            <option value="1">Automobile (Car)</option>
            <option value="2">Motorbike</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field w-36 py-1.5 px-3 text-sm font-medium"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <button
            onClick={fetchSlots}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 ml-auto"
            title="Refresh Slots List"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* GRID DISPLAY */}
      <div className="card flex-1 overflow-hidden p-6 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading slots matrix...</p>
          </div>
        ) : slotsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
            <Grid size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No slots configured</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              Select bulk create option above to assign slots configuration.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {slotsData.map((slot) => {
                let statusClasses = "border-emerald-200 bg-emerald-50/20 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400";
                if (slot.status === "OCCUPIED") statusClasses = "border-red-200 bg-red-50/20 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400";
                if (slot.status === "RESERVED") statusClasses = "border-amber-200 bg-amber-50/20 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400";
                if (slot.status === "MAINTENANCE") statusClasses = "border-slate-200 bg-slate-100/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400";

                return (
                  <div
                    key={slot.slot_id}
                    className={`p-3.5 border rounded-xl flex flex-col justify-between transition-all hover:shadow-md relative group/slot ${statusClasses}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-base font-black font-mono">{slot.slot_name}</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        {slot.is_electric_charging && <BatteryCharging size={14} className="text-teal-500" />}
                        {slot.is_handicap && <Accessibility size={14} className="text-indigo-500" />}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[10px] font-bold font-mono opacity-85">
                      <span>F{slot.floor} • Z{slot.zone}</span>
                      <span>{slot.vehicle_type_id === 1 ? 'CAR' : 'BIKE'}</span>
                    </div>

                    {slot.occupied_by_plate && (
                      <div className="mt-2 pt-1.5 border-t border-dashed border-inherit text-xs font-bold font-mono truncate">
                        🚘 {slot.occupied_by_plate}
                      </div>
                    )}

                    {/* HOVER ACTIONS POPUP OVERLAY */}
                    <div className="absolute inset-0 bg-slate-900/90 rounded-xl flex items-center justify-center gap-2.5 opacity-0 group-hover/slot:opacity-100 transition-all duration-200 backdrop-blur-xs">
                      <button
                        onClick={() => openEditModal(slot)}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Edit slot"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleMaintenance(slot)}
                        className="p-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        title={slot.status === 'MAINTENANCE' ? 'Open Slot' : 'Lock (Maintenance)'}
                      >
                        <ShieldAlert size={14} className={slot.status === 'MAINTENANCE' ? 'text-amber-400' : 'text-slate-300'} />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.slot_id)}
                        disabled={slot.status !== 'AVAILABLE'}
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          BULK CREATE MODAL
         ============================================================ */}
      {isBulkCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsBulkCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bulk Create Slots</h3>
                <p className="text-xs text-slate-500">Auto generate slots for designated Zone.</p>
              </div>
            </div>

            <form onSubmit={handleBulkCreateSubmit} className="space-y-4">
              <div>
                <label className="label">Select Zone-Floor *</label>
                <select
                  required
                  value={bulkCreateForm.zoneId}
                  onChange={(e) => setBulkCreateForm(prev => ({ ...prev, zoneId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">-- Choose Allocation --</option>
                  {zones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.zone_name} (Floor {z.floor_number} • Capacity {z.capacity} • {z.vehicle_type_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Number of slots to generate *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={bulkCreateForm.count}
                  onChange={(e) => setBulkCreateForm(prev => ({ ...prev, count: e.target.value }))}
                  className="input-field"
                />
                <p className="text-[10px] text-slate-400 mt-1">Accept counts from 1 up to 100 per action.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkCreateOpen(false)}
                  className="btn-secondary"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={formSubmitting}
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  Generate Slots
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT SLOT MODAL
         ============================================================ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Edit size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Modify Slot ({editForm.slotName})</h3>
                <p className="text-xs text-slate-500">Configure parameters or override sessions for this slot.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isHandicap}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isHandicap: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Accessibility size={14} className="text-indigo-500" /> Handicap Accessible
                    </p>
                    <p className="text-[10px] text-slate-400">Mark slot for drivers with physical disabilities.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isElectricCharging}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isElectricCharging: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <BatteryCharging size={14} className="text-teal-500" /> EV Electric Charging Station
                    </p>
                    <p className="text-[10px] text-slate-400">Mark slot equipped with EV charger socket.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-red-100/50 dark:border-red-950/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.clearSession}
                    onChange={(e) => setEditForm(prev => ({ ...prev, clearSession: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-red-500" /> Force Clear Session (Override)
                    </p>
                    <p className="text-[10px] text-red-400">Force slot status back to free, solving duplicate locks.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn-secondary"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={formSubmitting}
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
