import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Edit, Trash2, Sliders, X, Layers, Car, Bike, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'

export default function ManagerSlots() {
  const [zonesData, setZonesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Filters
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedVehicleType, setSelectedVehicleType] = useState('')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState(null)

  // Forms
  const [createForm, setCreateForm] = useState({
    zoneName: '',
    floorNumber: '',
    capacity: '',
    vehicleTypeId: '1' // 1: Car, 2: Bike
  })

  const [editForm, setEditForm] = useState({
    zoneId: '',
    zoneName: '',
    floorNumber: '',
    capacity: '',
    vehicleTypeId: '1',
    status: 'ACTIVE' // ACTIVE, MAINTENANCE
  })

  // Fetch all allocations
  const fetchAllocations = async () => {
    setLoading(true)
    try {
      const response = await api.get('/parking/floors')
      if (response.data && response.data.success) {
        setZonesData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
      toast.error('Failed to load parking allocations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllocations()
  }, [])

  // Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.zoneName.trim()) {
      toast.error('Zone Name is required')
      return
    }

    setFormSubmitting(true)
    try {
      const response = await api.post('/parking/floors', {
        zone_name: createForm.zoneName,
        floor_number: parseInt(createForm.floorNumber),
        capacity: parseInt(createForm.capacity),
        vehicle_type_id: parseInt(createForm.vehicleTypeId)
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Floor zone created successfully')
        setIsCreateOpen(false)
        setCreateForm({
          zoneName: '',
          floorNumber: '',
          capacity: '',
          vehicleTypeId: '1'
        })
        fetchAllocations()
      }
    } catch (error) {
      console.error('Create zone error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to create zone')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (zone) => {
    setEditForm({
      zoneId: zone.zone_id,
      zoneName: zone.zone_name,
      floorNumber: zone.floor_number,
      capacity: zone.capacity,
      vehicleTypeId: zone.vehicle_type_id.toString(),
      status: zone.status || 'ACTIVE'
    })
    setIsEditOpen(true)
  }

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await api.put(`/parking/floors/${editForm.zoneId}`, {
        vehicle_type_id: parseInt(editForm.vehicleTypeId),
        capacity: parseInt(editForm.capacity),
        status: editForm.status
      })

      if (response.data && response.data.success) {
        if (response.data.data?.warning) {
          toast.warning(response.data.data.warning)
        } else {
          toast.success(response.data.message || 'Zone updated successfully')
        }
        setIsEditOpen(false)
        fetchAllocations()
      }
    } catch (error) {
      console.error('Edit zone error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update zone')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Delete Modal
  const openDeleteModal = (zone) => {
    setZoneToDelete(zone)
    setIsDeleteOpen(true)
  }

  // Delete Action Submit
  const handleDeleteZoneSubmit = async () => {
    if (!zoneToDelete) return
    setFormSubmitting(true)
    try {
      await api.delete(`/parking/floors/${zoneToDelete.zone_id}`)
      toast.success('Zone allocation deleted successfully')
      setIsDeleteOpen(false)
      setZoneToDelete(null)
      fetchAllocations()
    } catch (error) {
      console.error('Delete zone error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to delete zone allocation')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Filter & Compute Stats
  const filteredZones = zonesData.filter(zone => {
    const matchesFloor = selectedFloor === '' || zone.floor_number.toString() === selectedFloor
    const matchesVehicle = selectedVehicleType === '' || zone.vehicle_type_id.toString() === selectedVehicleType
    return matchesFloor && matchesVehicle
  })

  // Summary figures (based on unfiltered or filtered? usually unfiltered is best for global header stats)
  const totalZones = zonesData.length
  const totalCapacity = zonesData.reduce((sum, zone) => sum + zone.capacity, 0)
  const totalActive = zonesData.reduce((sum, zone) => sum + zone.active_vehicles_count, 0)
  const totalAvailable = Math.max(0, totalCapacity - totalActive)
  const averageOccupancy = totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0

  // Unique floors for filter dropdown
  const uniqueFloors = [...new Set(zonesData.map(z => z.floor_number))].sort((a, b) => a - b)

  return (
    <div className="animate-slide-in flex flex-col h-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="section-title mb-1">Parking Slots Capacity Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure, allocate, and monitor parking capacities per floor and zone.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        >
          <Plus size={18} />
          Add New Zone
        </button>
      </div>

      {/* SUMMARY STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Zones</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalZones}</span>
        </div>
        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-lg text-center">
          <span className="text-xs font-bold text-blue-500 uppercase block mb-1">Total Capacity</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{totalCapacity}</span>
        </div>
        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center">
          <span className="text-xs font-bold text-red-500 uppercase block mb-1">Active Vehicles</span>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{totalActive}</span>
        </div>
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center">
          <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">Available slots</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalAvailable}</span>
        </div>
        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg text-center">
          <span className="text-xs font-bold text-indigo-500 uppercase block mb-1">Occupancy Rate</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{averageOccupancy}%</span>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white mr-2">
            <Sliders size={16} className="text-blue-500" /> Filters
          </div>

          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="input-field w-36 py-1.5 px-3 text-sm font-medium"
          >
            <option value="">All Floors</option>
            {uniqueFloors.map(floor => (
              <option key={floor} value={floor.toString()}>Floor {floor}</option>
            ))}
          </select>

          <select
            value={selectedVehicleType}
            onChange={(e) => setSelectedVehicleType(e.target.value)}
            className="input-field w-40 py-1.5 px-3 text-sm font-medium"
          >
            <option value="">All Vehicle Types</option>
            <option value="1">Motorbike</option>
            <option value="2">Car</option>
          </select>

          <button
            onClick={fetchAllocations}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 ml-auto"
            title="Refresh Allocations"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ALLOCATIONS LIST */}
      <div className="card flex-1 overflow-hidden p-6 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading allocations...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
            <Layers size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No allocations found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              Add a new floor/zone allocation configuration to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredZones.map((zone) => {
                const occupancyPercentage = zone.capacity > 0 ? Math.round((zone.active_vehicles_count / zone.capacity) * 100) : 0
                const isMaintenance = zone.status === 'MAINTENANCE'

                return (
                  <div
                    key={zone.zone_id}
                    className={`p-5 border rounded-xl flex flex-col justify-between transition-all hover:shadow-md bg-white dark:bg-slate-900 ${
                      isMaintenance 
                        ? 'border-amber-200 dark:border-amber-950/60 bg-amber-50/10' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                            Floor {zone.floor_number} • {zone.zone_name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {zone.zone_id}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isMaintenance 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {isMaintenance ? 'Maintenance' : 'Active'}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="space-y-4 my-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          {zone.vehicle_type_id === 2 ? <Car size={16} className="text-blue-500" /> : <Bike size={16} className="text-blue-500" />}
                          <span className="font-semibold">{zone.vehicle_type_name}</span>
                        </div>

                        {/* Occupancy Indicator */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>Occupancy</span>
                            <span>{zone.active_vehicles_count} / {zone.capacity} slots ({occupancyPercentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                occupancyPercentage >= 90 
                                  ? 'bg-red-500' 
                                  : occupancyPercentage >= 75 
                                  ? 'bg-amber-500' 
                                  : 'bg-blue-500'
                              }`} 
                              style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
                        title="Edit Zone Allocation"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(zone)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg transition-colors border border-red-100/50 dark:border-red-950/30 flex items-center gap-1.5 text-xs font-semibold"
                        title="Delete Zone"
                      >
                        <Trash2 size={14} />
                        Delete
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
          CREATE ZONE MODAL
         ============================================================ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create New Zone</h3>
                <p className="text-xs text-slate-500">Configure new zone capacity allocation.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="label">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone A"
                  value={createForm.zoneName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, zoneName: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Floor Number *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 1"
                    value={createForm.floorNumber}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, floorNumber: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Capacity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 50"
                    value={createForm.capacity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, capacity: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Vehicle Type *</label>
                <select
                  required
                  value={createForm.vehicleTypeId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, vehicleTypeId: e.target.value }))}
                  className="input-field"
                >
                  <option value="1">Motorbike</option>
                  <option value="2">Automobile (Car)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT ZONE MODAL
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Allocation ({editForm.zoneName})</h3>
                <p className="text-xs text-slate-500">Modify capacity details or toggle maintenance mode.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Floor (Read-only)</label>
                  <input
                    type="text"
                    disabled
                    value={`Floor ${editForm.floorNumber}`}
                    className="input-field bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-75"
                  />
                </div>
                <div>
                  <label className="label">Capacity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.capacity}
                    onChange={(e) => setEditForm(prev => ({ ...prev, capacity: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Vehicle Type *</label>
                <select
                  required
                  value={editForm.vehicleTypeId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, vehicleTypeId: e.target.value }))}
                  className="input-field"
                >
                  <option value="1">Motorbike</option>
                  <option value="2">Car</option>
                </select>
              </div>

              <div>
                <label className="label">Status *</label>
                <select
                  required
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="input-field"
                >
                  <option value="ACTIVE">Active (Available for parking)</option>
                  <option value="MAINTENANCE">Maintenance (Locked for service)</option>
                </select>
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

      {/* ============================================================
          DELETE CONFIRMATION MODAL
         ============================================================ */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Zone Configuration?</h3>
                <p className="text-xs text-slate-500">Confirm deletion of zone capacity assignment.</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to delete the configuration for{' '}
                <strong className="text-slate-800 dark:text-white">
                  Floor {zoneToDelete?.floor_number} • {zoneToDelete?.zone_name}
                </strong>
                ?
              </p>
              <p className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-950/30">
                Warning: This action cannot be undone. Active bookings or parked sessions on this floor must be cleared before deleting.
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="btn-secondary"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteZoneSubmit}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 border-red-600 hover:border-red-700 focus:ring-red-500"
                  disabled={formSubmitting}
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  Delete Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
