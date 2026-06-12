import React, { useState } from "react";
import {
  Settings,
  Database,
  Save,
  Download,
  RefreshCw,
  Sliders,
  Loader2,
  Camera,
  Clock,
  HelpCircle,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../hooks/useLanguage";

export default function AdminSettings() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("parking"); // "parking" | "bookings" | "hardware" | "database"
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [testBarrierLoading, setTestBarrierLoading] = useState(false);

  // 1. General Parking Rules States
  const [lostTicketFee, setLostTicketFee] = useState("50000"); // VND
  const [overtimePenaltyRate, setOvertimePenaltyRate] = useState("10000"); // VND per hour
  const [maxSpeedLimit, setMaxSpeedLimit] = useState("5"); // km/h
  const [is247, setIs247] = useState(true);

  // 2. Booking Rules States
  const [holdWindow, setHoldWindow] = useState("15"); // minutes
  const [minBookingDuration, setMinBookingDuration] = useState("60"); // minutes
  const [advanceBookingLimitDays, setAdvanceBookingLimitDays] = useState("7"); // days

  // 3. Gate & Hardware Settings States
  const [autoLPR, setAutoLPR] = useState(true); // License Plate Recognition
  const [autoBarrierOpen, setAutoBarrierOpen] = useState(true); // Open gate automatically on valid ocr
  const [ocrSensitivity, setOcrSensitivity] = useState("HIGH"); // HIGH | MEDIUM | LOW

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(language === "en" ? "Settings saved successfully!" : "Đã lưu thiết lập thành công!");
    }, 1000);
  };

  const handleDatabaseBackup = () => {
    setBackupLoading(true);
    setTimeout(() => {
      setBackupLoading(false);
      
      const dummySql = `-- Smartpark Database Backup\n-- Created: ${new Date().toLocaleString()}\n-- Version: 1.0.0\n\nUPDATE SystemSettings SET LostTicketFee = ${lostTicketFee}, HoldWindow = ${holdWindow};\n`;
      const blob = new Blob([dummySql], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `smartpark_db_backup_${new Date().toISOString().slice(0, 10)}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(language === "en" ? "Database file downloaded!" : "Tải xuống bản sao lưu SQL thành công!");
    }, 1200);
  };

  const handleTestBarrier = () => {
    setTestBarrierLoading(true);
    setTimeout(() => {
      setTestBarrierLoading(false);
      toast.success(
        language === "en"
          ? "Gate 1 opened successfully for testing!"
          : "Cổng 1 đã được kích hoạt mở thành công để thử nghiệm!"
      );
    }, 1000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {language === "en" ? "Settings" : "Cấu Hình Hệ Thống"}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {language === "en"
              ? "Change prices, booking rules, gate cameras, and backup database."
              : "Cấu hình cước phí bãi xe, quy tắc đặt trước, cổng barrier tự động và sao lưu dữ liệu."}
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {language === "en" ? "Save Settings" : "Lưu Cấu Hình"}
        </button>
      </div>

      {/* FOUR TAB BUTTON BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            {
              id: "parking",
              label: language === "en" ? "Prices & Rules" : "Giá & Nội Quy",
              icon: <Sliders size={14} />
            },
            {
              id: "bookings",
              label: language === "en" ? "Booking Rules" : "Quy Tắc Đặt Chỗ",
              icon: <Clock size={14} />
            },
            {
              id: "hardware",
              label: language === "en" ? "Gates & Camera" : "Cổng & Camera",
              icon: <Camera size={14} />
            },
            {
              id: "database",
              label: language === "en" ? "Backup Data" : "Sao Lưu Dữ Liệu",
              icon: <Database size={14} />
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SETTINGS CARD FORM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-bold text-slate-700 dark:text-slate-350">
          
          {/* TAB 1: PARKING OPERATIONS RULES */}
          {activeTab === "parking" && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <Sliders size={16} className="text-blue-500" />
                {language === "en" ? "Prices & Rules" : "Giá & Nội Quy"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lost Ticket Fee */}
                <div>
                  <label className="block text-slate-450 dark:text-slate-500 mb-1.5 uppercase text-[10px] flex items-center gap-1">
                    {language === "en" ? "Lost Ticket Fee (VND)" : "Phí Mất Thẻ/Vé (VND)"}
                    <HelpCircle
                      size={12}
                      className="cursor-help"
                      title={
                        language === "en"
                          ? "Money charged when a customer loses their paper parking ticket."
                          : "Số tiền phạt thu khi khách hàng làm mất thẻ hoặc hóa đơn giấy gửi xe."
                      }
                    />
                  </label>
                  <input
                    type="number"
                    value={lostTicketFee}
                    onChange={(e) => setLostTicketFee(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1 font-mono">
                    {language === "en" ? "Fee" : "Cước phạt"}: {formatCurrency(lostTicketFee)}
                  </span>
                </div>

                {/* Overtime Penalty Surcharge */}
                <div>
                  <label className="block text-slate-450 dark:text-slate-500 mb-1.5 uppercase text-[10px] flex items-center gap-1">
                    {language === "en" ? "Late Fee (VND / Hour)" : "Phí Đỗ Quá Giờ (VND / Giờ)"}
                    <HelpCircle
                      size={12}
                      className="cursor-help"
                      title={
                        language === "en"
                          ? "Extra money charged per hour when a customer leaves late."
                          : "Tiền phạt tính thêm mỗi giờ khi khách hàng đỗ quá thời gian đặt chỗ."
                      }
                    />
                  </label>
                  <input
                    type="number"
                    value={overtimePenaltyRate}
                    onChange={(e) => setOvertimePenaltyRate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1 font-mono">
                    {language === "en" ? "Fee" : "Cước"}: {formatCurrency(overtimePenaltyRate)} / hour
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Speed Limit */}
                <div>
                  <label className="block text-slate-450 dark:text-slate-500 mb-1.5 uppercase text-[10px] flex items-center gap-1">
                    {language === "en" ? "Max Speed Limit (km/h)" : "Tốc Độ Tối Đa (km/h)"}
                    <HelpCircle
                      size={12}
                      className="cursor-help"
                      title={
                        language === "en"
                          ? "Speed limit for cars inside the parking lot."
                          : "Giới hạn tốc độ khuyến nghị trong khuôn viên bãi đỗ vì an toàn."
                      }
                    />
                  </label>
                  <input
                    type="number"
                    value={maxSpeedLimit}
                    onChange={(e) => setMaxSpeedLimit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                {/* 24/7 Hours Switch */}
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={is247}
                      onChange={(e) => setIs247(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded bg-slate-100 border-slate-300 focus:ring-blue-500 focus:ring-2 dark:bg-slate-800 dark:border-slate-700"
                    />
                    <span>{language === "en" ? "Open 24/7" : "Hoạt Động 24/7"}</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    {language === "en"
                      ? "If turned off, the parking lot closes at 23:00 (11 PM)."
                      : "Nếu tắt, bãi xe sẽ đóng cổng và không nhận xe mới sau 23:00."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKING RULES */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                {language === "en" ? "Booking Rules" : "Quy Tắc Đặt Chỗ"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Booking Hold Window */}
                <div>
                  <label className="block text-slate-450 dark:text-slate-500 mb-1.5 uppercase text-[10px] flex items-center gap-1">
                    {language === "en" ? "Hold Time (Minutes)" : "Thời Gian Giữ Chỗ (Phút)"}
                    <HelpCircle
                      size={12}
                      className="cursor-help"
                      title={
                        language === "en"
                          ? "How many minutes to keep the space open before canceling if the car is late."
                          : "Thời gian giữ chỗ trống trước khi tự động hủy nếu xe chưa check-in bãi."
                      }
                    />
                  </label>
                  <input
                    type="number"
                    value={holdWindow}
                    onChange={(e) => setHoldWindow(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    {language === "en" ? "Default" : "Mặc định"}: 15 minutes.
                  </span>
                </div>

                {/* Minimum booking duration */}
                <div>
                  <label className="block text-slate-450 dark:text-slate-500 mb-1.5 uppercase text-[10px] flex items-center gap-1">
                    {language === "en" ? "Min Booking Time (Minutes)" : "Thời Gian Đặt Tối Thiểu (Phút)"}
                    <HelpCircle
                      size={12}
                      className="cursor-help"
                      title={
                        language === "en"
                          ? "Shortest time a customer can book (default: 60 minutes)."
                          : "Thời gian đặt đỗ xe tối thiểu khi người dùng đặt chỗ qua ứng dụng."
                      }
                    />
                  </label>
                  <input
                    type="number"
                    value={minBookingDuration}
                    onChange={(e) => setMinBookingDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    {language === "en" ? "Default" : "Mặc định"}: 60 minutes (1 hour).
                  </span>
                </div>
              </div>

              {/* Advance Booking Limit */}
              <div>
                <label className="block text-slate-450 dark:text-slate-500 mb-1.5 uppercase text-[10px] flex items-center gap-1">
                  {language === "en" ? "Book Ahead Limit (Days)" : "Giới Hạn Đặt Trước (Ngày)"}
                  <HelpCircle
                    size={12}
                    className="cursor-help"
                    title={
                      language === "en"
                        ? "How many days in advance a customer can book a slot (default: 7 days)."
                        : "Thời hạn tối đa mà khách hàng có thể lên lịch đặt chỗ trước."
                    }
                  />
                </label>
                <input
                  type="number"
                  value={advanceBookingLimitDays}
                  onChange={(e) => setAdvanceBookingLimitDays(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  {language === "en" ? "Default" : "Mặc định"}: 7 days ahead.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: GATE CONTROL & HARDWARE */}
          {activeTab === "hardware" && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <Camera size={16} className="text-blue-500" />
                {language === "en" ? "Gate Cameras & Barrier" : "Cổng & Camera"}
              </h3>

              <div className="space-y-3">
                {/* Auto License Plate Recognition */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-850/45 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoLPR}
                    onChange={(e) => setAutoLPR(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-100 border-slate-300 mt-0.5 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-white">
                      {language === "en" ? "Scan License Plate" : "Tự Động Quét Biển Số"}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium leading-normal mt-0.5">
                      {language === "en"
                        ? "Use gate cameras to scan license plates. If turned off, staff must type plates."
                        : "Sử dụng camera LPR nhận diện biển số xe khi vào. Nếu tắt, nhân viên phải nhập tay."}
                    </span>
                  </div>
                </label>

                {/* Auto Barrier Open */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-850/45 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBarrierOpen}
                    onChange={(e) => setAutoBarrierOpen(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-100 border-slate-300 mt-0.5 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-white">
                      {language === "en" ? "Open Gate Automatically" : "Tự Động Mở Barrier"}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium leading-normal mt-0.5">
                      {language === "en"
                        ? "Open the gate barrier when the license plate matches."
                        : "Tự động nâng thanh chắn barrier khi biển số xe quét khớp với thông tin hợp lệ."}
                    </span>
                  </div>
                </label>

                {/* OCR Camera Sensitivity */}
                <div className="p-3 bg-slate-50 dark:bg-slate-850/45 rounded-xl border border-slate-100 dark:border-slate-800">
                  <label className="block text-slate-800 dark:text-white text-xs font-bold mb-1.5">
                    {language === "en" ? "Camera Scanning Speed/Sensitivity" : "Độ Nhạy Quét LPR Camera"}
                  </label>
                  <select
                    value={ocrSensitivity}
                    onChange={(e) => setOcrSensitivity(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    <option value="HIGH">
                      {language === "en" ? "High (Fast & Strict)" : "Cao (Nhanh & Nghiêm ngặt)"}
                    </option>
                    <option value="MEDIUM">
                      {language === "en" ? "Medium (Recommended)" : "Trung bình (Khuyến nghị)"}
                    </option>
                    <option value="LOW">
                      {language === "en" ? "Low (Allow plate dirt or glare)" : "Thấp (Cho phép biển bẩn hoặc phản quang)"}
                    </option>
                  </select>
                </div>

                {/* Gate Barrier Hardware Test Trigger */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850/45 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-800 dark:text-white">
                      {language === "en" ? "Test Gate Barrier" : "Thử Nghiên Nâng Barrier"}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium leading-normal">
                      {language === "en"
                        ? "Test opening Gate 1 barrier arm."
                        : "Gửi tín hiệu kiểm tra thử nghiệm nâng thanh chắn barrier tại Cổng 1."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestBarrier}
                    disabled={testBarrierLoading}
                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                  >
                    {testBarrierLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    {language === "en" ? "Open Gate 1 (Test)" : "Mở Cổng 1 (Test)"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE & LOGS */}
          {activeTab === "database" && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <Database size={16} className="text-blue-500" />
                {language === "en" ? "Backup Database" : "Sao Lưu Dữ Liệu"}
              </h3>

              <div className="p-4 bg-slate-50 dark:bg-slate-850/45 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5 max-w-[75%]">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white">
                    {language === "en" ? "Save Database SQL file" : "Xuất Bản Sao Lưu Dữ Liệu SQL"}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium leading-normal">
                    {language === "en"
                      ? "Download a file to backup all users, bookings, and payments."
                      : "Tải xuống tệp SQL dump chứa toàn bộ tài khoản, phiên đỗ và lịch sử giao dịch."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDatabaseBackup}
                  disabled={backupLoading}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold uppercase px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {backupLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  {language === "en" ? "Download File" : "Tải Xuống SQL"}
                </button>
              </div>
            </div>
          )}

          {/* SUBMIT CONFIGURATION BUTTON */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 uppercase tracking-wide"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {language === "en" ? "Save Settings" : "Lưu Thiết Lập"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
