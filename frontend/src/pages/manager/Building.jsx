import { useState, useEffect } from 'react'
import { Building2, Save, RefreshCw, Clock, MapPin, Layers, LayoutGrid, CheckCircle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

const getRangeOptions = (currentVal) => {
  const defaults = [
    '06:00 - 22:00',
    '07:00 - 22:00',
    '08:00 - 20:00',
    '08:00 - 22:00',
    '00:00 - 24:00',
    '05:00 - 23:00',
    '06:00 - 20:00',
    '06:00 - 21:00',
    '06:00 - 23:00',
    '07:00 - 20:00',
    '07:00 - 21:00',
    '07:00 - 23:00',
    '08:00 - 17:00',
    '08:00 - 18:00',
    '08:00 - 21:00'
  ];
  if (currentVal && !defaults.includes(currentVal)) {
    return [currentVal, ...defaults];
  }
  return defaults;
};

export default function ManagerBuilding() {
  const { language } = useLanguage()
  const [buildingData, setBuildingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Edit fields
  const [formData, setFormData] = useState({
    buildingName: '',
    address: '',
    weekdayHours: '06:00 - 22:00',
    weekendHours: '08:00 - 20:00',
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
      toast.error(language === 'en' ? 'Failed to load building details' : 'Không thể tải thông tin tòa nhà')
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
        weekday_hours: formData.is247 ? null : formData.weekdayHours,
        weekend_hours: formData.is247 ? null : formData.weekendHours,
        is_24_7: formData.is247
      })

      if (response.data && response.data.success) {
        toast.success(response.data.message || (language === 'en' ? 'Building settings updated' : 'Đã cập nhật cài đặt tòa nhà'))
        fetchBuildingInfo()
      }
    } catch (error) {
      console.error('Error updating building info:', error)
      toast.error(error.message || (language === 'en' ? 'Failed to update building info' : 'Lỗi khi cập nhật cài đặt tòa nhà'))
    } finally {
      setFormSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {language === 'en' ? 'Loading building parameters...' : 'Đang tải thông số tòa nhà...'}
        </p>
      </div>
    )
  }

  return (
    <div className="animate-slide-in flex flex-col lg:flex-row gap-6 h-full">
      {/* LEFT PANEL: OVERVIEW & REAL-TIME STATS */}
      <div className="flex-1 space-y-6">
        <div className="card">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                {buildingData?.building_name} {language === 'en' ? 'Overview' : 'Tổng quan'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <Layers className="text-blue-500 shrink-0" size={20} />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Floors' : 'Số tầng'}
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-white font-sans">
                  {buildingData?.total_floors} {language === 'en' ? 'Levels' : 'Tầng'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <LayoutGrid className="text-blue-500 shrink-0" size={20} />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Total Slots' : 'Tổng số chỗ'}
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-white font-sans">
                  {buildingData?.total_slots} {language === 'en' ? 'Slots' : 'Chỗ'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                {language === 'en' ? 'Building Address' : 'Địa chỉ tòa nhà'}
              </span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                {buildingData?.address || (language === 'en' ? 'No Address configured' : 'Chưa cấu hình địa chỉ')}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">
                {language === 'en' ? 'Operation Mode' : 'Chế độ hoạt động'}
              </span>
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1">
                  {buildingData?.operation_hours?.is_24_7 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-250 w-fit">
                      {language === 'en' ? 'Open 24/7 (Always Open)' : 'Mở cửa 24/7 (Luôn mở)'}
                    </span>
                  ) : (
                    <>
                      <span>
                        {language === 'en'
                          ? `Weekdays: ${buildingData?.operation_hours?.weekday_hours}`
                          : `Ngày thường: ${buildingData?.operation_hours?.weekday_hours}`}
                      </span>
                      <span>
                        {language === 'en'
                          ? `Weekends: ${buildingData?.operation_hours?.weekend_hours}`
                          : `Cuối tuần: ${buildingData?.operation_hours?.weekend_hours}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OCCUPANCY CHARTS/DETAILS */}
        {buildingData?.current_occupancy && (
          <div className="card">
            <h3 className="subsection-title">
              {language === 'en' ? 'Occupancy Rate' : 'Tỉ lệ lấp đầy'}
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-500">
                  {language === 'en' ? 'Filled Slots' : 'Số chỗ đã đỗ'}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-sans">
                  {buildingData.current_occupancy.total_occupied} / {buildingData.total_slots} {language === 'en' ? 'slots' : 'chỗ'}
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
            {language === 'en' ? 'Adjust Building Info' : 'Cấu hình Tòa nhà'}
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            {language === 'en'
              ? 'Modify general operating hours, location details, and names. Changes apply instantly.'
              : 'Chỉnh sửa giờ hoạt động, địa chỉ và tên tòa nhà. Thay đổi sẽ có hiệu lực ngay lập tức.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                {language === 'en' ? 'Building Name *' : 'Tên tòa nhà *'}
              </label>
              <input
                type="text"
                required
                value={formData.buildingName}
                onChange={(e) => setFormData(prev => ({ ...prev, buildingName: e.target.value }))}
                className="input-field"
                placeholder={language === 'en' ? 'e.g. eParking Central' : 'Ví dụ: Bãi xe trung tâm'}
              />
            </div>

            <div>
              <label className="label">
                {language === 'en' ? 'Address *' : 'Địa chỉ tòa nhà *'}
              </label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="input-field py-2 resize-none"
                placeholder={language === 'en' ? 'e.g. 123 Parking Way, Tower A' : 'Ví dụ: 123 Đường Bãi Đỗ, Tòa nhà A'}
              />
            </div>

            {/* 24/7 Operating Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl mb-4 select-none">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  {language === 'en' ? '24/7 Operating Mode' : 'Chế độ hoạt động 24/7'}
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium block">
                  {language === 'en' ? 'Open all day' : 'Mở cửa cả ngày'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is247}
                  onChange={(e) => setFormData(prev => ({ ...prev, is247: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {!formData.is247 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
                <div>
                  <label className="label">
                    {language === 'en' ? 'Mon - Fri Hours *' : 'Giờ T2 - T6 *'}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.weekdayHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, weekdayHours: e.target.value }))}
                      className="input-field pr-10 cursor-pointer appearance-none font-sans text-sm"
                    >
                      {getRangeOptions(formData.weekdayHours).map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">
                    {language === 'en' ? 'Weekend Hours *' : 'Giờ Cuối tuần *'}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.weekendHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, weekendHours: e.target.value }))}
                      className="input-field pr-10 cursor-pointer appearance-none font-sans text-sm"
                    >
                      {getRangeOptions(formData.weekendHours).map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              {language === 'en' ? 'Save Settings' : 'Lưu Cài đặt'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

