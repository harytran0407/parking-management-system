import React, { useState } from "react";
import {
  Settings,
  Key,
  ShieldAlert,
  Database,
  Save,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("credentials"); // "credentials" | "operations" | "database"
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Form states - Credentials
  const [jwtSecret, setJwtSecret] = useState("ParkingManagement_Super_Secret_Key_2026");
  const [jwtExpiry, setJwtExpiry] = useState("3600");
  const [recaptchaKey, setRecaptchaKey] = useState("6LduaggtAAAAANjcXXh16KCToEaBCvrXdj5IWWoY");
  const [googleClientId, setGoogleClientId] = useState("1234567890-googleclientid.apps.googleusercontent.com");

  // Form states - Operations
  const [holdWindow, setHoldWindow] = useState("15");
  const [penaltyFee, setPenaltyFee] = useState("50000");
  const [maxSpeed, setMaxSpeed] = useState("5");
  const [is247, setIs247] = useState(true);

  // Form states - Logs / DB
  const [logLevel, setLogLevel] = useState("INFO");

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("System parameters synchronized successfully!");
    }, 1200);
  };

  const handleDatabaseBackup = () => {
    setBackupLoading(true);
    setTimeout(() => {
      setBackupLoading(false);
      
      // Mock SQL Backup file download trigger
      const dummySql = "-- PBMS Database Backup Dump\n-- Created: " + new Date().toLocaleString() + "\nINSERT INTO ROLE (ROLE_NAME) VALUES ('SystemAdmin');\n";
      const blob = new Blob([dummySql], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `pbms_database_backup_${new Date().toISOString().slice(0,10)}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Database backup SQL dump exported!");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            System Configuration
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Configure global API keys, security attributes, standard penalty fees, and backup hooks.
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
          Apply Changes
        </button>
      </div>

      {/* THREE COLUMN TAB BUTTON BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("credentials")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2
              ${
                activeTab === "credentials"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <Key size={14} />
            Credentials
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2
              ${
                activeTab === "operations"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <Sliders size={14} />
            Operations
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2
              ${
                activeTab === "database"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <Database size={14} />
            Database & Logs
          </button>
        </div>
      </div>

      {/* SYSTEM CONFIGURATION FORMS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-bold">
          
          {/* TAB 1: SYSTEM CREDENTIALS */}
          {activeTab === "credentials" && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">JWT Encryption Secret Key</label>
                <input
                  type="password"
                  value={jwtSecret}
                  onChange={(e) => setJwtSecret(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Used to sign API response Bearer tokens. Keep secure in production environments.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Token Lifespan (seconds)</label>
                  <input
                    type="number"
                    value={jwtExpiry}
                    onChange={(e) => setJwtExpiry(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Google Client ID</label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Google reCAPTCHA v2 Site Key</label>
                <input
                  type="text"
                  value={recaptchaKey}
                  onChange={(e) => setRecaptchaKey(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none font-mono text-[10px]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONAL BOUNDS */}
          {activeTab === "operations" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Booking Expiration Hold (Minutes)</label>
                  <input
                    type="number"
                    value={holdWindow}
                    onChange={(e) => setHoldWindow(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Default: 15 minutes.</span>
                </div>
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Lost Ticket Surcharge Settle Fee (VND)</label>
                  <input
                    type="number"
                    value={penaltyFee}
                    onChange={(e) => setPenaltyFee(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Default penalty fine amount.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Max Facility Speed Limit (km/h)</label>
                  <input
                    type="number"
                    value={maxSpeed}
                    onChange={(e) => setMaxSpeed(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-3 text-slate-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={is247}
                      onChange={(e) => setIs247(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded bg-slate-100 border-slate-300 focus:ring-blue-500 focus:ring-2 dark:bg-slate-800 dark:border-slate-700"
                    />
                    <span>Enable 24/7 Operations</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE MAINTENANCE */}
          {activeTab === "database" && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-800 dark:text-white">Database Backup & Recovery</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">Download current database snapshot as standard SQL file.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDatabaseBackup}
                  disabled={backupLoading}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold uppercase px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  {backupLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  Export Dump
                </button>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px]">Audit Log Tracking Level</label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="DEBUG">DEBUG (All server payload details)</option>
                  <option value="INFO">INFO (General traffic operations and actions)</option>
                  <option value="WARN">WARN (Only error warnings and auth failures)</option>
                  <option value="ERROR">ERROR (Severe crashes only)</option>
                </select>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 uppercase tracking-wide"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Save Configuration
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
