<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import {
    FileQuestion, ScanFace, Clock, ClipboardList,
    Search, CarFront, Sliders, Trash2, Info,
    Star, Paperclip, AlertCircle, CheckCircle, Phone, Mail, Ticket, CarFrontIcon, MessageSquare
=======
import React, { useState } from "react";
import {
    FileQuestion, ScanFace, Clock, ClipboardList,
    Search, CarFront, Sliders, Trash2, Info
>>>>>>> origin/main
} from 'lucide-react';
import { toast } from "sonner";
import api from "../../utils/api";

const TABS = [
<<<<<<< HEAD
    { id: "LOST_TICKET", label: "1. Lost Ticket", sub: "Calculate penalty & close session", icon: Ticket, searchBySlot: false },
    { id: "OCR_MISMATCH", label: "2. Plate Mismatch", sub: "Find by slot & correct plate number", icon: CarFrontIcon, searchBySlot: true },
    { id: "USER_REPORTED", label: "3. User Issues", sub: "Respond & resolve user reports", icon: MessageSquare, searchBySlot: false },
=======
    { id: "LOST_TICKET", label: "1. Lost Ticket", sub: "Calculate penalty & close session", icon: FileQuestion, searchBySlot: false },
    { id: "OCR_MISMATCH", label: "2. Plate Mismatch", sub: "Find by slot & correct plate number", icon: ScanFace, searchBySlot: true },
>>>>>>> origin/main
];

export default function StaffIncidentHandling() {
    const [activeTab, setActiveTab] = useState("LOST_TICKET");

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundSession, setFoundSession] = useState(null);
    const [associatedSlot, setAssociatedSlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportData, setReportData] = useState(null);

    const [formValues, setFormValues] = useState({
        lostPlate: "",
        lostReason: "",
        correctedPlate: "",
        mismatchReason: ""
    });

<<<<<<< HEAD
    const [userIncidents, setUserIncidents] = useState([]);
    const [userIncidentsLoading, setUserIncidentsLoading] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [userStatusFilter, setUserStatusFilter] = useState("OPEN");
    const [userSearchQuery, setUserSearchQuery] = useState("");

=======
>>>>>>> origin/main
    const currentTabConfig = TABS.find(t => t.id === activeTab);

    const handleInputChange = (key, value) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const resetWorkspace = () => {
        setReportData(null);
        setFoundSession(null);
        setAssociatedSlot(null);
        setSearchQuery("");
        setFormValues({
            lostPlate: "", lostReason: "",
            correctedPlate: "", mismatchReason: ""
        });
<<<<<<< HEAD
        setSelectedIncident(null);
        setFeedbackText("");
        setUserSearchQuery("");
=======
>>>>>>> origin/main
    };

    const handleTabSwitch = (tabId) => {
        setActiveTab(tabId);
        resetWorkspace();
    };

<<<<<<< HEAD
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

    const fetchUserIncidents = async (status = userStatusFilter, search = userSearchQuery) => {
        setUserIncidentsLoading(true);
        try {
            const res = await api.get("/staff/incidents", {
                params: {
                    status: status || undefined,
                    search: search || undefined
                }
            });
            if (res.data?.success) {
                setUserIncidents(res.data.data);
                if (selectedIncident) {
                    const updated = res.data.data.find(i => i.log_id === selectedIncident.log_id);
                    setSelectedIncident(updated || null);
                }
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load user incidents.");
        } finally {
            setUserIncidentsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "USER_REPORTED") {
            fetchUserIncidents(userStatusFilter, userSearchQuery);
        }
    }, [activeTab, userStatusFilter]);

    const handleResolveUserIncident = async (e) => {
        e.preventDefault();
        if (!selectedIncident) return;
        if (!feedbackText.trim()) {
            return toast.error("Please enter a resolution feedback message!");
        }

        setIsSubmitting(true);
        try {
            const res = await api.put(`/staff/incidents/${selectedIncident.log_id}/resolve`, {
                feedback: feedbackText.trim()
            });

            if (res.data?.success) {
                toast.success("Incident resolved successfully!");
                setFeedbackText("");
                await fetchUserIncidents();
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to resolve incident.");
        } finally {
            setIsSubmitting(false);
        }
    };

=======
>>>>>>> origin/main
    const handleSearchActiveSession = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toUpperCase();
        if (!query) return toast.error("Please enter a search keyword!");

        setIsSearching(true);
        setReportData(null);
        setFoundSession(null);
        setAssociatedSlot(null);

        try {
            const url = currentTabConfig?.searchBySlot
                ? `/parking/slots/active-session/${query}`
                : `/parking/sessions/active/${query}`;

            const res = await api.get(url);

            if (res.data?.success && res.data?.data) {
                const session = res.data.data.session || res.data.data;
                const slotInfo = res.data.data.slot || session.slot || null;

                setFoundSession(session);
                setAssociatedSlot(slotInfo);

                if (activeTab === "LOST_TICKET") {
                    handleInputChange("lostPlate", session.license_plate_in || query);
                }
                toast.success("Active parking session found!");
            } else {
                toast.error(
                    currentTabConfig?.searchBySlot
                        ? "This slot is empty or has no active session."
                        : "No active session found for this license plate."
                );
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Search failed. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmitIncident = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const queryUpper = searchQuery.trim().toUpperCase();

        const INCIDENT_SUBMIT_MAP = {
            LOST_TICKET: {
                url: "/staff/lost-ticket",
                body: {
                    session_id: foundSession?.session_id || "sess_unknown",
                    license_plate: formValues.lostPlate.toUpperCase(),
                    lost_reason: formValues.lostReason || "Customer reported lost parking ticket",
                }
            },
            OCR_MISMATCH: {
                url: "/staff/correct-mismatch",
                body: {
                    slot_name: queryUpper,
                    original_license_plate: foundSession?.license_plate_in || "",
                    corrected_license_plate: formValues.correctedPlate.trim().toUpperCase(),
                    reason: formValues.mismatchReason || "OCR character misread",
                }
            }
        };

        const targetConfig = INCIDENT_SUBMIT_MAP[activeTab];

        try {
            const res = await api.post(targetConfig.url, targetConfig.body);

            toast.success("Incident resolved and updated successfully!");

            setReportData({
                success: true,
                type: activeTab,
                timestamp: new Date().toLocaleString("en-US"),
                payload: res.data?.data || {},
                changes: { ...targetConfig.body }
            });

            setFoundSession(null);
            setAssociatedSlot(null);
            setSearchQuery("");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Action denied. Please check parameters.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSystemData = () => {
        if (!foundSession) return null;
        return (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12} /> Current System Data</div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md text-xs font-semibold space-y-1.5 border border-slate-200 dark:border-slate-700">
                        {associatedSlot?.slot_name && (
<<<<<<< HEAD
                            <div className="flex justify-between"><span className="text-slate-400">Parking Slot:</span><span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{associatedSlot.slot_name}</span></div>
                        )}
                        {foundSession.zone_name && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Zone:</span>
                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black uppercase">{foundSession.zone_name}</span></div>
=======
                            <div className="flex justify-between"><span className="text-slate-400">Parking Slot:</span><span className="text-emerald-700 dark:text-emerald-400 font-black uppercase">{associatedSlot.slot_name}</span></div>
>>>>>>> origin/main
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-400">License Plate:</span>
                            <span className="font-mono text-slate-900 dark:text-white rounded font-black">{foundSession.license_plate_in}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Check-in Time:</span>
                            <span className="font-mono text-slate-900 dark:text-white rounded font-black">
                                {foundSession.check_in_time
                                    ? `${new Date(foundSession.check_in_time).toLocaleTimeString('en-GB')} ${new Date(foundSession.check_in_time).toLocaleDateString('en-GB')}`
                                    : "--:--:-- --/--/----"}
                            </span>
                        </div>
                        <div className="flex justify-between"><span className="text-slate-400">Duration:</span><span className="font-mono text-slate-900 dark:text-white">{foundSession.duration_minutes} mins</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Current Fee:</span><span className="font-mono text-amber-600 dark:text-amber-500">{(foundSession.current_fee || 0).toLocaleString()} VND</span></div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">Entry Camera Image</span>
                    <img
                        src={`/api/v1/parking/sessions/${foundSession.session_id}/entry-image`}
                        alt="Gate Entry"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=600"; }}
                        className="w-full h-32 object-cover border border-slate-200 dark:border-slate-700 rounded-md bg-slate-100 dark:bg-slate-800"
                    />
                </div>
            </div>
        );
    };

    const renderResultPanel = () => {
        if (!reportData) return null;
        const { type, timestamp, payload, changes } = reportData;

        return (
            <div className="space-y-4 animate-fadeIn">
                <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-xs border-b pb-2 border-slate-200 dark:border-slate-700">
                        <ClipboardList size={14} /> Incident Outcome Log
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">Type:</span><span className="font-bold text-slate-900 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] dark:text-white">{type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Time:</span><span className="font-mono text-slate-900 dark:text-white">{timestamp}</span></div>

                        {type === "LOST_TICKET" && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                                <div className="flex justify-between"><span>License Plate:</span><span className="font-mono font-black text-slate-900 dark:text-white">{changes.license_plate}</span></div>
                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400"><span>Parking Fee:</span><span>{(payload.breakdown?.actual_parking_fee || payload.parking_fee || 15000).toLocaleString()} VND</span></div>
                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400"><span>Penalty Fine:</span><span>{(payload.breakdown?.handling_fee || payload.penalty_fee || 50000).toLocaleString()} VND</span></div>
                                <div className="border-t pt-1.5 border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                                    <span>TOTAL DUE:</span>
                                    <span className="text-red-600 dark:text-red-400">{(payload.calculated_fee || payload.total_fee || 65000).toLocaleString()} VND</span>
                                </div>
                            </div>
                        )}

                        {type === "OCR_MISMATCH" && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                                <div className="flex justify-between text-[11px] mb-1"><span className="text-slate-400">Updated Slot:</span><span className="font-bold text-slate-900 dark:text-white uppercase">{changes.slot_name}</span></div>
                                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700 text-center">
                                    <div>
                                        <div className="text-[10px] text-slate-400">Wrong OCR</div>
                                        <div className="font-mono font-bold line-through text-red-500">{changes.original_license_plate || "N/A"}</div>
                                    </div>
                                    <div className="border-l border-slate-100 dark:border-slate-700">
                                        <div className="text-[10px] text-slate-400">Corrected To</div>
                                        <div className="font-mono font-black text-emerald-600 dark:text-emerald-400">{changes.corrected_license_plate}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700"><strong>Reason:</strong> {changes.reason || changes.lost_reason}</div>
                    </div>
                </div>

                <button
                    onClick={() => resetWorkspace()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                    Process Next Issue
                </button>
            </div>
        );
    };

    return (
        <div className="w-full text-slate-700 dark:text-slate-200 h-full flex flex-col gap-4 overflow-hidden antialiased">

            {/* SELECTION TABS GRID */}
<<<<<<< HEAD
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
=======
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
>>>>>>> origin/main
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabSwitch(tab.id)}
                            className={`flex items-center gap-3 p-3 rounded-md border transition-all text-left ${active
                                ? "bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-400 shadow-sm ring-1 ring-slate-900/5"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
                                }`}
                        >
                            <div className={`p-2 rounded-md ${active ? "bg-blue-600 text-white dark:bg-slate-800" : "bg-slate-200/60 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}>
                                <Icon size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">{tab.label}</div>
                                <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{tab.sub}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* MAIN WORKSPACE */}
<<<<<<< HEAD
            {activeTab === "USER_REPORTED" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start flex-1 min-h-0 overflow-y-auto pr-1 animate-fadeIn">
                    {/* LEFT COLUMN: LIST OF INCIDENTS */}
                    <div className="lg:col-span-2 space-y-4 h-full flex flex-col min-h-0">
                        {/* SEARCH & FILTER CONTROLS */}
                        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md pl-9 pr-3 py-1.5 text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto items-center">
                                <select
                                    value={userStatusFilter}
                                    onChange={(e) => setUserStatusFilter(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md px-3 py-1.5 text-xs font-bold outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="OPEN">Open</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => fetchUserIncidents(userStatusFilter, userSearchQuery)}
                                    className="bg-blue-600 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-md transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* LIST CONTAINER */}
                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] pr-1">
                            {userIncidentsLoading ? (
                                <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm flex flex-col items-center justify-center gap-3">
                                    <Clock className="animate-spin text-blue-500" size={24} />
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading user reports...</p>
                                </div>
                            ) : userIncidents.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 p-12 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-center">
                                    <AlertCircle className="mx-auto text-slate-350 dark:text-slate-650 mb-2" size={36} />
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wide">No incident reports found</p>
                                    <p className="text-slate-400 dark:text-slate-650 text-[10px] mt-1">
                                        There are no current reports matching this filter.
                                    </p>
                                </div>
                            ) : (
                                userIncidents.map((incident) => {
                                    const { subject, message } = parseDescription(incident.description);
                                    const isSelected = selectedIncident?.log_id === incident.log_id;
                                    return (
                                        <div
                                            key={incident.log_id}
                                            onClick={() => {
                                                setSelectedIncident(incident);
                                                setFeedbackText("");
                                            }}
                                            className={`bg-white dark:bg-slate-900 p-4 border rounded-md shadow-xs cursor-pointer transition-all hover:shadow-md ${isSelected
                                                ? "border-blue-600 dark:border-blue-400 ring-1 ring-blue-600 dark:ring-blue-400"
                                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${incident.status === "OPEN"
                                                        ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                                                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                        }`}>
                                                        {incident.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 font-mono">#{incident.log_id}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {incident.report_time ? new Date(incident.report_time).toLocaleString() : ""}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-150 text-blue-650 font-bold flex items-center justify-center text-[10px] uppercase border border-blue-200 dark:border-slate-750">
                                                    {incident.reporter_avatar ? (
                                                        <img
                                                            src={
                                                                incident.reporter_avatar.startsWith("http")
                                                                    ? incident.reporter_avatar
                                                                    : `${getBackendRootUrl()}${incident.reporter_avatar}`
                                                            }
                                                            alt="Reporter Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{incident.reporter_name ? incident.reporter_name.charAt(0) : "U"}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-slate-850 dark:text-white truncate">
                                                    {incident.reporter_name || "System User"}
                                                </span>
                                            </div>

                                            <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase mb-1">
                                                {incident.issue_type?.replace("_", " ")}
                                            </div>
                                            {subject && (
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    {subject}
                                                </div>
                                            )}
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {message || "No description provided."}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: DETAIL PANEL */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 relative overflow-hidden h-fit space-y-4">
                        {selectedIncident ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <ClipboardList size={15} className="text-slate-400" />
                                    <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                        Report Details
                                    </h3>
                                </div>

                                {/* REPORTER CARD */}
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-slate-700 shadow-inner">
                                        {selectedIncident.reporter_avatar ? (
                                            <img
                                                src={
                                                    selectedIncident.reporter_avatar.startsWith("http")
                                                        ? selectedIncident.reporter_avatar
                                                        : `${getBackendRootUrl()}${selectedIncident.reporter_avatar}`
                                                }
                                                alt="Reporter Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-black uppercase">
                                                {selectedIncident.reporter_name ? selectedIncident.reporter_name.charAt(0) : "U"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-0.5">
                                            Reporter
                                        </span>
                                        <p className="text-xs font-black text-slate-850 dark:text-white truncate font-extrabold">
                                            {selectedIncident.reporter_name || "System User"}
                                        </p>
                                    </div>
                                </div>

                                {/* REPORTER CONTACTS */}
                                <div className="space-y-2 text-xs font-bold text-slate-655 dark:text-slate-400">
                                    {selectedIncident.customer_phone ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/40 dark:bg-emerald-950/10 rounded border border-emerald-100/60 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400">
                                            <Phone size={12} className="text-emerald-500" />
                                            <span className="font-mono text-xs">{selectedIncident.customer_phone}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-800 text-slate-400">
                                            <Phone size={12} />
                                            <span className="italic text-[10px]">No phone number</span>
                                        </div>
                                    )}

                                    {selectedIncident.customer_email ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/40 dark:bg-indigo-950/10 rounded border border-indigo-100/60 dark:border-indigo-900/20 text-indigo-800 dark:text-indigo-400 min-w-0">
                                            <Mail size={12} className="text-indigo-500 shrink-0" />
                                            <span className="truncate text-xs">{selectedIncident.customer_email}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-800 text-slate-400">
                                            <Mail size={12} />
                                            <span className="italic text-[10px]">No email</span>
                                        </div>
                                    )}
                                </div>

                                {/* TICKET CONTENT */}
                                {(() => {
                                    const { rating, subject, message, attachment, feedback } = parseDescription(selectedIncident.description);
                                    return (
                                        <div className="space-y-3 text-xs">
                                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-0.5 font-bold">Issue Type</span>
                                                <span className="font-extrabold text-slate-800 dark:text-white uppercase">{selectedIncident.issue_type?.replace("_", " ")}</span>
                                            </div>

                                            {rating > 0 && (
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-1 font-bold">Experience Rating</span>
                                                    <div className="flex gap-0.5 text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-750"}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {subject && (
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-0.5 font-bold">Subject</span>
                                                    <p className="font-extrabold text-slate-850 dark:text-white leading-snug">{subject}</p>
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block mb-0.5 font-bold">Description</span>
                                                <p className="text-slate-605 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-150 dark:border-slate-850 whitespace-pre-wrap font-medium leading-relaxed">
                                                    {message || "No description provided."}
                                                </p>
                                            </div>

                                            {attachment && (
                                                <div className="pt-1">
                                                    <a
                                                        href={`${getBackendRootUrl()}${attachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-250 dark:border-slate-700 rounded text-[11px] font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-xs"
                                                    >
                                                        <Paperclip size={12} className="text-blue-500" />
                                                        View Attachment File
                                                    </a>
                                                </div>
                                            )}

                                            {/* RESOLUTION ACTION */}
                                            {selectedIncident.status === "OPEN" ? (
                                                <form onSubmit={handleResolveUserIncident} className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block font-bold">Resolution Feedback</label>
                                                        <textarea
                                                            rows={3}
                                                            required
                                                            value={feedbackText}
                                                            onChange={e => setFeedbackText(e.target.value)}
                                                            placeholder="Type resolution reply or instructions for the user..."
                                                            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all resize-none"
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="w-full py-2 bg-blue-600 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={14} />
                                                        {isSubmitting ? "Processing..." : "Resolve Ticket & Notify"}
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                                                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider mb-1 font-bold">
                                                            Resolution Feedback
                                                        </span>
                                                        <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold leading-relaxed mb-2">
                                                            {feedback || "Resolved without additional feedback."}
                                                        </p>
                                                        {selectedIncident.resolved_by && (
                                                            <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-150 dark:border-slate-800/80 pt-1.5 flex justify-between">
                                                                <span>By: {selectedIncident.resolved_by}</span>
                                                                <span>{selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString() : ""}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-24 text-slate-400 dark:text-slate-500 font-medium text-xs italic space-y-2 font-semibold">
                                <ClipboardList size={32} className="mx-auto text-slate-200 dark:text-slate-800 stroke-[1.5]" />
                                <div>No Incident Selected.</div>
                                <div className="text-[10px] text-slate-350 dark:text-slate-600 mt-1 max-w-[200px] mx-auto not-italic">
                                    Select an incident from the list on the left to see full details, reporter contact information, and resolve the ticket.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start flex-1 min-h-0 overflow-y-auto pr-1">

                    {/* SEARCH AND FORM BLOCK */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* SEARCH ACTIVE SESSION FORM */}
                        <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                                    <Search size={14} className="text-blue-500" />
                                    {activeTab === "LOST_TICKET" ? "Search active session by Plate Number" : "Search session by Slot Name (e.g., A101)"}
                                </h3>
                                {(searchQuery || foundSession || reportData) && (
                                    <button
                                        type="button"
                                        onClick={() => resetWorkspace()}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all">
                                        <Trash2 size={12} />
                                        <span>Clear Form</span>
                                    </button>
                                )}
                            </div>

                            {/* FORM TÌM KIẾM: Nhấn Enter ở input này sẽ chạy handleSearchActiveSession */}
                            <form onSubmit={handleSearchActiveSession} className="flex gap-2">
                                <div className="relative flex-1">
                                    <CarFront className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder={currentTabConfig?.searchBySlot ? "Enter slot name (e.g., A101, B205)..." : "Enter vehicle license plate..."}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md pl-9 pr-3 py-2 text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all placeholder:font-normal"
                                    />
                                </div>
                                <button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-4 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap">
                                    Find Session
                                </button>
                            </form>

                            {!foundSession && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-semibold rounded-md border border-amber-200 dark:border-amber-900/30 text-xs flex items-center gap-2">
                                    <Info size={14} />
                                    <span>You must enter details and click "Find Session" above before confirming.</span>
                                </div>
                            )}

                            {renderSystemData()}
                        </div>

                        {/* INCIDENT DETAILS FORM */}
                        <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                {activeTab === "LOST_TICKET" ? "Lost Ticket Report" : `Correct Plate Number`}
                            </h3>

                            {/* FORM XỬ LÝ SỰ CỐ: Nhấn Enter ở bất kỳ ô input/textarea nào trong này sẽ chạy handleSubmitIncident */}
                            <form onSubmit={handleSubmitIncident} className="space-y-4">

                                {/* FORM: LOST TICKET */}
                                {activeTab === "LOST_TICKET" && (
                                    <div className="grid grid-cols-1 gap-4 text-xs">
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">License Plate</label>
                                            <input
                                                type="text" required disabled={!foundSession}
                                                value={formValues.lostPlate} onChange={e => handleInputChange("lostPlate", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-black text-sm uppercase rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">Staff Notes</label>
                                            <textarea
                                                rows={2} required disabled={!foundSession}
                                                value={formValues.lostReason} onChange={e => handleInputChange("lostReason", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all resize-none disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* FORM: OCR MISMATCH */}
                                {activeTab === "OCR_MISMATCH" && (
                                    <div className="grid grid-cols-1 gap-4 text-xs">
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">Correct License Plate</label>
                                            <input
                                                type="text" required disabled={!foundSession}
                                                value={formValues.correctedPlate} onChange={e => handleInputChange("correctedPlate", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50 "
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">Staff Notes</label>
                                            <input
                                                type="text" required disabled={!foundSession}
                                                value={formValues.mismatchReason} onChange={e => handleInputChange("mismatchReason", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* EXECUTE ACTION BUTTON */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !foundSession}
                                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "Processing..." : "Confirm & Update System"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: OUTPUT SIDE PANEL */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 relative overflow-hidden h-fit">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                            <ClipboardList size={15} className="text-slate-400" />
                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                Output
                            </h3>
                        </div>

                        {reportData ? renderResultPanel() : (
                            <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-medium text-xs italic space-y-2">
                                <ClipboardList size={32} className="mx-auto text-slate-200 dark:text-slate-800 stroke-[1.5]" />
                                <div>Awaiting action.</div>
                                <div className="text-[10px] text-slate-300 dark:text-slate-600 not-italic max-w-[200px] mx-auto mt-1">
                                    {activeTab === "LOST_TICKET"
                                        ? "Detailed receipt and payment breakdown will appear here after confirming the lost ticket report."
                                        : "Detailed system logs and update history will be displayed here."}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )}
=======
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start flex-1 min-h-0 overflow-y-auto pr-1">

                {/* SEARCH AND FORM BLOCK */}
                <div className="lg:col-span-2 space-y-4">

                    {/* SEARCH ACTIVE SESSION FORM */}
                    <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                                <Search size={14} className="text-blue-500" />
                                {activeTab === "LOST_TICKET" ? "Search active session by Plate Number" : "Search session by Slot Name (e.g., A101)"}
                            </h3>
                            {(searchQuery || foundSession || reportData) && (
                                <button
                                    type="button"
                                    onClick={() => resetWorkspace()}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all">
                                    <Trash2 size={12} />
                                    <span>Clear Form</span>
                                </button>
                            )}
                        </div>

                        {/* FORM TÌM KIẾM: Nhấn Enter ở input này sẽ chạy handleSearchActiveSession */}
                        <form onSubmit={handleSearchActiveSession} className="flex gap-2">
                            <div className="relative flex-1">
                                <CarFront className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={currentTabConfig?.searchBySlot ? "Enter slot name (e.g., A101, B205)..." : "Enter vehicle license plate..."}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md pl-9 pr-3 py-2 text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all placeholder:font-normal"
                                />
                            </div>
                            <button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-4 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap">
                                Find Session
                            </button>
                        </form>

                        {!foundSession && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-semibold rounded-md border border-amber-200 dark:border-amber-900/30 text-xs flex items-center gap-2">
                                <Info size={14} />
                                <span>You must enter details and click "Find Session" above before confirming.</span>
                            </div>
                        )}

                        {renderSystemData()}
                    </div>

                    {/* INCIDENT DETAILS FORM */}
                    <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            {activeTab === "LOST_TICKET" ? "Lost Ticket Report" : `Correct Plate Number`}
                        </h3>

                        {/* FORM XỬ LÝ SỰ CỐ: Nhấn Enter ở bất kỳ ô input/textarea nào trong này sẽ chạy handleSubmitIncident */}
                        <form onSubmit={handleSubmitIncident} className="space-y-4">

                            {/* FORM: LOST TICKET */}
                            {activeTab === "LOST_TICKET" && (
                                <div className="grid grid-cols-1 gap-4 text-xs">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-400 uppercase tracking-wide">License Plate</label>
                                        <input
                                            type="text" required disabled={!foundSession}
                                            value={formValues.lostPlate} onChange={e => handleInputChange("lostPlate", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-black text-sm uppercase rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-400 uppercase tracking-wide">Staff Notes</label>
                                        <textarea
                                            rows={2} required disabled={!foundSession}
                                            value={formValues.lostReason} onChange={e => handleInputChange("lostReason", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all resize-none disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* FORM: OCR MISMATCH */}
                            {activeTab === "OCR_MISMATCH" && (
                                <div className="grid grid-cols-1 gap-4 text-xs">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-400 uppercase tracking-wide">Correct License Plate</label>
                                        <input
                                            type="text" required disabled={!foundSession}
                                            value={formValues.correctedPlate} onChange={e => handleInputChange("correctedPlate", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50 "
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-400 uppercase tracking-wide">Staff Notes</label>
                                        <input
                                            type="text" required disabled={!foundSession}
                                            value={formValues.mismatchReason} onChange={e => handleInputChange("mismatchReason", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* EXECUTE ACTION BUTTON */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !foundSession}
                                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Processing..." : "Confirm & Update System"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: OUTPUT SIDE PANEL */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 relative overflow-hidden h-fit">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                        <ClipboardList size={15} className="text-slate-400" />
                        <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                            Output
                        </h3>
                    </div>

                    {reportData ? renderResultPanel() : (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-medium text-xs italic space-y-2">
                            <ClipboardList size={32} className="mx-auto text-slate-200 dark:text-slate-800 stroke-[1.5]" />
                            <div>Awaiting action.</div>
                            <div className="text-[10px] text-slate-300 dark:text-slate-600 not-italic max-w-[200px] mx-auto mt-1">
                                {activeTab === "LOST_TICKET"
                                    ? "Detailed receipt and payment breakdown will appear here after confirming the lost ticket report."
                                    : "Detailed system logs and update history will be displayed here."}
                            </div>
                        </div>
                    )}
                </div>

            </div>
>>>>>>> origin/main
        </div>
    );
}