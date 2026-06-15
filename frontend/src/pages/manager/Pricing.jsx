import { useState, useEffect } from 'react'
import {
  DollarSign, Plus, Edit, Trash2, Calendar, RefreshCw,
  Layers, X, ShieldAlert, AlertTriangle, Settings, Bike, Car
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

export default function ManagerPricing() {
  const { language } = useLanguage()

  // Tab State: 'policies' | 'vehicleTypes'
  const [activeTab, setActiveTab] = useState('policies')

  // Pricing policies states
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [addForm, setAddForm] = useState({
    vehicleTypeId: '',
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

  // Vehicle types states
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false)
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false)

  const [addTypeForm, setAddTypeForm] = useState({
    typeName: ''
  })

  const [editTypeForm, setEditTypeForm] = useState({
    id: '',
    typeName: ''
  })

  // Deletion preview modal state
  const [deletePreview, setDeletePreview] = useState({
    isOpen: false,
    typeId: null,
    typeName: null,
    slotCount: 0,
    sessionCount: 0,
    canDelete: false,
    reason: null
  })

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [typeSubmitting, setTypeSubmitting] = useState(false)

  // API Call: Fetch Pricing Policies
  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/pricing')
      if (response.data && response.data.success) {
        setPolicies(response.data.data)
      }
    } catch (error) {
      console.error('Error loading pricing policies:', error)
      toast.error(language === 'en' ? 'Failed to load pricing policies' : 'Không thể tải chính sách giá')
    } finally {
      setLoading(false)
    }
  }

  // API Call: Fetch Vehicle Classifications
  const fetchVehicleTypes = async () => {
    setTypesLoading(true)
    try {
      const response = await api.get('/admin/vehicle-types')
      if (response.data && response.data.success) {
        setVehicleTypes(response.data.data)
      }
    } catch (error) {
      console.error('Error loading vehicle types:', error)
      toast.error(language === 'en' ? 'Failed to load vehicle classes' : 'Không thể tải danh sách loại xe')
    } finally {
      setTypesLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
    fetchVehicleTypes()
  }, [])

  // Auto-fill first vehicleTypeId for the add form when classifications are loaded
  useEffect(() => {
    if (vehicleTypes.length > 0 && !addForm.vehicleTypeId) {
      setAddForm(prev => ({ ...prev, vehicleTypeId: vehicleTypes[0].vehicle_type_id.toString() }))
    }
  }, [vehicleTypes])

  // CREATE Pricing Policy
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addForm.vehicleTypeId) {
      toast.error(language === 'en' ? 'Please select a vehicle class' : 'Vui lòng chọn loại xe')
      return
    }
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
        toast.success(response.data.message || (language === 'en' ? 'Pricing policy configured successfully' : 'Đã cấu hình giá thành công'))
        setIsAddModalOpen(false)
        fetchPolicies()
      }
    } catch (error) {
      console.error('Add policy error:', error)
      toast.error(error.response?.data?.message || (language === 'en' ? 'Failed to configure pricing policy' : 'Lỗi khi cấu hình bảng giá'))
    } finally {
      setFormSubmitting(false)
    }
  }

  // UPDATE Pricing Policy
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
        toast.success(response.data.message || (language === 'en' ? 'Pricing policy updated successfully' : 'Cập nhật chính sách giá thành công'))
        setIsEditModalOpen(false)
        fetchPolicies()
      }
    } catch (error) {
      console.error('Update policy error:', error)
      toast.error(error.response?.data?.message || (language === 'en' ? 'Failed to update pricing policy' : 'Lỗi khi cập nhật chính sách giá'))
    } finally {
      setFormSubmitting(false)
    }
  }

  // DELETE Pricing Policy
  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this pricing policy?' : 'Bạn có chắc chắn muốn xóa chính sách giá này?')) return

    try {
      await api.delete(`/admin/pricing/${policyId}`)
      toast.success(language === 'en' ? 'Pricing policy deleted successfully' : 'Đã xóa chính sách giá thành công')
      fetchPolicies()
    } catch (error) {
      console.error('Delete policy error:', error)
      toast.error(error.response?.data?.message || (language === 'en' ? 'Failed to delete pricing policy' : 'Lỗi khi xóa chính sách giá'))
    }
  }

  // CREATE Vehicle Type
  const handleAddTypeSubmit = async (e) => {
    e.preventDefault()
    if (!addTypeForm.typeName.trim()) return
    setTypeSubmitting(true)
    try {
      const response = await api.post('/admin/vehicle-types', {
        vehicle_type_name: addTypeForm.typeName.trim()
      })
      if (response.data && response.data.success) {
        toast.success(language === 'en' ? 'Vehicle class added successfully' : 'Thêm loại xe thành công')
        setIsAddTypeModalOpen(false)
        setAddTypeForm({ typeName: '' })
        fetchVehicleTypes()
      }
    } catch (error) {
      console.error('Error adding vehicle type:', error)
      toast.error(error.response?.data?.message || (language === 'en' ? 'Failed to add vehicle class' : 'Không thể thêm loại xe'))
    } finally {
      setTypeSubmitting(false)
    }
  }

  // UPDATE Vehicle Type
  const openEditTypeModal = (type) => {
    setEditTypeForm({
      id: type.vehicle_type_id,
      typeName: type.vehicle_type_name
    })
    setIsEditTypeModalOpen(true)
  }

  const handleEditTypeSubmit = async (e) => {
    e.preventDefault()
    if (!editTypeForm.typeName.trim()) return
    setTypeSubmitting(true)
    try {
      const response = await api.put(`/admin/vehicle-types/${editTypeForm.id}`, {
        vehicle_type_name: editTypeForm.typeName.trim()
      })
      if (response.data && response.data.success) {
        toast.success(language === 'en' ? 'Vehicle class updated successfully' : 'Cập nhật loại xe thành công')
        setIsEditTypeModalOpen(false)
        fetchVehicleTypes()
        fetchPolicies() // Update pricing policies as names might change
      }
    } catch (error) {
      console.error('Error updating vehicle type:', error)
      toast.error(error.response?.data?.message || (language === 'en' ? 'Failed to update vehicle class' : 'Không thể cập nhật loại xe'))
    } finally {
      setTypeSubmitting(false)
    }
  }

  // DELETE Vehicle Type Click (Pre-check constraint before delete)
  const handleDeleteTypeClick = async (type) => {
    try {
      const response = await api.get(`/admin/vehicle-types/${type.vehicle_type_id}/delete-preview`)
      if (response.data && response.data.success) {
        const preview = response.data.data
        setDeletePreview({
          isOpen: true,
          typeId: preview.vehicle_type_id,
          typeName: preview.vehicle_type_name,
          slotCount: preview.related_slots_count,
          sessionCount: preview.active_sessions_count,
          canDelete: preview.can_delete,
          reason: preview.reason
        })
      }
    } catch (error) {
      console.error('Error getting delete preview:', error)
      toast.error(language === 'en' ? 'Failed to check deletion constraints' : 'Không thể kiểm tra điều kiện ràng buộc xóa')
    }
  }

  // Confirm delete vehicle type
  const handleConfirmDeleteType = async () => {
    if (!deletePreview.typeId) return
    setTypeSubmitting(true)
    try {
      await api.delete(`/admin/vehicle-types/${deletePreview.typeId}`)
      toast.success(language === 'en' ? 'Vehicle class deleted successfully' : 'Đã xóa loại xe thành công')
      setDeletePreview({ isOpen: false, typeId: null, typeName: null, slotCount: 0, sessionCount: 0, canDelete: false, reason: null })
      fetchVehicleTypes()
      fetchPolicies()
    } catch (error) {
      console.error('Error deleting vehicle type:', error)
      toast.error(error.response?.data?.message || (language === 'en' ? 'Failed to delete vehicle class' : 'Không thể xóa loại xe'))
    } finally {
      setTypeSubmitting(false)
    }
  }

  return (
    <div className="animate-slide-in flex flex-col h-full space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="section-title mb-1">
            {language === 'en' ? 'Pricing & Classifications' : 'Cấu hình giá & Loại xe'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Define pricing schedules and manage vehicle classification classes dynamically.'
              : 'Thiết lập bảng giá đỗ xe và quản lý danh mục phân loại xe trong hệ thống.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'policies' ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <Plus size={18} />
              {language === 'en' ? 'Add Pricing Policy' : 'Thêm chính sách giá'}
            </button>
          ) : (
            <button
              onClick={() => setIsAddTypeModalOpen(true)}
              className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <Plus size={18} />
              {language === 'en' ? 'Add Vehicle Class' : 'Thêm loại xe'}
            </button>
          )}
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'policies'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign size={16} />
          {language === 'en' ? 'Pricing Policies' : 'Bảng giá đỗ xe'}
        </button>
        <button
          onClick={() => setActiveTab('vehicleTypes')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'vehicleTypes'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          {language === 'en' ? 'Vehicle Classes' : 'Phân loại xe'}
        </button>
      </div>

      {/* POLICIES TAB VIEW */}
      {activeTab === 'policies' && (
        <div className="card flex-1 overflow-hidden p-0 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'en' ? 'Loading pricing structures...' : 'Đang tải bảng giá đỗ xe...'}
              </p>
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <DollarSign size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
                {language === 'en' ? 'No policies configured' : 'Chưa cấu hình bảng giá nào'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
                {language === 'en'
                  ? 'Add your first pricing policy to start charging parked vehicles.'
                  : 'Hãy cấu hình chính sách giá đầu tiên để bắt đầu thu phí đỗ xe.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">{language === 'en' ? 'Vehicle Category' : 'Loại xe'}</th>
                    <th className="table-header">{language === 'en' ? 'Base Price (Entry)' : 'Giá sàn (Vào cổng)'}</th>
                    <th className="table-header">{language === 'en' ? 'Hourly Rate' : 'Giá giờ tiếp theo'}</th>
                    <th className="table-header">{language === 'en' ? 'Overnight Penalty' : 'Phí gửi qua đêm'}</th>
                    <th className="table-header">{language === 'en' ? 'Admin/Lost Card Fee' : 'Phí phạt mất thẻ / Admin'}</th>
                    <th className="table-header">{language === 'en' ? 'Effective Date' : 'Ngày có hiệu lực'}</th>
                    <th className="table-header text-right">{language === 'en' ? 'Actions' : 'Hành động'}</th>
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
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            {policy.vehicle_type_name?.toLowerCase().includes('car') || policy.vehicle_type_name?.toLowerCase().includes('ô tô') ? (
                              <Car size={18} />
                            ) : (
                              <Bike size={18} />
                            )}
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
      )}

      {/* VEHICLE TYPES TAB VIEW */}
      {activeTab === 'vehicleTypes' && (
        <div className="card flex-1 overflow-hidden p-0 flex flex-col">
          {typesLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'en' ? 'Loading vehicle classifications...' : 'Đang tải danh mục xe...'}
              </p>
            </div>
          ) : vehicleTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <Layers size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
                {language === 'en' ? 'No vehicle classes found' : 'Chưa có danh mục phân loại xe'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
                {language === 'en'
                  ? 'Add a new vehicle type to configure slots and pricing policies.'
                  : 'Hãy tạo loại xe mới để thiết lập cấu hình giá đỗ.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="table-header w-24">{language === 'en' ? 'ID' : 'Mã số'}</th>
                    <th className="table-header">{language === 'en' ? 'Class Name' : 'Tên loại xe'}</th>
                    <th className="table-header">{language === 'en' ? 'Related Slots' : 'Số chỗ đỗ liên kết'}</th>
                    <th className="table-header">{language === 'en' ? 'Active Sessions' : 'Lượt xe đang đỗ'}</th>
                    <th className="table-header text-right">{language === 'en' ? 'Actions' : 'Hành động'}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleTypes.map((type) => (
                    <tr
                      key={type.vehicle_type_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                    >
                      <td className="table-cell font-mono font-bold text-slate-400 dark:text-slate-500">
                        #{type.vehicle_type_id}
                      </td>
                      <td className="table-cell font-bold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          {type.vehicle_type_name?.toLowerCase().includes('car') || type.vehicle_type_name?.toLowerCase().includes('ô tô') ? (
                            <Car size={16} className="text-blue-500" />
                          ) : (
                            <Bike size={16} className="text-amber-500" />
                          )}
                          <span>{type.vehicle_type_name}</span>
                        </div>
                      </td>
                      <td className="table-cell font-semibold text-slate-600 dark:text-slate-400">
                        {type.related_slots_count || 0}
                      </td>
                      <td className="table-cell">
                        {type.active_sessions_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {type.active_sessions_count} {language === 'en' ? 'Active' : 'Đang đỗ'}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-semibold text-xs">—</span>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditTypeModal(type)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title={language === 'en' ? 'Edit Class' : 'Sửa loại xe'}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteTypeClick(type)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title={language === 'en' ? 'Delete Class' : 'Xóa loại xe'}
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
      )}

      {/* ============================================================
          ADD PRICING MODAL
         ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Configure New Policy' : 'Cấu hình giá mới'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? 'Design pricing schedule for vehicles.' : 'Thiết lập bảng giá thu phí cho phương tiện.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Vehicle Class *' : 'Loại xe *'}</label>
                  <select
                    value={addForm.vehicleTypeId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, vehicleTypeId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                  >
                    <option value="" disabled>
                      -- {language === 'en' ? 'Choose Class' : 'Chọn loại xe'} --
                    </option>
                    {vehicleTypes.map(type => (
                      <option key={type.vehicle_type_id} value={type.vehicle_type_id}>
                        {type.vehicle_type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Effective Date *' : 'Ngày có hiệu lực *'}</label>
                  <input
                    type="date"
                    required
                    value={addForm.effectiveDate}
                    onChange={(e) => setAddForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Base Price (Entry) (₫) *' : 'Giá sàn vào cổng (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.basePrice}
                    onChange={(e) => setAddForm(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="input-field font-mono font-bold"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Hourly Rate (₫) *' : 'Giá giờ tiếp theo (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.hourlyRate}
                    onChange={(e) => setAddForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="input-field font-mono font-bold"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Overnight Penalty (₫) *' : 'Phí gửi qua đêm (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.overnightFee}
                    onChange={(e) => setAddForm(prev => ({ ...prev, overnightFee: e.target.value }))}
                    className="input-field font-mono font-bold"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Handling/Lost Card Fee (₫) *' : 'Phí phạt mất thẻ / Admin (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addForm.handlingFee}
                    onChange={(e) => setAddForm(prev => ({ ...prev, handlingFee: e.target.value }))}
                    className="input-field font-mono font-bold"
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
                  {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={formSubmitting}
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {language === 'en' ? 'Save Policy' : 'Lưu bảng giá'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Edit Pricing Policy' : 'Cấu hình lại bảng giá'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? `Update rates and parameters for Policy #${editForm.policyId}.` : `Cấu hình các tham số phí cho Hóa đơn #${editForm.policyId}.`}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">{language === 'en' ? 'Effective Date *' : 'Ngày có hiệu lực *'}</label>
                <input
                  type="date"
                  required
                  value={editForm.effectiveDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  className="input-field font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Base Price (Entry) (₫) *' : 'Giá sàn vào cổng (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.basePrice}
                    onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Hourly Rate (₫) *' : 'Giá giờ tiếp theo (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.hourlyRate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Overnight Penalty (₫) *' : 'Phí gửi qua đêm (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.overnightFee}
                    onChange={(e) => setEditForm(prev => ({ ...prev, overnightFee: e.target.value }))}
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Handling/Lost Ticket Fee (₫) *' : 'Phí phạt mất thẻ / Admin (₫) *'}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.handlingFee}
                    onChange={(e) => setEditForm(prev => ({ ...prev, handlingFee: e.target.value }))}
                    className="input-field font-mono font-bold"
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
                  {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={formSubmitting}
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {language === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          ADD VEHICLE CLASS MODAL
         ============================================================ */}
      {isAddTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <button
              onClick={() => setIsAddTypeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Add Vehicle Class' : 'Thêm danh mục xe mới'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? 'Define a new vehicle classification class.' : 'Định nghĩa một loại phương tiện giao thông mới.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddTypeSubmit} className="space-y-4">
              <div>
                <label className="label">{language === 'en' ? 'Class Name *' : 'Tên loại xe *'}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Electric SUV, Cargo Truck' : 'Ví dụ: Ô tô điện, Xe tải lớn'}
                  value={addTypeForm.typeName}
                  onChange={(e) => setAddTypeForm({ typeName: e.target.value })}
                  className="input-field font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTypeModalOpen(false)}
                  className="btn-secondary"
                  disabled={typeSubmitting}
                >
                  {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={typeSubmitting || !addTypeForm.typeName.trim()}
                >
                  {typeSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {language === 'en' ? 'Create Class' : 'Tạo phân loại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT VEHICLE CLASS MODAL
         ============================================================ */}
      {isEditTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
            <button
              onClick={() => setIsEditTypeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Settings size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Edit Vehicle Class' : 'Sửa loại xe'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? `Update classification details for Type #${editTypeForm.id}.` : `Cập nhật thông tin phân loại cho Phân nhóm #${editTypeForm.id}.`}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditTypeSubmit} className="space-y-4">
              <div>
                <label className="label">{language === 'en' ? 'Class Name *' : 'Tên loại xe *'}</label>
                <input
                  type="text"
                  required
                  value={editTypeForm.typeName}
                  onChange={(e) => setEditTypeForm(prev => ({ ...prev, typeName: e.target.value }))}
                  className="input-field font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditTypeModalOpen(false)}
                  className="btn-secondary"
                  disabled={typeSubmitting}
                >
                  {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={typeSubmitting || !editTypeForm.typeName.trim()}
                >
                  {typeSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {language === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          DELETE PREVIEW CONSTRAINT CHECK MODAL
         ============================================================ */}
      {deletePreview.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6">
            <button
              onClick={() => setDeletePreview(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2.5 rounded-xl ${deletePreview.canDelete ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'}`}>
                {deletePreview.canDelete ? <AlertTriangle size={22} /> : <ShieldAlert size={22} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Delete Vehicle Class' : 'Xóa phân loại xe'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? `Verify deletion safety constraints for "${deletePreview.typeName}".` : `Kiểm tra ràng buộc an toàn trước khi xóa "${deletePreview.typeName}".`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                {language === 'en'
                  ? `Are you sure you want to permanently delete the classification class "${deletePreview.typeName}"? This action cannot be undone.`
                  : `Bạn có chắc muốn xóa vĩnh viễn danh mục loại xe "${deletePreview.typeName}" không? Hành động này không thể phục hồi.`}
              </p>

              {/* Related slot metrics */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl text-xs space-y-2 font-bold text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Linked Parking Slots:' : 'Số chỗ đỗ xe liên kết:'}</span>
                  <span className={deletePreview.slotCount > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}>
                    {deletePreview.slotCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Active Parking Sessions:' : 'Số lượt đỗ đang hoạt động:'}</span>
                  <span className={deletePreview.sessionCount > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>
                    {deletePreview.sessionCount}
                  </span>
                </div>
              </div>

              {/* Custom Warning message from backend */}
              {!deletePreview.canDelete && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-2.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">{language === 'en' ? 'Delete Operation Blocked' : 'Khóa thao tác xóa'}</p>
                    <p className="opacity-90 leading-relaxed">
                      {deletePreview.reason || (language === 'en' ? 'This class is linked to active parking slots or sessions.' : 'Loại xe này hiện đang được gán cho các chỗ đỗ hoặc có xe đang đỗ trong bãi.')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletePreview(prev => ({ ...prev, isOpen: false }))}
                  className="btn-secondary"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  onClick={handleConfirmDeleteType}
                  disabled={!deletePreview.canDelete || typeSubmitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 uppercase transition"
                >
                  {typeSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {language === 'en' ? 'Confirm Delete' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
