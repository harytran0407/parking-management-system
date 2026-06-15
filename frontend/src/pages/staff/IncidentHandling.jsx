import React, { useState } from "react";
import {
    FileQuestion, ScanFace, Clock, ClipboardList,
    Search, CarFront, Sliders, Trash2, Info
} from 'lucide-react';
import { toast } from "sonner";
import api from "../../utils/api";

const TABS = [
    { id: "LOST_TICKET", label: "1. Lost Ticket", sub: "Calculate penalty & close session", icon: FileQuestion, searchBySlot: false },
    { id: "OCR_MISMATCH", label: "2. Plate Mismatch", sub: "Find by slot & correct plate number", icon: ScanFace, searchBySlot: true },
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
    };

    const handleTabSwitch = (tabId) => {
        setActiveTab(tabId);
        resetWorkspace();
    };

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
                            <div className="flex justify-between"><span className="text-slate-400">Parking Slot:</span><span className="text-emerald-700 dark:text-emerald-400 font-black uppercase">{associatedSlot.slot_name}</span></div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
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
        </div>
    );
}