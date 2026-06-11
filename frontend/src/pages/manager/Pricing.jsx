import { useState, useEffect } from 'react'
import { DollarSign, Plus, Edit, Trash2, Calendar, RefreshCw, Layers, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'

export default function ManagerPricing() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const [addForm, setAddForm] = useState({
    vehicleTypeId: '1',
    basePrice: 10000,
    hourlyRate: 5000,
    overnightFee: 50000,
    handlingFee: 2000,
    effectiveDate: new Date().toISOString().split('T')[0]
  })
  
  const [editForm, setEditForm] = useState({
    policyId: '',
    basePrice: 0,
    hourlyRate: 0,
    overnightFee: 0,
    handlingFee: 0,
    effectiveDate: ''
  })
  
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      // The endpoint is /admin/pricing which allows managers too
      const response = await api.get('/admin/pricing')
      if (response.data && response.data.success) {
        setPolicies(response.data.data)
      }
    } catch (error) {
      console.error('Error loading pricing policies:', error)
      toast.error('Failed to load pricing policies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await api.post('/admin/pricing', {
        vehicle_type_id: parseInt(addForm.vehicleTypeId),
        base_price: parseFloat(addForm.basePrice),
        hourly_rate: parseFloat(addForm.hourlyRate),
        overnight_fee: parseFloat(addForm.overnightFee),
        handling_fee: parseFloat(addForm.handlingFee),
        effective_date: addForm.effectiveDate
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Pricing policy configured successfully')
        setIsAddModalOpen(false)
        fetchPolicies()
      }
    } catch (error) {
      console.error('Add policy error:', error)
      toast.error(error.message || 'Failed to configure pricing policy')
    } finally {
      setFormSubmitting(false)
    }
  }

  const openEditModal = (policy) => {
    setEditForm({
      policyId: policy.policy_id,
      basePrice: policy.base_price,
      hourlyRate: policy.hourly_rate,
      overnightFee: policy.overnight_fee,
      handlingFee: policy.handling_fee || 0,
      effectiveDate: policy.effective_date
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    try {
      const response = await api.put(`/admin/pricing/${editForm.policyId}`, {
        base_price: parseFloat(editForm.basePrice),
        hourly_rate: parseFloat(editForm.hourlyRate),
        overnight_fee: parseFloat(editForm.overnightFee),
        handling_fee: parseFloat(editForm.handlingFee),
        effective_date: editForm.effectiveDate
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Pricing policy updated successfully')
        setIsEditModalOpen(false)
        fetchPolicies()
      }
    } catch (error) {
      console.error('Update policy error:', error)
      toast.error(error.message || 'Failed to update pricing policy')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this pricing policy?')) return
    
    try {
      await api.delete(`/admin/pricing/${policyId}`)
      toast.success('Pricing policy deleted successfully')
      fetchPolicies()
    } catch (error) {
      console.error('Delete policy error:', error)
      toast.error(error.message || 'Failed to delete pricing policy')
    }
  }

  return (
    <div className="animate-slide-in flex flex-col h-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="section-title mb-1">Pricing Configuration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define base price, hourly rate, overnight fees, and handling charges per vehicle class.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        >
          <Plus size={18} />
          Add Pricing Policy
        </button>
      </div>

      {/* POLICIES LIST */}
      <div className="card flex-1 overflow-hidden p-0 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading pricing structures...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <DollarSign size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No policies configured</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              Add your first pricing policy to start charging parked vehicles.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Vehicle Category</th>
                  <th className="table-header">Base Price (Entry)</th>
                  <th className="table-header">Hourly Rate</th>
                  <th className="table-header">Overnight Penalty</th>
                  <th className="table-header">Admin/Lost Card Fee</th>
                  <th className="table-header">Effective Date</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr 
                    key={policy.policy_id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                          {policy.vehicle_type_name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {policy.vehicle_type_name || `Type ${policy.vehicle_type_id}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {policy.vehicle_type_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-semibold font-mono text-slate-700 dark:text-slate-300">
                      {parseFloat(policy.base_price).toLocaleString()} ₫
                    </td>
                    <td className="table-cell font-semibold font-mono text-slate-700 dark:text-slate-300">
                      +{parseFloat(policy.hourly_rate).toLocaleString()} ₫/hr
                    </td>
                    <td className="table-cell font-semibold font-mono text-slate-700 dark:text-slate-300">
                      {parseFloat(policy.overnight_fee).toLocaleString()} ₫
                    </td>
                    <td className="table-cell font-semibold font-mono text-slate-700 dark:text-slate-300">
                      {parseFloat(policy.handling_fee || 0).toLocaleString()} ₫
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold font-mono">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{policy.effective_date}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => openEditModal(policy)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Policy"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePolicy(policy.policy_id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Delete Policy"
                        >
                          <Trash2 size={15} />
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
          ADD PRICING MODAL
         ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <DollarSign size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Configure New Policy</h3>
                <p className="text-xs text-slate-500">Design pricing schedule for vehicles.</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Vehicle Class *</label>
                  <select
                    value={addForm.vehicleTypeId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, vehicleTypeId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="1">Automobile (Car)</option>
                    <option value="2">Motorbike</option>
                  </select>
                </div>
                <div>
                  <label className="label">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={addForm.effectiveDate}
                    onChange={(e) => setAddForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Base Price (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.basePrice}
                    onChange={(e) => setAddForm(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="input-field font-mono"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="label">Hourly Rate (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.hourlyRate}
                    onChange={(e) => setAddForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="input-field font-mono"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Overnight Penalty (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.overnightFee}
                    onChange={(e) => setAddForm(prev => ({ ...prev, overnightFee: e.target.value }))}
                    className="input-field font-mono"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="label">Handling/Lost Ticket Fee (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.handlingFee}
                    onChange={(e) => setAddForm(prev => ({ ...prev, handlingFee: e.target.value }))}
                    className="input-field font-mono"
                    placeholder="2000"
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
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT PRICING MODAL
         ============================================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900">
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Pricing Policy</h3>
                <p className="text-xs text-slate-500">Update rates and parameters for Policy #{editForm.policyId}.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={editForm.effectiveDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  className="input-field font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Base Price (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.basePrice}
                    onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Hourly Rate (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.hourlyRate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Overnight Penalty (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.overnightFee}
                    onChange={(e) => setEditForm(prev => ({ ...prev, overnightFee: e.target.value }))}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Handling/Lost Ticket Fee (₫) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.handlingFee}
                    onChange={(e) => setEditForm(prev => ({ ...prev, handlingFee: e.target.value }))}
                    className="input-field font-mono"
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
