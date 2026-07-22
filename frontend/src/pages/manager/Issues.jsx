import { useState, useEffect } from 'react'
import {
  AlertCircle, AlertTriangle, CheckCircle, Search, RefreshCw,
  Phone, Mail, Star, Paperclip, MessageSquare, Ticket, Clock,
  ShieldAlert, Loader2, Eye, X
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getBackendRootUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return baseUrl.replace('/api/v1', '')
}

const getImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  const rootUrl = getBackendRootUrl()
  return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const formatVnd = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

// ─── Feedbacks Section ────────────────────────────────────────────────────────
function FeedbacksSection({ language }) {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total_items: 0, total_pages: 0 })

  const fetchFeedbacks = async (p = page) => {
    setLoading(true)
    try {
      const response = await api.get('/feedbacks', {
        params: { status: statusFilter || undefined, page: p, pageSize: 10 }
      })
      if (response.data?.success) {
        setFeedbacks(response.data.data.items)
        setPagination(response.data.data.pagination)
      }
    } catch {
      toast.error(language === 'en' ? 'Failed to load feedbacks' : 'Không thể tải phản hồi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedbacks(1) }, [statusFilter])

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return fb.title?.toLowerCase().includes(q) || fb.content?.toLowerCase().includes(q) || fb.full_name?.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60 w-full shrink-0">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by keyword, name...' : 'Tìm theo từ khóa, tên...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
          />
        </div>
        <div className="flex w-full sm:w-auto gap-2 items-center justify-end shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs font-semibold text-slate-905 dark:text-white rounded-lg outline-none cursor-pointer"
          >
            <option value="">{language === 'en' ? 'All Statuses' : 'Tất cả trạng thái'}</option>
            <option value="OPEN">{language === 'en' ? 'Open' : 'Chờ xử lý'}</option>
            <option value="RESOLVED">{language === 'en' ? 'Resolved' : 'Đã giải quyết'}</option>
          </select>
          <button
            type="button"
            onClick={() => fetchFeedbacks(1)}
            className="p-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <div className="card flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'en' ? 'Loading feedbacks...' : 'Đang tải phản hồi...'}
            </p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
              {language === 'en' ? 'No feedbacks found' : 'Không có phản hồi nào'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => (
            <div
              key={fb.feedback_id}
              className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs border-l-4 transition-all duration-200 hover:shadow-sm ${fb.status === 'RESOLVED' || fb.status === 'CLOSED'
                ? 'border-l-emerald-500 dark:border-l-emerald-600'
                : 'border-l-amber-500 dark:border-l-amber-600'}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className={`badge ${fb.status === 'RESOLVED' || fb.status === 'CLOSED' ? 'badge-success' : 'badge-warning'}`}>
                    {fb.status === 'RESOLVED' ? (language === 'en' ? 'RESOLVED' : 'ĐÃ GIẢI QUYẾT')
                      : fb.status === 'CLOSED' ? (language === 'en' ? 'CLOSED' : 'ĐÃ ĐÓNG')
                        : fb.status === 'OPEN' ? (language === 'en' ? 'OPEN' : 'CHỜ XỬ LÝ')
                          : fb.status === 'IN_PROGRESS' ? (language === 'en' ? 'IN PROGRESS' : 'ĐANG XỬ LÝ')
                            : fb.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-sans">FB #{fb.feedback_id}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 font-sans">
                  {fb.created_at ? new Date(fb.created_at).toLocaleString() : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                  {fb.star_rating > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                        {language === 'en' ? 'Rating' : 'Đánh giá'}
                      </span>
                      <div className="flex gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < fb.star_rating ? 'fill-amber-400 text-amber-400 shrink-0' : 'text-slate-300 dark:text-slate-700 shrink-0'} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                      {language === 'en' ? 'Title' : 'Tiêu đề'}
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-snug">{fb.title}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                      {language === 'en' ? 'Content' : 'Nội dung'}
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {fb.content || (language === 'en' ? 'No content.' : 'Không có nội dung.')}
                    </p>
                  </div>
                  {fb.attachment_url && (
                    <div className="pt-1">
                      <a
                        href={`${getBackendRootUrl()}${fb.attachment_url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                      >
                        <Paperclip size={14} className="text-blue-500" />
                        {language === 'en' ? 'View Attachment' : 'Xem tệp đính kèm'}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5 bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900/30 dark:to-slate-955/20 p-4 rounded-2xl border border-blue-100/50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 dark:bg-blue-450/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-blue-50/60 dark:border-slate-700 shadow-xs">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 text-blue-600 dark:bg-blue-955/50 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border-2 border-blue-200 dark:border-blue-900/40 shadow-inner">
                      <span className="text-base font-black uppercase">{fb.full_name ? fb.full_name.charAt(0) : 'U'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-1">
                        {language === 'en' ? 'Reporter' : 'Người gửi'}
                      </span>
                      <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                        {fb.full_name || (language === 'en' ? 'Anonymous' : 'Ẩn danh')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {fb.customer_phone ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50/40 dark:bg-emerald-955/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400">
                        <Phone size={13} className="text-emerald-500" />
                        <span className="font-sans text-xs">{fb.customer_phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-400">
                        <Phone size={13} />
                        <span className="italic text-[11px]">{language === 'en' ? 'No phone' : 'Không có SĐT'}</span>
                      </div>
                    )}
                    {fb.customer_email ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50/40 dark:bg-emerald-955/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400 min-w-0">
                        <Mail size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate text-xs">{fb.customer_email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-400">
                        <Mail size={13} />
                        <span className="italic text-[11px]">{language === 'en' ? 'No email' : 'Không có email'}</span>
                      </div>
                    )}
                    {(fb.status === 'RESOLVED' || fb.status === 'CLOSED') && (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/30 py-2 rounded-xl border border-emerald-250/70 dark:border-emerald-900/30 text-[10px] uppercase tracking-wider font-black shadow-xs">
                        <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'en' ? 'Processed' : 'Đã xử lý'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {fb.status !== 'OPEN' && (
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                      <span>{language === 'en' ? 'Staff Response' : 'Phản hồi nhân viên'}</span>
                      {(fb.resolved_by_name || fb.resolved_by) && (
                        <span className="font-sans text-slate-400 dark:text-slate-500 normal-case font-bold">
                          {language === 'en' ? 'By: ' : 'Người duyệt: '}{fb.resolved_by_name || fb.resolved_by}
                          {fb.resolved_at ? ` ${language === 'en' ? 'at' : 'lúc'} ${new Date(fb.resolved_at).toLocaleString()}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                      {fb.response_note || (language === 'en' ? 'No response note.' : 'Không có ghi chú phản hồi.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => { setPage(p => p - 1); fetchFeedbacks(page - 1) }}
            className="px-3 py-1.5 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            {language === 'en' ? 'Prev' : 'Trước'}
          </button>
          <span className="text-xs font-bold text-slate-400">{page} / {pagination.total_pages}</span>
          <button
            disabled={page >= pagination.total_pages}
            onClick={() => { setPage(p => p + 1); fetchFeedbacks(page + 1) }}
            className="px-3 py-1.5 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            {language === 'en' ? 'Next' : 'Sau'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Violations Section ───────────────────────────────────────────────────────
function ViolationsSection({ language }) {
  const [activeTab, setActiveTab] = useState('LOST_TICKET')
  const [incidents, setIncidents] = useState([])
  const [overtimeSessions, setOvertimeSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const pageSize = 10

  const calculateDuration = (checkInStr) => {
    if (!checkInStr) return ''
    const diffMs = new Date() - new Date(checkInStr)
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return language === 'en' ? `${days} days ${remainingHours}h ${mins}m` : `${days} ngày ${remainingHours} giờ ${mins} phút`
    }
    return language === 'en' ? `${hours}h ${mins}m` : `${hours} giờ ${mins} phút`
  }

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      if (activeTab === 'OVERTIME') {
        const response = await api.get('/parking/history', {
          params: { status: 'ACTIVE', over3Days: true, licensePlate: searchQuery || undefined, page, pageSize }
        })
        if (response.data?.success) {
          setOvertimeSessions(response.data.data || [])
          setTotalCount(response.data.total_records || 0)
        } else {
          setOvertimeSessions([])
          setTotalCount(0)
        }
      } else {
        const response = await api.get('/manager/incidents')
        if (response.data?.success) {
          const filtered = response.data.data.filter(item => item.issue_type === activeTab)
          setIncidents(filtered)
          setTotalCount(filtered.length)
        }
      }
    } catch {
      toast.error(language === 'en' ? 'Failed to load incidents' : 'Không thể tải danh sách sự cố')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1); fetchIncidents() }, [activeTab])
  useEffect(() => { fetchIncidents() }, [page])

  const displayList = activeTab === 'OVERTIME'
    ? overtimeSessions
    : incidents.filter(item => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return item.session_id?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.reporter_name?.toLowerCase().includes(q)
    })

  const tabs = [
    { id: 'LOST_TICKET', labelVi: 'Mất vé / thẻ', labelEn: 'Lost Tickets' },
    { id: 'WRONG_SLOT', labelVi: 'Sai lệch biển số', labelEn: 'Plate Mismatches' },
    { id: 'OVERTIME', labelVi: 'Đỗ xe quá 24 giờ', labelEn: 'Overtime Parking' },
  ]

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sub-tabs & Search Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 w-full shrink-0">
        <div className="flex overflow-x-auto gap-2 md:gap-6 no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-bold text-xs transition-all focus:outline-none whitespace-nowrap flex items-center gap-2 ${isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                {language === 'en' ? tab.labelEn : tab.labelVi}
              </button>
            )
          })}
        </div>

        {/* Compact Search box */}
        <div className="relative w-full sm:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={activeTab === 'OVERTIME'
              ? (language === 'en' ? 'Search plate...' : 'Tìm biển số...')
              : (language === 'en' ? 'Search keyword...' : 'Tìm từ khóa...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-20 gap-3 rounded-2xl">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-xs text-slate-400">{language === 'en' ? 'Loading...' : 'Đang tải...'}</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-16 rounded-2xl text-center space-y-3">
            <AlertCircle size={36} className="text-slate-400 mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
              {language === 'en' ? 'No violations found' : 'Không tìm thấy vi phạm nào'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeTab === 'OVERTIME' ? (
              // Table layout matching staff HistoryPage over3days tab
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                      <th className="py-3 pl-4 font-semibold">{language === 'en' ? 'License Plate' : 'Biển số'}</th>
                      <th className="py-3 font-semibold">{language === 'en' ? 'Zone' : 'Khu vực'}</th>
                      <th className="py-3 font-semibold">{language === 'en' ? 'Check-in Time' : 'Thời gian vào'}</th>
                      <th className="py-3 font-semibold ">{language === 'en' ? 'Duration' : 'Thời gian'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                    {displayList.map((session, idx) => (
                      <tr key={session.sessionId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-4 font-sans font-extrabold text-slate-900 dark:text-white tracking-wider">
                          {session.licensePlateIn || session.licensePlate || session.license_plate || '—'}
                        </td>
                        <td className="py-3.5 font-bold text-amber-700 dark:text-amber-500">
                          {session.zoneName || session.zone_name || '—'}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400">
                          {session.checkInTime || session.check_in_time
                            ? new Date(session.checkInTime || session.check_in_time).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
                            : '—'}
                        </td>
                        <td className="py-3.5 font-black text-rose-600 dark:text-rose-400 font-sans">
                          {calculateDuration(session.checkInTime || session.check_in_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                      <th className="py-2.5 pl-4 font-semibold w-16">ID</th>
                      <th className="py-2.5 font-semibold">{language === 'en' ? 'Session ID' : 'Mã phiên'}</th>
                      <th className="py-2.5 font-semibold">{language === 'en' ? 'Reported By' : 'Nhân viên'}</th>
                      <th className="py-2.5 font-semibold">{language === 'en' ? 'Report Time' : 'Thời gian báo'}</th>
                      <th className="py-2.5 font-semibold">{language === 'en' ? 'Description' : 'Mô tả'}</th>
                      <th className="py-2.5 font-semibold text-center w-24">Status</th>
                      <th className="py-2.5 pr-4 text-right w-24">{language === 'en' ? 'Action' : 'Hành động'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                    {displayList.map(log => (
                      <tr 
                        key={log.log_id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="py-2.5 pl-4 text-slate-400 font-sans">#{log.log_id}</td>
                        <td className="py-2.5 font-sans font-bold text-slate-800 dark:text-slate-205 max-w-[120px] truncate" title={log.session_id}>
                          {log.session_id}
                        </td>
                        <td className="py-2.5 text-slate-800 dark:text-slate-300">{log.reporter_name}</td>
                        <td className="py-2.5 text-slate-500 font-normal">{new Date(log.report_time).toLocaleString()}</td>
                        <td className="py-2.5 text-slate-500 font-normal max-w-xs truncate" title={log.description}>{log.description}</td>
                        <td className="py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-455 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-100 dark:border-emerald-900/40">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-955/40 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-100 dark:border-blue-900/30 transition-all cursor-pointer"
                          >
                            <Eye size={11} />
                            <span>{language === 'en' ? 'Details' : 'Chi tiết'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination (overtime only) */}
      {activeTab === 'OVERTIME' && totalCount > pageSize && (
        <div className="flex items-center justify-center gap-3 pt-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
            {language === 'en' ? 'Previous' : 'Trước'}
          </button>
          <span className="text-xs font-bold text-slate-400">{page} / {Math.ceil(totalCount / pageSize)}</span>
          <button disabled={page >= Math.ceil(totalCount / pageSize)} onClick={() => setPage(p => p + 1)} className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
            {language === 'en' ? 'Next' : 'Sau'}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in my-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  {language === 'en' ? 'Incident Log Details' : 'Chi tiết Nhật ký Sự cố'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Log #{selectedLog.log_id} &bull; {language === 'en' ? 'Session ID' : 'Phiên đỗ'}: {selectedLog.session_id}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Details Info */}
                <div className="space-y-3">
                  <div className="bg-slate-50/60 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold space-y-2.5">
                    {/* Issue Type */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">{language === 'en' ? 'Issue Type' : 'Loại sự cố'}</span>
                      <span className="text-slate-900 dark:text-white font-black text-xs">
                        {selectedLog.issue_type === 'LOST_TICKET'
                          ? (language === 'en' ? 'Lost Ticket' : 'Mất thẻ / vé')
                          : (language === 'en' ? 'Plate Mismatch' : 'Sai lệch biển số')}
                      </span>
                    </div>

                    {/* Report Time */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">{language === 'en' ? 'Report Time' : 'Thời gian báo'}</span>
                      <span className="text-slate-900 dark:text-white font-bold text-xs">
                        {new Date(selectedLog.report_time).toLocaleString()}
                      </span>
                    </div>

                    {/* Reported By */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">{language === 'en' ? 'Reported By' : 'Nhân viên báo cáo'}</span>
                      <span className="text-slate-900 dark:text-white font-bold text-xs">{selectedLog.reporter_name}</span>
                    </div>

                    {/* Session ID */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">{language === 'en' ? 'Session ID' : 'Phiên đỗ'}</span>
                      <span className="text-slate-500 font-mono text-[11px] truncate max-w-[120px]" title={selectedLog.session_id}>{selectedLog.session_id}</span>
                    </div>

                    {/* Status */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Status</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 font-black uppercase tracking-wider rounded border border-emerald-100 dark:border-emerald-900/40">
                        {selectedLog.status}
                      </span>
                    </div>

                    {/* Plates comparison */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">
                        {selectedLog.issue_type === 'WRONG_SLOT'
                          ? (language === 'en' ? 'Correct Plate' : 'Biển số đúng')
                          : (language === 'en' ? 'Plate In' : 'Biển lúc vào')}
                      </span>
                      <span className="font-sans font-extrabold text-slate-800 dark:text-white text-xs">{selectedLog.license_plate_in || '—'}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">
                        {selectedLog.issue_type === 'WRONG_SLOT'
                          ? (language === 'en' ? 'Incorrect Plate' : 'Biển số sai')
                          : (language === 'en' ? 'Plate Out' : 'Biển lúc ra')}
                      </span>
                      <span className="font-sans font-extrabold text-slate-800 dark:text-white text-xs">{selectedLog.license_plate_out || '—'}</span>
                    </div>
                  </div>

                  {/* Action/Description Box */}
                  <div className="bg-slate-50/60 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                    <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">
                      {language === 'en' ? 'Action / Description' : 'Hành động / Mô tả'}
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedLog.description}
                    </p>
                  </div>
                </div>

                {/* Right Column: Evidence Images */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{language === 'en' ? 'Check-in Image' : 'Ảnh check-in'}</span>
                    <div
                      className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-lg transition-colors duration-200 h-auto"
                      onClick={() => selectedLog.image_url_in && setLightboxImage(getImageUrl(selectedLog.image_url_in))}
                      title={language === 'en' ? 'Click to zoom check-in image' : 'Click để phóng to ảnh vào'}
                    >
                      <img
                        src={selectedLog.image_url_in ? getImageUrl(selectedLog.image_url_in) : 'https://placehold.co/600x400/0f172a/64748b?text=No+Checkin+Image'}
                        alt="Check-in"
                        className="w-full h-auto max-h-[120px] object-contain transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                      />
                      <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-slate-900/90 rounded p-1 text-slate-750 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{language === 'en' ? 'Check-out or Proof Image' : 'Ảnh check-out / minh chứng'}</span>
                    <div
                      className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-lg transition-colors duration-200 h-auto"
                      onClick={() => selectedLog.image_url_out && setLightboxImage(getImageUrl(selectedLog.image_url_out))}
                      title={language === 'en' ? 'Click to zoom check-out image' : 'Click để phóng to ảnh ra'}
                    >
                      <img
                        src={selectedLog.image_url_out ? getImageUrl(selectedLog.image_url_out) : 'https://placehold.co/600x400/0f172a/64748b?text=No+Checkout+Image'}
                        alt="Check-out"
                        className="w-full h-auto max-h-[120px] object-contain transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                      />
                      <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-slate-900/90 rounded p-1 text-slate-750 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-955/20 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
              >
                {language === 'en' ? 'Close' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white bg-white/10 dark:bg-slate-900/60 p-2 rounded-full border border-slate-300 dark:border-slate-800 transition-colors">
            <X size={20} />
          </div>
          <div
            className="relative w-full max-w-[95vw] md:max-w-6xl max-h-[92vh] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImage} alt="Full evidence" className="w-full h-auto max-h-[85vh] md:max-h-[88vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManagerIssues() {
  const { language } = useLanguage()
  const [section, setSection] = useState('feedbacks') // feedbacks | incidents

  const sections = [
    { id: 'feedbacks', labelEn: 'Feedbacks', labelVi: 'Phản hồi khách hàng' },
    { id: 'incidents', labelEn: 'Incidents', labelVi: 'Vi phạm & Sự cố' },
  ]

  return (
    <div className="animate-slide-in flex flex-col h-full space-y-5">
      {/* Section switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 md:gap-6 no-scrollbar pb-px w-full shrink-0">
        {sections.map(s => {
          const isActive = section === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`py-2 px-1 border-b-2 font-bold text-xs transition-all focus:outline-none whitespace-nowrap flex items-center gap-2 ${isActive
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {language === 'en' ? s.labelEn : s.labelVi}
            </button>
          )
        })}
      </div>

      {/* Active section content */}
      <div className="flex-1 min-h-0">
        {section === 'feedbacks'
          ? <FeedbacksSection language={language} />
          : <ViolationsSection language={language} />}
      </div>
    </div>
  )
}
