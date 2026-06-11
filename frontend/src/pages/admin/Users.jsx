import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  UserPlus,
  Ban,
  CheckCircle,
  ShieldCheck,
  MoreVertical,
  X,
  UserCheck,
  Trash2,
  Mail,
  Phone,
  ShieldAlert,
  Loader2,
  Key
} from "lucide-react";
import api from "../../utils/api";
import { toast } from "sonner";

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  
  // Modal configurations
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Form States
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("ParkingStaff");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit Role state
  const [targetRoleId, setTargetRoleId] = useState("");

  // Delete User modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Dropdown states
  const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);

  // Initial mockup to populate immediately if backend table is empty or server offline
  const mockUsers = [
    {
      userId: "usr_2606071000",
      username: "admin_pms",
      fullName: "System Administrator",
      email: "admin@smartpark.com",
      phone: "0901234567",
      role: "SystemAdmin",
      roleId: 1,
      status: "ACTIVE",
      lastLogin: "2026-06-07T03:30:00Z",
      createdAt: "2026-05-01T00:00:00Z",
    },
    {
      userId: "usr_2606071001",
      username: "mgr_phamviet",
      fullName: "Pham Viet",
      email: "viet.pham@smartpark.com",
      phone: "0907654321",
      role: "ParkingManager",
      roleId: 2,
      status: "ACTIVE",
      lastLogin: "2026-06-07T02:15:00Z",
      createdAt: "2026-05-10T08:00:00Z",
    },
    {
      userId: "usr_2606071002",
      username: "staff_nguyenvan",
      fullName: "Nguyen Van Gate Staff",
      email: "van.nguyen@smartpark.com",
      phone: "0911223344",
      role: "ParkingStaff",
      roleId: 3,
      status: "ACTIVE",
      lastLogin: "2026-06-07T04:00:00Z",
      createdAt: "2026-05-15T09:30:00Z",
    },
    {
      userId: "usr_2606071003",
      username: "driver_bka",
      fullName: "BKA Driver Client",
      email: "driver.bka@gmail.com",
      phone: "0988776655",
      role: "ParkingUser",
      roleId: 4,
      status: "BANNED",
      lastLogin: "2026-06-05T12:00:00Z",
      createdAt: "2026-05-20T10:45:00Z",
    },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/admin/users", {
        params: {
          search,
          role: selectedRole,
          status: selectedStatus,
        },
      });
      if (response.data && response.data.success) {
        setUsersList(response.data.data);
      } else {
        setUsersList(mockUsers);
      }
    } catch (err) {
      console.warn("[Admin Users Fetch Fallback]: Using pre-populated SaaS users database.");
      setUsersList(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedStatus]);

  // Filtered Users List calculation (fallback/client-side safety)
  const filteredUsers = usersList.filter((user) => {
    const fullName = user.fullName || user.full_name || "";
    const username = user.username || "";
    const email = user.email || "";
    const phone = user.phone || "";

    const matchesSearch =
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      username.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);

    const matchesRole =
      selectedRole === "ALL" || user.role === selectedRole;

    const matchesStatus =
      selectedStatus === "ALL" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Toggle user active / banned status
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "BANNED" ? "ACTIVE" : "BANNED";
    const uId = user.user_id || user.userId;
    const uName = user.fullName || user.full_name || user.username;
    
    // Update local state immediately for snappy responsive feel
    setUsersList((prev) =>
      prev.map((u) => ((u.user_id || u.userId) === uId ? { ...u, status: newStatus } : u))
    );

    try {
      await api.put(`/auth/admin/users/${uId}/status`, { status: newStatus });
      toast.success(`User "${uName}" is now ${newStatus.toLowerCase()}.`);
    } catch (err) {
      console.error("Failed to update status on server:", err);
      // Revert on error
      setUsersList((prev) =>
        prev.map((u) => ((u.user_id || u.userId) === uId ? { ...u, status: user.status } : u))
      );
      toast.error(`Failed to update status for "${uName}".`);
    }
  };

  // Change user role
  const handleUpdateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const roleMap = {
      1: "SystemAdmin",
      2: "ParkingManager",
      3: "ParkingStaff",
      4: "ParkingUser",
    };

    const newRoleId = Number(targetRoleId);
    const newRoleName = roleMap[newRoleId];
    const uId = selectedUser.user_id || selectedUser.userId;
    const uName = selectedUser.fullName || selectedUser.full_name || selectedUser.username;
    const prevRole = selectedUser.role;
    const prevRoleId = selectedUser.roleId || selectedUser.role_id;

    // Optimistic update for snappy UI
    setUsersList((prev) =>
      prev.map((u) =>
        (u.user_id || u.userId) === uId
          ? { ...u, role: newRoleName, roleId: newRoleId, role_id: newRoleId }
          : u
      )
    );
    setIsEditRoleOpen(false);

    try {
      await api.put(`/auth/admin/users/${uId}/role`, { role_id: newRoleId });
      toast.success(`Successfully assigned role to "${uName}".`);
    } catch (err) {
      console.error("[Role Update Failed]:", err);
      // Revert optimistic update on failure
      setUsersList((prev) =>
        prev.map((u) =>
          (u.user_id || u.userId) === uId
            ? { ...u, role: prevRole, roleId: prevRoleId, role_id: prevRoleId }
            : u
        )
      );
      const status = err?.status || err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Unknown error";

      if (status === 401) {
        toast.error("Session expired. Please log out and log in again.");
      } else if (status === 403) {
        toast.error("Access denied. Only SystemAdmin can change roles.");
      } else if (err?.success === false && err?.message) {
        // Handle unwrapped server response error
        toast.error(`Server Error: ${err.message}`);
      } else if (!status || status === 0) {
        toast.error("Cannot reach server. Make sure backend is running on port 5077.");
      } else {
        toast.error(`Failed to update role: ${msg}`);
      }
    }
  };

  // Handle Delete Confirmation from Modal
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const uId = userToDelete.user_id || userToDelete.userId;
    const uName = userToDelete.fullName || userToDelete.full_name || userToDelete.username;

    try {
      setDeleting(true);
      const response = await api.delete(`/auth/admin/users/${uId}`);
      if (response.data && response.data.success) {
        // Remove from list
        setUsersList((prev) => prev.filter((u) => (u.user_id || u.userId) !== uId));
        toast.success(`User "${uName}" deleted successfully!`);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      console.error("[User Delete Failed]:", err);
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      toast.error(`Failed to delete user: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };


  // Add User handler (Creating Managers/Staff directly)
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newUsername || !newFullName || !newEmail || !newPhone || !newPassword) {
      setFormError("Please fill out all required fields.");
      return;
    }

    try {
      let response;
      if (newRole === "ParkingStaff") {
        response = await api.post("/manager/staff", {
          username: newUsername,
          fullName: newFullName,
          email: newEmail,
          phoneNumber: newPhone,
          password: newPassword,
          confirmPassword: newPassword,
        });
      }

      setFormSuccess("Account created successfully!");
      
      // Reload from server after creation
      fetchUsers();

      // Reset fields
      setNewUsername("");
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess("");
      }, 1000);

    } catch (err) {
      console.error(err);
      setFormError(err?.message || "Failed to create user. Verify field constraints.");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SystemAdmin":
        return "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30";
      case "ParkingManager":
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
      case "ParkingStaff":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30";
    }
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-12">
      {/* HEADER PARTITION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Accounts & Roles
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Browse registered system accounts, assign core administrative permissions, or lock access.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 text-white"
        >
          <UserPlus size={16} />
          Create Staff/Manager
        </button>
      </div>

      {/* FILTERING BAR WITH SEARCH */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* Role Filters */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {["ALL", "SystemAdmin", "ParkingManager", "ParkingStaff", "ParkingUser"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${
                    selectedRole === role
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
              >
                {role === "ALL" ? "ALL ROLES" : role.replace("Parking", "").replace("System", "")}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {["ALL", "ACTIVE", "BANNED"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${
                    selectedStatus === status
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DENSE DATA TABLE */}
      {loading ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-xs text-slate-450">Loading user database...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">System Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Last Activity</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No accounts found matching filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const uId = user.user_id || user.userId;
                    const uFullName = user.fullName || user.full_name || "";
                    const uLastLogin = user.lastLogin || user.last_login;
                    const uRoleId = user.roleId || user.role_id || 4;

                    return (
                      <tr key={uId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {/* User Info details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 uppercase text-xs shadow-sm">
                              {uFullName ? uFullName[0] : user.username ? user.username[0] : "U"}
                            </div>
                            <div>
                              <strong className="block text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {uFullName || "Unconfigured Profile"}
                              </strong>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold font-mono mt-0.5 block">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Channels */}
                        <td className="py-3 px-4 space-y-1 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400 shrink-0" />
                            <span>{user.email || "No Email"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            <span className="font-mono">{user.phone || "No Phone"}</span>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Status switch */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {user.status}
                          </span>
                        </td>

                        {/* Last Login timestamps */}
                        <td className="py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {uLastLogin ? new Date(uLastLogin).toLocaleString() : "Never logged in"}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center items-center">
                            {user.role === "SystemAdmin" || uRoleId === 1 ? (
                              <span className="text-slate-400 dark:text-slate-600 font-bold text-[10px] tracking-wider uppercase inline-flex items-center justify-center gap-1 select-none py-2 bg-slate-50 dark:bg-slate-800/40 px-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                                <ShieldCheck size={13} className="text-purple-500" /> Locked
                              </span>
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={() => setActiveDropdownUserId(activeDropdownUserId === uId ? null : uId)}
                                  className="p-2 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                                  title="Actions"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {activeDropdownUserId === uId && (
                                  <>
                                    {/* Backdrop transparent click catcher */}
                                    <div 
                                      className="fixed inset-0 z-40 bg-transparent" 
                                      onClick={() => setActiveDropdownUserId(null)} 
                                    />
                                    
                                    {/* Dropdown Menu Panel */}
                                    <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 animate-slide-up-dense">
                                      {/* Action 1: Edit Role */}
                                      <button
                                        onClick={() => {
                                          setActiveDropdownUserId(null);
                                          setSelectedUser(user);
                                          setTargetRoleId(String(uRoleId));
                                          setIsEditRoleOpen(true);
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 transition-colors font-medium text-xs"
                                      >
                                        <Key size={14} className="text-blue-500 shrink-0" />
                                        <span>Assign Role</span>
                                      </button>

                                      {/* Action 2: Change Status */}
                                      <button
                                        onClick={() => {
                                          setActiveDropdownUserId(null);
                                          handleToggleStatus(user);
                                        }}
                                        className={`w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors font-medium text-xs
                                          ${
                                            user.status === "BANNED"
                                              ? "text-emerald-600 hover:text-emerald-500"
                                              : "text-amber-600 hover:text-amber-500"
                                          }`}
                                      >
                                        {user.status === "BANNED" ? (
                                          <>
                                            <UserCheck size={14} className="text-emerald-500 shrink-0" />
                                            <span>Activate User</span>
                                          </>
                                        ) : (
                                          <>
                                            <Ban size={14} className="text-amber-500 shrink-0" />
                                            <span>Suspend User</span>
                                          </>
                                        )}
                                      </button>

                                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                                      {/* Action 3: Delete (Dangerous) */}
                                      <button
                                        onClick={() => {
                                          setActiveDropdownUserId(null);
                                          setUserToDelete(user);
                                          setIsDeleteModalOpen(true);
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-500 flex items-center gap-2.5 transition-colors font-semibold text-xs"
                                      >
                                        <Trash2 size={14} className="text-red-600 dark:text-red-500 shrink-0" />
                                        <span>Delete Account</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: EDIT USER ROLE */}
      {isEditRoleOpen && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsEditRoleOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-300">
            <button
              onClick={() => setIsEditRoleOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                Assign System Role
              </h3>
            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
              Modifying roles alters permission boundaries. User: <strong className="text-slate-800 dark:text-white">@{selectedUser.username}</strong>
            </p>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">Select Role Grade</label>
                <select
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none text-xs"
                >
                  <option value="2">Parking Manager (Facility Manager)</option>
                  <option value="3">Parking Staff (Gate Attendant / Staff)</option>
                  <option value="4">Parking User (Regular Customer Driver)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-xs uppercase tracking-wider py-2.5 rounded-xl font-bold mt-2 text-white transition-all hover:scale-[1.01] active:scale-95 shadow-sm">
                Apply Role Change
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* POPUP MODAL 2: CREATE STAFF / ADMIN ACCOUNT */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-300">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <UserPlus size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                Create System Account
              </h3>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-red-600 text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 text-xs font-semibold rounded-xl">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. staff_nam"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Nguyen Hoang Nam"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@smartpark.com"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="090XXXXXXX"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                  >
                    <option value="ParkingStaff">ParkingStaff (Staff)</option>
                    <option value="ParkingManager">ParkingManager (Manager)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-wider py-3 rounded-xl text-white shadow-md transition-all hover:scale-[1.01] active:scale-95 mt-4">
                Register Account
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* POPUP MODAL 3: CONFIRM DELETE USER */}
      {isDeleteModalOpen && userToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity" 
            onClick={() => {
              if (!deleting) {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
              }
            }} 
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-350 transform scale-100 transition-transform">
            <button
              disabled={deleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 disabled:opacity-50 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 rounded-xl">
                <ShieldAlert size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Permanently Delete User
                </h3>
                <p className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">
                  Critical Security Action
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50/50 dark:bg-red-955/10 border border-red-100 dark:border-red-900/40 p-3.5 rounded-xl">
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-semibold">
                  Warning: You are about to permanently delete the user account for{" "}
                  <span className="font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                    @{userToDelete.username}
                  </span>{" "}
                  ({userToDelete.fullName || userToDelete.full_name || "Unconfigured Name"}).
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  This action will delete user credentials and profile records. If this user has active system dependencies (like bookings or transactions), the database will reject the deletion to preserve audit history.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
