import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Search, RefreshCw, Phone, Mail, Star, Paperclip, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

export default function ManagerIssues() {
  const { language } = useLanguage()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total_items: 0, total_pages: 0 })

  const getBackendRootUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return baseUrl.replace("/api/v1", "");
  };

  const fetchFeedbacks = async (p = page) => {
    setLoading(true)
    try {
      const response = await api.get('/feedbacks', {
        params: {
          status: statusFilter || undefined,
          page: p,
          pageSize: 10
        }
      })
      if (response.data && response.data.success) {
        setFeedbacks(response.data.data.items)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      toast.error(language === 'en' ? 'Failed to load feedbacks' : 'Không thể tải phản hồi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks(1)
  }, [statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchFeedbacks(1)
  }

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      fb.title?.toLowerCase().includes(q) ||
      fb.content?.toLowerCase().includes(q) ||
      fb.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="animate-slide-in flex flex-col h-full">
      <div className="card mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search by keyword, name...' : 'Tìm theo từ khóa, tên...'}
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
              <option value="OPEN">{language === 'en' ? 'Open' : 'Chờ xử lý'}</option>
              <option value="RESOLVED">{language === 'en' ? 'Resolved' : 'Đã giải quyết'}</option>
            </select>
            <button
              type="button"
              onClick={() => fetchFeedbacks(1)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title={language === 'en' ? 'Refresh List' : 'Làm mới danh sách'}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </form>
      </div>

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
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              {language === 'en'
                ? 'No feedbacks match your current filters.'
                : 'Không có phản hồi nào khớp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => (
            <div
              key={fb.feedback_id}
              className={`card border-l-4 transition-all duration-200 hover:shadow-md ${
                fb.status === 'RESOLVED' || fb.status === 'CLOSED'
                  ? 'border-l-emerald-500 dark:border-l-emerald-600'
                  : 'border-l-amber-500 dark:border-l-amber-600'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    fb.status === 'RESOLVED' || fb.status === 'CLOSED'
                      ? 'badge-success'
                      : 'badge-warning'
                  }`}>
                    {fb.status === 'RESOLVED'
                      ? (language === 'en' ? 'RESOLVED' : 'ĐÃ GIẢI QUYẾT')
                      : fb.status === 'CLOSED'
                        ? (language === 'en' ? 'CLOSED' : 'ĐÃ ĐÓNG')
                        : fb.status === 'OPEN'
                          ? (language === 'en' ? 'OPEN' : 'CHỜ XỬ LÝ')
                          : fb.status === 'IN_PROGRESS'
                            ? (language === 'en' ? 'IN PROGRESS' : 'ĐANG XỬ LÝ')
                            : fb.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">FB #{fb.feedback_id}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {fb.created_at ? new Date(fb.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-4">
                    {fb.star_rating > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                          {language === 'en' ? 'Rating' : 'Đánh giá'}
                        </span>
                        <div className="flex gap-0.5 text-amber-400" title={`Rating: ${fb.star_rating} Stars`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < fb.star_rating ? "fill-amber-400 text-amber-400 shrink-0" : "text-slate-300 dark:text-slate-700 shrink-0"}
                            />
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
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                        >
                          <Paperclip size={14} className="text-blue-500" />
                          {language === 'en' ? 'View Attachment' : 'Xem tệp đính kèm'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5 bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900/30 dark:to-slate-955/20 p-4 rounded-2xl border border-blue-100/50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 dark:bg-blue-450/5 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-blue-50/60 dark:border-slate-700 shadow-xs">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 text-blue-600 dark:bg-blue-955/50 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border-2 border-blue-200 dark:border-blue-900/40 shadow-inner">
                      <span className="text-base font-black uppercase">
                        {fb.full_name ? fb.full_name.charAt(0) : "U"}
                      </span>
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
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50/40 dark:bg-emerald-955/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400 transition-colors hover:bg-emerald-100/20">
                        <Phone size={13} className="text-emerald-500" />
                        <span className="font-mono text-xs">{fb.customer_phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-400">
                        <Phone size={13} />
                        <span className="italic text-[11px]">{language === 'en' ? 'No phone' : 'Không có SĐT'}</span>
                      </div>
                    )}

                    {fb.customer_email ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-indigo-50/40 dark:bg-indigo-955/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/20 text-indigo-800 dark:text-indigo-400 transition-colors hover:bg-indigo-100/20 min-w-0">
                        <Mail size={13} className="text-indigo-500 shrink-0" />
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
                      {fb.resolved_by && (
                        <span className="font-mono text-slate-400 dark:text-slate-500 normal-case font-bold">
                          {language === 'en' ? 'By: ' : 'Người duyệt: '}{fb.resolved_by}
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

      {pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => { setPage(p => p - 1); fetchFeedbacks(page - 1) }}
            className="px-3 py-1.5 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            {language === 'en' ? 'Prev' : 'Trước'}
          </button>
          <span className="text-xs font-bold text-slate-400">
            {page} / {pagination.total_pages}
          </span>
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
