import { useState, useEffect } from 'react'
import { Search, UserPlus, Edit, Lock, Unlock, Shield, X, Mail, Phone, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'

export default function ManagerStaff() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)

  // Forms state
  const [addForm, setAddForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })
  
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  })

  const [formSubmitting, setFormSubmitting] = useState(false)

  // Fetch staff list
  const fetchStaff = async () => {
    setLoading(true)
    try {
      const response = await api.get('/manager/staff', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter || undefined
        }
      })
      if (response.data && response.data.success) {
        setStaffList(response.data.data)
      } else {
        toast.error('Failed to load staff list')
      }
    } catch (error) {
      console.error('Fetch staff error:', error)
      toast.error(error.message || 'Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [statusFilter])

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchStaff()
  }

  // Handle Add Staff
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    
    // Quick validation
    if (addForm.password !== addForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setFormSubmitting(true)
    try {
      const response = await api.post('/manager/staff', {
        username: addForm.username,
        full_name: addForm.fullName,
        email: addForm.email,
        phone_number: addForm.phoneNumber,
        password: addForm.password,
        confirm_password: addForm.confirmPassword
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Staff member added successfully')
        setIsAddModalOpen(false)
        setAddForm({
          username: '',
          fullName: '',
          email: '',
          phoneNumber: '',
          password: '',
          confirmPassword: ''
        })
        fetchStaff()
      }
    } catch (error) {
      console.error('Add staff error:', error)
      toast.error(error.message || 'Failed to add staff member')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (staff) => {
    setSelectedStaff(staff)
    setEditForm({
      fullName: staff.full_name || '',
      email: staff.email || '',
      phone: staff.phone || ''
    })
    setIsEditModalOpen(true)
  }

  // Handle Edit Staff
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStaff) return

    setFormSubmitting(true)
    try {
      const response = await api.put(`/manager/staff/${selectedStaff.user_id}`, {
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Staff profile updated successfully')
        setIsEditModalOpen(false)
        fetchStaff()
      }
    } catch (error) {
      console.error('Edit staff error:', error)
      toast.error(error.message || 'Failed to update staff member')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Toggle Status (ACTIVE/BANNED)
  const handleToggleStatus = async (staff) => {
    const newStatus = staff.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE'
    
    try {
      const response = await api.put(`/manager/staff/${staff.user_id}/status`, {
        status: newStatus
      })

      if (response.data && response.data.success) {
        toast.success(`Staff status updated to ${newStatus} successfully`)
        // Update local state directly to be fast and smooth
        setStaffList(prev => 
          prev.map(item => item.user_id === staff.user_id ? { ...item, status: newStatus } : item)
        )
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      toast.error(error.message || 'Failed to update staff status')
    }
  }

  return (
    <div className="animate-slide-in flex flex-col h-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="section-title mb-1">Staff Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, update, and manage access status for parking operations staff.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        >
          <UserPlus size={18} />
          Add Parking Staff
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Name, Username, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex w-full md:w-auto gap-4 items-center self-end md:self-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full md:w-48"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BANNED">Banned</option>
            </select>
            <button
              type="button"
              onClick={fetchStaff}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Refresh List"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </form>
      </div>

      {/* STAFF LIST TABLE */}
      <div className="card flex-1 overflow-hidden p-0 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading staff records...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
            <Shield size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No staff records found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              Try adjusting your search criteria or add a new parking staff member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Staff Details</th>
                  <th className="table-header">Username</th>
                  <th className="table-header">Contact Information</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created At</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr 
                    key={staff.user_id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
                          {staff.avatar_url ? (
                            <img src={staff.avatar_url} alt={staff.full_name} className="w-full h-full object-cover" />
                          ) : (
                            (staff.full_name || staff.username || 'S').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{staff.full_name || 'N/A'}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Staff Agent</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono font-semibold text-slate-700 dark:text-slate-300">
                      @{staff.username}
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Mail size={12} className="text-slate-400" />
                          <span>{staff.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Phone size={12} className="text-slate-400" />
                          <span>{staff.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        staff.status === 'ACTIVE' 
                          ? 'badge-success' 
                          : staff.status === 'INACTIVE' 
                          ? 'badge-warning' 
                          : 'badge-error'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-500">
                      {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Details"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className={`p-1.5 rounded-lg transition-all ${
                            staff.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800'
                              : 'text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-950/40'
                          }`}
                          title={staff.status === 'ACTIVE' ? 'Deactivate / Ban Staff' : 'Activate Staff'}
                        >
                          {staff.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          ADD STAFF MODAL
         ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg shadow-2xl relative animate-slide-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add Parking Staff</h3>
                <p className="text-xs text-slate-500">Create a new operator account for check-in/out duties.</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Username *</label>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={(e) => setAddForm(prev => ({ ...prev, username: e.target.value.trim() }))}
                    className="input-field"
                    placeholder="e.g. johndoe"
                  />
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.fullName}
                    onChange={(e) => setAddForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value.trim() }))}
                    className="input-field"
                    placeholder="e.g. john@domain.com"
                  />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addForm.phoneNumber}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phoneNumber: e.target.value.trim() }))}
                    className="input-field"
                    placeholder="e.g. 0912345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.confirmPassword}
                    onChange={(e) => setAddForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="input-field"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT STAFF MODAL
         ============================================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg shadow-2xl relative animate-slide-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Edit size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Staff Details</h3>
                <p className="text-xs text-slate-500">Update contact and profile details for @{selectedStaff?.username}.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value.trim() }))}
                    className="input-field"
                    placeholder="e.g. john@domain.com"
                  />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value.trim() }))}
                    className="input-field"
                    placeholder="e.g. 0912345678"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
