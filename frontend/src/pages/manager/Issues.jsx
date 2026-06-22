import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Search, RefreshCw, Phone, Mail, ShieldAlert, Paperclip, Star } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'
import { useLanguage } from '../../hooks/useLanguage'

export default function ManagerIssues() {
  const { language } = useLanguage()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const parseDescription = (description) => {
    if (!description) return { rating: 0, subject: "", message: "", attachment: "", feedback: "" };
    
    let attachment = "";
    const attachmentMatch = description.match(/\[Attachment:\s*([^\]]+)\]/);
    if (attachmentMatch) {
      attachment = attachmentMatch[1];
    }
    
    let cleanedDesc = description.replace(/\[Attachment:\s*[^\]]+\]/, "").trim();
    
    let feedback = "";
    const feedbackMatch = cleanedDesc.match(/\[Feedback:\s*([^\]]+)\]/);
    if (feedbackMatch) {
      feedback = feedbackMatch[1];
      cleanedDesc = cleanedDesc.replace(/\[Feedback:\s*[^\]]+\]/, "").trim();
    }

    let rating = 0;
    const ratingMatch = cleanedDesc.match(/\[Rating:\s*(\d)★?\]/);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1], 10);
      cleanedDesc = cleanedDesc.replace(/\[Rating:\s*\d★?\]/, "").trim();
    }

    let subject = "";
    let message = cleanedDesc;
    const colonIndex = cleanedDesc.indexOf(":");
    if (colonIndex > 0) {
      subject = cleanedDesc.substring(0, colonIndex).trim();
      message = cleanedDesc.substring(colonIndex + 1).trim();
    }
    
    return { rating, subject, message, attachment, feedback };
  };

  const getBackendRootUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5077";
    return baseUrl.replace("/api/v1", "");
  };

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const response = await api.get('/manager/incidents', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter || undefined
        }
      })
      if (response.data && response.data.success) {
        setIncidents(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching incidents:', error)
      toast.error(language === 'en' ? 'Failed to load incident logs' : 'Không thể tải lịch sử sự cố')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchIncidents()
  }

  return (
    <div className="animate-slide-in flex flex-col h-full">
      {/* FILTER & SEARCH */}
      <div className="card mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search by Keyword, Reporter, Type...' : 'Tìm theo từ khóa, người báo cáo, phân loại...'}
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
              <option value="OPEN">{language === 'en' ? 'Open Incidents' : 'Sự cố đang xử lý'}</option>
              <option value="RESOLVED">{language === 'en' ? 'Resolved' : 'Đã giải quyết'}</option>
            </select>
            <button
              type="button"
              onClick={fetchIncidents}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title={language === 'en' ? 'Refresh List' : 'Làm mới danh sách'}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </form>
      </div>

      {/* INCIDENTS LIST */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <div className="card flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'en' ? 'Loading incidents log...' : 'Đang tải lịch sử sự cố...'}
            </p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
              {language === 'en' ? 'No incidents reported' : 'Không có báo cáo sự cố nào'}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              {language === 'en'
                ? 'There are no current issues reported in the system for this building.'
                : 'Hiện tại không có sự cố nào được báo cáo trong hệ thống cho tòa nhà này.'}
            </p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.log_id}
              className={`card border-l-4 transition-all duration-200 hover:shadow-md ${incident.status === 'OPEN'
                  ? 'border-l-red-500 dark:border-l-red-600'
                  : 'border-l-emerald-500 dark:border-l-emerald-600'
                }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className={`badge ${incident.status === 'OPEN'
                      ? 'badge-error'
                      : 'badge-success'
                    }`}>
                    {incident.status === 'OPEN' 
                      ? (language === 'en' ? 'OPEN' : 'ĐANG XỬ LÝ')
                      : (language === 'en' ? 'RESOLVED' : 'ĐÃ GIẢI QUYẾT')}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">Log #{incident.log_id}</span>
                  {incident.session_id && (
                    <span className="text-xs font-bold text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {language === 'en' ? 'Session:' : 'Phiên gửi:'} {incident.session_id}
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {incident.report_time ? new Date(incident.report_time).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                  {(() => {
                    const { rating, subject, message, attachment } = parseDescription(incident.description);
                    const backendRoot = getBackendRootUrl();

                    return (
                      <div className="space-y-4">
                        {/* Issue Category */}
                        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">
                            {language === 'en' ? 'Issue Category' : 'Danh mục sự cố'}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                            {incident.issue_type?.replace('_', ' ')}
                          </h4>
                        </div>

                        {/* System Experience Rating */}
                        {rating > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                              {language === 'en' ? 'System Experience Rating' : 'Đánh giá trải nghiệm hệ thống'}
                            </span>
                            <div className="flex gap-0.5 text-amber-400" title={`Rating: ${rating} Stars`}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < rating ? "fill-amber-400 text-amber-400 shrink-0" : "text-slate-300 dark:text-slate-700 shrink-0"}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Subject Title */}
                        {subject && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                              {language === 'en' ? 'Subject Title' : 'Tiêu đề sự việc'}
                            </span>
                            <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-snug">{subject}</p>
                          </div>
                        )}

                        {/* Detailed Description */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-455 dark:text-slate-500 tracking-wider block">
                            {language === 'en' ? 'Detailed Description' : 'Mô tả chi tiết'}
                          </span>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            {message || (language === 'en' ? 'No description provided.' : 'Không có mô tả chi tiết.')}
                          </p>
                        </div>

                        {/* Attachment */}
                        {attachment && (
                          <div className="pt-1">
                            <a
                              href={`${backendRoot}${attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                            >
                              <Paperclip size={14} className="text-blue-500" />
                              {language === 'en' ? 'View Attachment Image / File' : 'Xem ảnh / file đính kèm'}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Reporter Contact Panel */}
                <div className="space-y-3.5 bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900/30 dark:to-slate-955/20 p-4 rounded-2xl border border-blue-100/50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 dark:bg-blue-450/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-blue-50/60 dark:border-slate-700 shadow-xs">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 text-blue-600 dark:bg-blue-955/50 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border-2 border-blue-200 dark:border-blue-900/40 shadow-inner transition-transform hover:scale-105 duration-200">
                      {incident.reporter_avatar ? (
                        <img
                          src={
                            incident.reporter_avatar.startsWith("http://") || incident.reporter_avatar.startsWith("https://")
                              ? incident.reporter_avatar
                              : `${getBackendRootUrl()}${incident.reporter_avatar}`
                          }
                          alt="Reporter Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-black uppercase">
                          {incident.reporter_name ? incident.reporter_name.charAt(0) : "U"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-1">
                        {language === 'en' ? 'Reporter' : 'Người báo cáo'}
                      </span>
                      <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                        {incident.reporter_name || (language === 'en' ? 'System Operator' : 'Nhân viên vận hành')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {incident.customer_phone ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50/40 dark:bg-emerald-955/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400 transition-colors hover:bg-emerald-100/20">
                        <Phone size={13} className="text-emerald-500" />
                        <span className="font-mono text-xs">{incident.customer_phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-400">
                        <Phone size={13} />
                        <span className="italic text-[11px]">{language === 'en' ? 'No phone number' : 'Không có số điện thoại'}</span>
                      </div>
                    )}

                    {incident.customer_email ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-indigo-50/40 dark:bg-indigo-955/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/20 text-indigo-800 dark:text-indigo-400 transition-colors hover:bg-indigo-100/20 min-w-0">
                        <Mail size={13} className="text-indigo-500 shrink-0" />
                        <span className="truncate text-xs">{incident.customer_email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-400">
                        <Mail size={13} />
                        <span className="italic text-[11px]">{language === 'en' ? 'No email' : 'Không có email'}</span>
                      </div>
                    )}

                    {incident.status === 'RESOLVED' && (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/30 py-2 rounded-xl border border-emerald-250/70 dark:border-emerald-900/30 text-[10px] uppercase tracking-wider font-black shadow-xs">
                        <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'en' ? 'Ticket Resolved' : 'Đã giải quyết yêu cầu'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resolution Actions & Feedback Callout Box */}
              {(() => {
                const { feedback } = parseDescription(incident.description);
                return (
                  incident.status === 'OPEN' ? (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-xs">
                        <AlertCircle size={14} className="text-amber-500" />
                        <span>{language === 'en' ? 'Pending resolution by Parking Staff.' : 'Đang chờ giải quyết bởi nhân viên bãi xe.'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                          <span>{language === 'en' ? 'Resolution Feedback' : 'Phản hồi giải quyết'}</span>
                          {incident.resolved_by && (
                            <span className="font-mono text-slate-400 dark:text-slate-500 normal-case font-bold">
                              {language === 'en' ? 'Resolved by: ' : 'Người duyệt: '}{incident.resolved_by} {incident.resolved_at ? `${language === 'en' ? 'at' : 'lúc'} ${new Date(incident.resolved_at).toLocaleString()}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                          {feedback || (language === 'en' ? 'Resolved without additional feedback.' : 'Đã xử lý và không có phản hồi thêm.')}
                        </p>
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
