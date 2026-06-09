import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Search, RefreshCw, Phone, Mail, User, ShieldAlert, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../utils/api'

export default function ManagerIssues() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [feedbacks, setFeedbacks] = useState({})

  const parseDescription = (description) => {
    if (!description) return { text: "", attachment: "", feedback: "" };
    
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
    
    return { text: cleanedDesc, attachment, feedback };
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
      toast.error('Failed to load incident logs')
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

  const handleResolve = async (logId, feedbackText) => {
    setActionLoading(logId)
    try {
      const response = await api.put(`/manager/incidents/${logId}/resolve`, {
        feedback: feedbackText || ""
      })
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Incident resolved successfully')
        // Optimistic local state update
        setIncidents(prev =>
          prev.map(item => {
            if (item.log_id === logId) {
              let updatedDesc = item.description || "";
              if (feedbackText && feedbackText.trim()) {
                updatedDesc += `\n[Feedback: ${feedbackText.trim()}]`;
              }
              return { ...item, status: 'RESOLVED', description: updatedDesc, resolved_at: new Date().toISOString() };
            }
            return item;
          })
        )
        setFeedbacks(prev => {
          const next = { ...prev };
          delete next[logId];
          return next;
        });
      }
    } catch (error) {
      console.error('Resolve incident error:', error)
      toast.error(error.message || 'Failed to resolve incident')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="animate-slide-in flex flex-col h-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="section-title mb-1">Issue Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor and resolve reported parking building incidents (Lost cards, parking slot disputes, system errors).
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="card mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Keyword, Reporter, Type..."
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
              <option value="OPEN">Open Incidents</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <button
              type="button"
              onClick={fetchIncidents}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Refresh List"
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
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading incidents log...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No incidents reported</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-1">
              There are no current issues reported in the system for this building.
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
                    {incident.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">Log #{incident.log_id}</span>
                  {incident.session_id && (
                    <span className="text-xs font-bold text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Session: {incident.session_id}
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {incident.report_time ? new Date(incident.report_time).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">
                      Issue Type: {incident.issue_type?.replace('_', ' ')}
                    </h4>
                    {(() => {
                      const { text: parsedDesc, attachment, feedback } = parseDescription(incident.description);
                      const backendRoot = getBackendRootUrl();
 
                      return (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 font-medium leading-relaxed">
                            {parsedDesc || 'No description provided.'}
                          </p>
                          {attachment && (
                            <div className="flex items-center gap-2">
                              <a
                                href={`${backendRoot}${attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                              >
                                <Paperclip size={14} className="text-blue-500" />
                                View Attachment Image / File
                              </a>
                            </div>
                          )}
                          {feedback && (
                            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-1">
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">
                                Resolution Feedback
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                                {feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-1">
                    Reporter Contact
                  </span>

                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200">
                      {incident.reporter_name || 'System Operator'}
                    </span>
                  </div>

                  {incident.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span className="text-slate-800 dark:text-slate-200">{incident.customer_phone}</span>
                    </div>
                  )}

                  {incident.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="text-slate-800 dark:text-slate-200 truncate">{incident.customer_email}</span>
                    </div>
                  )}

                  {incident.status === 'OPEN' ? (
                    <div className="space-y-2 mt-4">
                      <textarea
                        value={feedbacks[incident.log_id] || ""}
                        onChange={(e) => setFeedbacks(prev => ({ ...prev, [incident.log_id]: e.target.value }))}
                        placeholder="Resolution feedback / notes..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-medium"
                        rows={2}
                      />
                      <button
                        onClick={() => handleResolve(incident.log_id, feedbacks[incident.log_id])}
                        disabled={actionLoading === incident.log_id}
                        className="w-full btn-primary flex items-center justify-center gap-1.5 py-2 text-xs font-bold shadow-sm"
                      >
                        {actionLoading === incident.log_id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <CheckCircle size={13} />
                        )}
                        Mark as Resolved
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 py-2 rounded-lg mt-4 border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle size={14} />
                      <span>Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
