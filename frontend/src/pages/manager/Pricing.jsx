import { useState, useEffect } from 'react'
import {
  DollarSign, Plus, Edit, Trash2, Calendar, RefreshCw,
  X, ShieldAlert, Bike, Car, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

const getTodayStr = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ManagerPricing() {
  const { language } = useLanguage()

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
    effectiveDate: getTodayStr()
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
  const [formSubmitting, setFormSubmitting] = useState(false)

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


  const getActivePolicyForType = (typeId) => {
    const today = getTodayStr()
    const typePolicies = policies.filter(p => p.vehicle_type_id === typeId && p.effective_date <= today)
    if (typePolicies.length === 0) return null
    // Sort descending by effective date
    typePolicies.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))
    return typePolicies[0]
  }

  const getPolicyStatus = (policy) => {
    const today = getTodayStr()
    const activePolicy = getActivePolicyForType(policy.vehicle_type_id)
    
    if (activePolicy && policy.policy_id === activePolicy.policy_id) {
      return {
        label: language === 'en' ? 'Active' : 'Đang áp dụng',
        colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
      }
    } else if (policy.effective_date > today) {
      return {
        label: language === 'en' ? 'Scheduled' : 'Đã lên lịch',
        colorClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
      }
    } else {
      return {
        label: language === 'en' ? 'Historical' : 'Hết hiệu lực',
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent'
      }
    }
  }

  return (
    <div className="animate-slide-in flex flex-col space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="section-title mb-1">
            {language === 'en' ? 'Pricing Policy' : 'Chính sách & Bảng giá'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'Configure and manage active pricing rules for Car and Motorbike parking.'
              : 'Thiết lập và quản lý biểu phí đỗ xe áp dụng cho xe máy và ô tô.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            <Plus size={18} />
            {language === 'en' ? 'Add Pricing Policy' : 'Thêm chính sách giá'}
          </button>
        </div>
      </div>

      {loading || typesLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {language === 'en' ? 'Loading pricing structures...' : 'Đang tải thông tin bảng giá...'}
          </p>
        </div>
      ) : (
        <>
          {/* ACTIVE RATES CARDS GRID */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              {language === 'en' ? 'Current Active Rates' : 'Giá vé đang áp dụng hiện tại'}
            </h3>
            
            {vehicleTypes.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-slate-400">{language === 'en' ? 'No vehicle types defined.' : 'Chưa có phân loại xe nào.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicleTypes.map(type => {
                  const activePolicy = getActivePolicyForType(type.vehicle_type_id);
                  const isCar = type.vehicle_type_name?.toLowerCase().includes('car') || type.vehicle_type_name?.toLowerCase().includes('ô tô');
                  
                  return (
                    <div 
                      key={type.vehicle_type_id} 
                      className={`card relative overflow-hidden transition-all duration-300 hover:shadow-lg border ${
                        isCar 
                          ? 'bg-gradient-to-br from-blue-50/40 via-white to-blue-50/10 dark:from-blue-950/10 dark:via-slate-900 dark:to-blue-950/5 border-blue-100 dark:border-blue-900/30' 
                          : 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/10 dark:from-amber-950/10 dark:via-slate-900 dark:to-amber-950/5 border-amber-100 dark:border-amber-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl shadow-sm ${
                            isCar 
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          }`}>
                            {isCar ? <Car size={24} /> : <Bike size={24} />}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                              {type.vehicle_type_name}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {type.vehicle_type_id}</p>
                          </div>
                        </div>
                        
                        {activePolicy ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {language === 'en' ? 'Active' : 'Đang áp dụng'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {language === 'en' ? 'No Active Rate' : 'Chưa cấu hình'}
                          </span>
                        )}
                      </div>

                      {activePolicy ? (
                        <div className="space-y-5">
                          {/* Base Price Display */}
                          <div className="text-center py-4 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-slate-100/50 dark:border-slate-800/20">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                              {language === 'en' ? 'Base Entry Fee' : 'Giá vào cổng'}
                            </span>
                            <div className="text-3xl font-black text-slate-800 dark:text-white font-mono flex items-center justify-center gap-1">
                              {parseFloat(activePolicy.base_price).toLocaleString()}
                              <span className="text-base font-bold text-slate-400">₫</span>
                            </div>
                          </div>

                          {/* Rates Detail list */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-blue-500" />
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {language === 'en' ? 'Hourly Rate' : 'Giá mỗi giờ tiếp theo'}
                                </span>
                              </div>
                              <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                                +{parseFloat(activePolicy.hourly_rate).toLocaleString()} ₫
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-500" />
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {language === 'en' ? 'Overnight Fee' : 'Phí gửi qua đêm'}
                                </span>
                              </div>
                              <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                                {parseFloat(activePolicy.overnight_fee).toLocaleString()} ₫
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center gap-2">
                                <ShieldAlert size={16} className="text-rose-500" />
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {language === 'en' ? 'Lost Card Penalty' : 'Phí phạt mất thẻ'}
                                </span>
                              </div>
                              <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                                {parseFloat(activePolicy.handling_fee || 0).toLocaleString()} ₫
                              </span>
                            </div>
                          </div>

                          {/* Effective Date & Quick Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                            <div className="flex items-center gap-1.5 font-bold font-mono text-slate-400">
                              <Calendar size={14} />
                              <span>
                                {language === 'en' ? 'Since' : 'Áp dụng từ'}: {activePolicy.effective_date}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(activePolicy)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-all flex items-center gap-1"
                              >
                                <Edit size={13} />
                                {language === 'en' ? 'Edit' : 'Sửa'}
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(activePolicy.policy_id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold rounded-lg transition-all flex items-center gap-1"
                              >
                                <Trash2 size={13} />
                                {language === 'en' ? 'Delete' : 'Xóa'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <DollarSign size={40} className="text-slate-300 dark:text-slate-700 mb-2" />
                          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                            {language === 'en' ? 'No rates set' : 'Chưa thiết lập phí'}
                          </p>
                          <button
                            onClick={() => {
                              setAddForm(prev => ({ ...prev, vehicleTypeId: type.vehicle_type_id.toString() }));
                              setIsAddModalOpen(true);
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                          >
                            {language === 'en' ? 'Configure Rates' : 'Thiết lập ngay'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* POLICY HISTORY & SCHEDULES TABLE */}
          <div className="card p-0 overflow-hidden flex flex-col mt-6">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Pricing Schedules & Adjustment History' : 'Lịch trình điều chỉnh & Lịch sử giá vé'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'en' ? 'All historical records and future pricing updates.' : 'Danh sách toàn bộ các mức giá trong quá khứ và lịch trình tăng giảm phí đã lên lịch.'}
                </p>
              </div>
            </div>

            {policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign size={40} className="text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  {language === 'en' ? 'No policy records found' : 'Chưa có bản ghi giá vé nào'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="table-header">{language === 'en' ? 'Vehicle Type' : 'Loại xe'}</th>
                      <th className="table-header">{language === 'en' ? 'Base Price' : 'Giá vào cổng'}</th>
                      <th className="table-header">{language === 'en' ? 'Hourly Rate' : 'Giá giờ sau'}</th>
                      <th className="table-header">{language === 'en' ? 'Overnight Fee' : 'Phí qua đêm'}</th>
                      <th className="table-header">{language === 'en' ? 'Lost Card Penalty' : 'Phí mất thẻ'}</th>
                      <th className="table-header">{language === 'en' ? 'Effective Date' : 'Ngày hiệu lực'}</th>
                      <th className="table-header">{language === 'en' ? 'Status' : 'Trạng thái'}</th>
                      <th className="table-header text-right">{language === 'en' ? 'Actions' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...policies]
                      .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))
                      .map((policy) => {
                        const statusInfo = getPolicyStatus(policy);
                        const isCar = policy.vehicle_type_name?.toLowerCase().includes('car') || policy.vehicle_type_name?.toLowerCase().includes('ô tô');
                        
                        return (
                          <tr
                            key={policy.policy_id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors duration-150 border-b border-slate-100 dark:border-slate-800/40"
                          >
                            <td className="table-cell">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${isCar ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'}`}>
                                  {isCar ? <Car size={14} /> : <Bike size={14} />}
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {policy.vehicle_type_name || `Type ${policy.vehicle_type_id}`}
                                </span>
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
                            <td className="table-cell font-semibold font-mono text-xs text-slate-500 dark:text-slate-400">
                              {policy.effective_date}
                            </td>
                            <td className="table-cell">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.colorClass}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="table-cell text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                <button
                                  onClick={() => openEditModal(policy)}
                                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all"
                                  title="Edit Policy"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeletePolicy(policy.policy_id)}
                                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-all"
                                  title="Delete Policy"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ADD PRICING POLICY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
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

            <form onSubmit={handleAddSubmit} className="space-y-5">
              {/* INTERACTIVE VEHICLE SELECT CARDS */}
              <div>
                <label className="label mb-2">{language === 'en' ? 'Vehicle Category *' : 'Loại phương tiện *'}</label>
                <div className="grid grid-cols-2 gap-4">
                  {vehicleTypes.map(type => {
                    const isCar = type.vehicle_type_name?.toLowerCase().includes('car') || type.vehicle_type_name?.toLowerCase().includes('ô tô');
                    const isSelected = addForm.vehicleTypeId === type.vehicle_type_id.toString();
                    
                    return (
                      <button
                        key={type.vehicle_type_id}
                        type="button"
                        onClick={() => setAddForm(prev => ({ ...prev, vehicleTypeId: type.vehicle_type_id.toString() }))}
                        className={`flex flex-col items-center justify-center py-4 px-6 rounded-2xl border-2 transition-all duration-200 gap-2 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/20 text-blue-600 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 shadow-md'
                            : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/30 hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${
                          isSelected 
                            ? (isCar ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-amber-100 dark:bg-amber-900/40') 
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {isCar ? <Car size={20} /> : <Bike size={20} />}
                        </div>
                        <span className="text-xs font-bold">{type.vehicle_type_name}</span>
                      </button>
                    );
                  })}
                </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Base Price (Entry) *' : 'Giá sàn vào cổng *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={addForm.basePrice}
                      onChange={(e) => setAddForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                      placeholder="10000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Hourly Rate *' : 'Giá mỗi giờ tiếp theo *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={addForm.hourlyRate}
                      onChange={(e) => setAddForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                      placeholder="5000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Overnight Penalty *' : 'Phí gửi qua đêm *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={addForm.overnightFee}
                      onChange={(e) => setAddForm(prev => ({ ...prev, overnightFee: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                      placeholder="50000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Lost Card Penalty *' : 'Phí phạt mất thẻ *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={addForm.handlingFee}
                      onChange={(e) => setAddForm(prev => ({ ...prev, handlingFee: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                      placeholder="2000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
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

      {/* EDIT PRICING POLICY MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
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

            <form onSubmit={handleEditSubmit} className="space-y-5">
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
                  <label className="label">{language === 'en' ? 'Base Price (Entry) *' : 'Giá sàn vào cổng *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={editForm.basePrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Hourly Rate *' : 'Giá mỗi giờ tiếp theo *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={editForm.hourlyRate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Overnight Penalty *' : 'Phí gửi qua đêm *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={editForm.overnightFee}
                      onChange={(e) => setEditForm(prev => ({ ...prev, overnightFee: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Lost Card Penalty *' : 'Phí phạt mất thẻ *'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={editForm.handlingFee}
                      onChange={(e) => setEditForm(prev => ({ ...prev, handlingFee: e.target.value }))}
                      className="input-field pr-10 font-mono font-bold"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                      ₫
                    </div>
                  </div>
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
    </div>
  )
}
