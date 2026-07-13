import { useState, useEffect } from 'react'
import { Search, UserPlus, Edit, Lock, Unlock, Shield, X, Mail, Phone, RefreshCw, Eye, EyeOff, AlertTriangle, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

export default function ManagerStaff() {
  const { language } = useLanguage()
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [staffToToggle, setStaffToToggle] = useState(null)
  const [activeDropdownStaffId, setActiveDropdownStaffId] = useState(null)

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

  const [addErrors, setAddErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})

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
        toast.error(language === 'en' ? 'Failed to load staff list' : 'Không thể tải danh sách nhân viên')
      }
    } catch (error) {
      console.error('Fetch staff error:', error)
      toast.error(error.message || (language === 'en' ? 'Error connecting to server' : 'Lỗi kết nối đến máy chủ'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [statusFilter])

  // Reset showPassword when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setShowPassword(false)
    }
  }, [isAddModalOpen])

  // Close activeDropdownStaffId on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setActiveDropdownStaffId(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  // Auto-generate strong secure password conforming to backend regex
  const handleGeneratePassword = () => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
    const numberChars = '0123456789'
    const specialChars = '@$!%*?&'
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars

    let password = ''
    // Ensure at least one character from each required class
    password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]
    password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]
    password += numberChars[Math.floor(Math.random() * numberChars.length)]
    password += specialChars[Math.floor(Math.random() * specialChars.length)]

    // Fill to 12 characters length
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle characters
    password = password.split('').sort(() => 0.5 - Math.random()).join('')

    setAddForm(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }))

    setAddErrors(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }))

    setShowPassword(true)
    toast.success(language === 'en' ? 'Strong password generated!' : 'Đã tạo mật khẩu mạnh ngẫu nhiên!')
  }

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchStaff()
  }

  // Handle Add Staff
  const handleAddSubmit = async (e) => {
    e.preventDefault()

    // Validation patterns
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const errors = {}
    if (!nameRegex.test(addForm.fullName)) {
      errors.fullName = language === 'en' ? 'Full name must be 2-100 characters and contain only letters.' : 'Họ và tên phải từ 2–100 ký tự và chỉ chứa chữ cái.'
    }

    if (!emailRegex.test(addForm.email)) {
      errors.email = language === 'en' ? 'Invalid email address.' : 'Địa chỉ email không hợp lệ.'
    }

    if (!phoneRegex.test(addForm.phoneNumber)) {
      errors.phoneNumber = language === 'en' ? 'Invalid phone number (must start with 0 and contain 10 digits).' : 'Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và có 10 chữ số).'
    }

    if (!passwordRegex.test(addForm.password)) {
      errors.password = language === 'en' ? 'Password must be at least 8 characters, containing letters, numbers, and at least one special character.' : 'Mật khẩu phải từ 8 ký tự trở lên, bao gồm chữ cái, số và ít nhất một ký tự đặc biệt.'
    }

    if (addForm.password !== addForm.confirmPassword) {
      errors.confirmPassword = language === 'en' ? 'Passwords do not match.' : 'Mật khẩu không khớp.'
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors)
      return
    }
    setAddErrors({})

    setFormSubmitting(true)
    try {
      const emailPrefix = addForm.email.split('@')[0];
      const cleanedPrefix = emailPrefix.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 14);
      const generatedUsername = cleanedPrefix + '_' + Math.random().toString(36).substring(2, 6);

      const response = await api.post('/manager/staff', {
        username: generatedUsername,
        full_name: addForm.fullName,
        email: addForm.email,
        phone_number: addForm.phoneNumber,
        password: addForm.password,
        confirm_password: addForm.confirmPassword
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || (language === 'en' ? 'Staff member added successfully' : 'Thêm nhân viên thành công'))
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
      toast.error(error.message || (language === 'en' ? 'Failed to add staff member' : 'Không thể thêm nhân viên'))
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
    setEditErrors({})
    setIsEditModalOpen(true)
  }

  // Handle Edit Staff
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStaff) return

    // Validation patterns
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;

    const errors = {}
    if (!nameRegex.test(editForm.fullName)) {
      errors.fullName = language === 'en' ? 'Full name must be 2-100 characters and contain only letters.' : 'Họ và tên phải từ 2–100 ký tự và chỉ chứa chữ cái.'
    }

    if (!emailRegex.test(editForm.email)) {
      errors.email = language === 'en' ? 'Invalid email address.' : 'Địa chỉ email không hợp lệ.'
    }

    if (!phoneRegex.test(editForm.phone)) {
      errors.phone = language === 'en' ? 'Invalid phone number (must start with 0 and contain 10 digits).' : 'Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và có 10 chữ số).'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }
    setEditErrors({})

    setFormSubmitting(true)
    try {
      const response = await api.put(`/manager/staff/${selectedStaff.user_id}`, {
        full_name: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || (language === 'en' ? 'Staff profile updated successfully' : 'Cập nhật hồ sơ nhân viên thành công'))
        setIsEditModalOpen(false)
        fetchStaff()
      }
    } catch (error) {
      console.error('Edit staff error:', error)
      toast.error(error.message || (language === 'en' ? 'Failed to update staff member' : 'Không thể cập nhật thông tin nhân viên'))
    } finally {
      setFormSubmitting(false)
    }
  }


  // Handle Change Status
  const handleStatusChange = async (target, newStatus) => {
    if (!target) return;

    setFormSubmitting(true)
    try {
      const response = await api.put(`/manager/staff/${target.user_id}/status`, {
        status: newStatus
      })

      if (response.data && response.data.success) {
        toast.success(
          language === 'en'
            ? `Staff status updated to ${newStatus} successfully`
            : `Cập nhật trạng thái nhân viên thành ${newStatus} thành công`
        )
        // Update local state directly to be fast and smooth
        setStaffList(prev =>
          prev.map(item => item.user_id === target.user_id ? { ...item, status: newStatus } : item)
        )
        setIsConfirmModalOpen(false)
        setStaffToToggle(null)
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error(error.message || (language === 'en' ? 'Failed to update staff status' : 'Không thể cập nhật trạng thái nhân viên'))
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <>
      <div className="animate-slide-in flex flex-col space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="section-title mb-1">
              {language === 'en' ? 'Staff Management' : 'Quản lý Nhân viên'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Create, update, and manage access status for parking operations staff.'
                : 'Tạo mới, cập nhật và quản lý trạng thái truy cập của nhân viên vận hành bãi xe.'}
            </p>
          </div>
          <button
            onClick={() => {
              setAddErrors({})
              setIsAddModalOpen(true)
            }}
            className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            <UserPlus size={18} />
            {language === 'en' ? 'Add Parking Staff' : 'Thêm nhân viên'}
          </button>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="card mb-6 p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by Name, Username, Email, Phone...' : 'Tìm kiếm theo Tên, Tên tài khoản, Email, Số điện thoại...'}
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
                <option value="">{language === 'en' ? 'All Statuses' : 'Tất cả trạng thái'}</option>
                <option value="ACTIVE">{language === 'en' ? 'Active' : 'Hoạt động'}</option>
                <option value="INACTIVE">{language === 'en' ? 'Inactive' : 'Không hoạt động'}</option>
                <option value="BANNED">{language === 'en' ? 'Banned' : 'Bị khóa'}</option>
              </select>
              <button
                type="button"
                onClick={fetchStaff}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                title={language === 'en' ? 'Refresh List' : 'Làm mới danh sách'}
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
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'en' ? 'Loading staff records...' : 'Đang tải danh sách nhân viên...'}
              </p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
              <Shield size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
                {language === 'en' ? 'No staff records found' : 'Không tìm thấy thông tin nhân viên'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
                {language === 'en'
                  ? 'Try adjusting your search criteria or add a new parking staff member.'
                  : 'Thử điều chỉnh điều kiện tìm kiếm hoặc thêm một nhân viên vận hành bãi xe mới.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">{language === 'en' ? 'Staff Details' : 'Chi tiết nhân viên'}</th>
                    <th className="table-header">{language === 'en' ? 'Contact Information' : 'Thông tin liên hệ'}</th>
                    <th className="table-header">{language === 'en' ? 'Status' : 'Trạng thái'}</th>
                    <th className="table-header">{language === 'en' ? 'Created At' : 'Ngày tạo'}</th>
                    <th className="table-header text-right">{language === 'en' ? 'Actions' : 'Thao tác'}</th>
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
                              <img
                                src={
                                  staff.avatar_url.startsWith("http://") || staff.avatar_url.startsWith("https://")
                                    ? staff.avatar_url
                                    : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace("/api/v1", "")}${staff.avatar_url}`
                                }
                                alt={staff.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (staff.full_name || staff.username || 'S').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{staff.full_name || 'N/A'}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">@{staff.username}</p>
                          </div>
                        </div>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${staff.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : staff.status === 'INACTIVE'
                            ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                          }`}>
                          {staff.status === 'ACTIVE'
                            ? (language === 'en' ? 'Active' : 'Hoạt động')
                            : staff.status === 'INACTIVE'
                              ? (language === 'en' ? 'Inactive' : 'Không hoạt động')
                              : (language === 'en' ? 'Banned' : 'Bị khóa')}
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
                            title={language === 'en' ? 'Edit Details' : 'Chỉnh sửa chi tiết'}
                          >
                            <Edit size={16} />
                          </button>

                          {/* Dropdown Container */}
                          <div className="relative action-dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownStaffId(activeDropdownStaffId === staff.user_id ? null : staff.user_id);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title={language === 'en' ? 'Change Status' : 'Thay đổi trạng thái'}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeDropdownStaffId === staff.user_id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 animate-slide-up-dense">
                                {/* Option Active */}
                                {staff.status !== 'ACTIVE' && (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(staff, 'ACTIVE');
                                      setActiveDropdownStaffId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 transition-colors"
                                  >
                                    <Unlock size={14} />
                                    {language === 'en' ? 'Activate' : 'Hoạt động'}
                                  </button>
                                )}

                                {/* Option Inactive */}
                                {staff.status !== 'INACTIVE' && (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(staff, 'INACTIVE');
                                      setActiveDropdownStaffId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2 transition-colors"
                                  >
                                    <Lock size={14} />
                                    {language === 'en' ? 'Deactivate' : 'Tạm ngưng'}
                                  </button>
                                )}

                                {/* Option Banned */}
                                {staff.status !== 'BANNED' && (
                                  <button
                                    onClick={() => {
                                      setStaffToToggle(staff);
                                      setIsConfirmModalOpen(true);
                                      setActiveDropdownStaffId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                                  >
                                    <Shield size={14} />
                                    {language === 'en' ? 'Ban Account' : 'Khóa tài khoản'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          ADD STAFF MODAL
         ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'en' ? 'Add Parking Staff' : 'Thêm Nhân viên Bãi xe'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? 'Create a new operator account for check-in/out duties.' : 'Tạo tài khoản nhân viên mới cho công việc check-in/out.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="label">{language === 'en' ? 'Full Name *' : 'Họ và tên *'}</label>
                <input
                  type="text"
                  required
                  value={addForm.fullName}
                  onChange={(e) => {
                    setAddForm(prev => ({ ...prev, fullName: e.target.value }));
                    setAddErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  className={`input-field ${addErrors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={language === 'en' ? 'e.g. John Doe' : 'vd: Nguyễn Văn A'}
                />
                {addErrors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{addErrors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Email Address *' : 'Địa chỉ email *'}</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => {
                      setAddForm(prev => ({ ...prev, email: e.target.value.trim() }));
                      setAddErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`input-field ${addErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder={language === 'en' ? 'e.g. john@domain.com' : 'vd: name@email.com'}
                  />
                  {addErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{addErrors.email}</p>}
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Phone Number *' : 'Số điện thoại *'}</label>
                  <input
                    type="tel"
                    required
                    value={addForm.phoneNumber}
                    onChange={(e) => {
                      setAddForm(prev => ({ ...prev, phoneNumber: e.target.value.trim() }));
                      setAddErrors(prev => ({ ...prev, phoneNumber: '' }));
                    }}
                    className={`input-field ${addErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder={language === 'en' ? 'e.g. 0912345678' : 'vd: 0912345678'}
                  />
                  {addErrors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-medium">{addErrors.phoneNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label mb-0">{language === 'en' ? 'Password *' : 'Mật khẩu *'}</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw size={11} />
                      {language === 'en' ? 'Generate' : 'Tạo ngẫu nhiên'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={addForm.password}
                      onChange={(e) => {
                        setAddForm(prev => ({ ...prev, password: e.target.value }));
                        setAddErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={`input-field pr-10 ${addErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={showPassword ? (language === 'en' ? 'Hide Password' : 'Ẩn mật khẩu') : (language === 'en' ? 'Show Password' : 'Hiện mật khẩu')}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {addErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{addErrors.password}</p>}
                </div>
                <div>
                  <label className="label mb-1">{language === 'en' ? 'Confirm Password *' : 'Xác nhận mật khẩu *'}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={addForm.confirmPassword}
                      onChange={(e) => {
                        setAddForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                        setAddErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      className={`input-field pr-10 ${addErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={showPassword ? (language === 'en' ? 'Hide Password' : 'Ẩn mật khẩu') : (language === 'en' ? 'Show Password' : 'Hiện mật khẩu')}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {addErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{addErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                  disabled={formSubmitting}
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={formSubmitting}
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {language === 'en' ? 'Register Staff' : 'Đăng ký nhân viên'}
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
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slide-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                  {language === 'en' ? 'Edit Staff Details' : 'Chỉnh sửa thông tin nhân viên'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? `Update contact and profile details for @${selectedStaff?.username}.`
                    : `Cập nhật thông tin liên hệ và hồ sơ cho @${selectedStaff?.username}.`}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">{language === 'en' ? 'Full Name *' : 'Họ và tên *'}</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => {
                    setEditForm(prev => ({ ...prev, fullName: e.target.value }));
                    setEditErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  className={`input-field ${editErrors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={language === 'en' ? 'e.g. John Doe' : 'vd: Nguyễn Văn A'}
                />
                {editErrors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{editErrors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'en' ? 'Email Address *' : 'Địa chỉ email *'}</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, email: e.target.value.trim() }));
                      setEditErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`input-field ${editErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder={language === 'en' ? 'e.g. john@domain.com' : 'vd: name@email.com'}
                  />
                  {editErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{editErrors.email}</p>}
                </div>
                <div>
                  <label className="label">{language === 'en' ? 'Phone Number *' : 'Số điện thoại *'}</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, phone: e.target.value.trim() }));
                      setEditErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    className={`input-field ${editErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder={language === 'en' ? 'e.g. 0912345678' : 'vd: 0912345678'}
                  />
                  {editErrors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{editErrors.phone}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary"
                  disabled={formSubmitting}
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
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
          CONFIRM STATUS CHANGE MODAL (Dropdown selector for ACTIVE, INACTIVE, BANNED)
         ============================================================ */}
      {isConfirmModalOpen && staffToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl relative animate-slide-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <button
              onClick={() => {
                setIsConfirmModalOpen(false);
                setStaffToToggle(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-xl shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                  {language === 'en' ? 'Ban Account Confirmation' : 'Xác nhận khóa tài khoản'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {language === 'en'
                    ? `Are you sure you want to ban @${staffToToggle.username} (${staffToToggle.full_name})?`
                    : `Bạn có chắc chắn muốn khóa tài khoản nhân viên @${staffToToggle.username} (${staffToToggle.full_name}) không?`}
                </p>
              </div>
            </div>

            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
              <div>
                <p className="font-bold mb-1">
                  {language === 'en' ? 'Warning: Access Revoked' : 'Cảnh báo: Thu hồi quyền truy cập'}
                </p>
                <p className="leading-relaxed">
                  {language === 'en'
                    ? 'Banning this staff member will immediately revoke their access. They will not be able to log in or perform duties.'
                    : 'Khóa tài khoản này sẽ lập tức thu hồi quyền truy cập. Nhân viên sẽ không thể đăng nhập hoặc thực hiện nhiệm vụ.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setStaffToToggle(null);
                }}
                className="btn-secondary text-xs"
                disabled={formSubmitting}
              >
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleStatusChange(staffToToggle, 'BANNED');
                  setIsConfirmModalOpen(false);
                  setStaffToToggle(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
                disabled={formSubmitting}
              >
                {formSubmitting && <RefreshCw size={12} className="animate-spin" />}
                {language === 'en' ? 'Confirm Ban' : 'Xác nhận Khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
