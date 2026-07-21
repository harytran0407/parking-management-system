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
import { useLanguage } from "../../hooks/useLanguage";

export default function AdminUsers() {
  const { language } = useLanguage();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal configurations
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Form States
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("ParkingStaff");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [addFieldErrors, setAddFieldErrors] = useState({});

  // Edit Role state
  const [targetRoleId, setTargetRoleId] = useState("");

  // Delete User modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users", {
        params: {
          search,
          role: selectedRole,
          status: selectedStatus,
          page: currentPage,
          page_size: pageSize,
        },
      });
      if (response.data && response.data.success) {
        const data = response.data.data;
        if (data && Array.isArray(data.items)) {
          setUsersList(data.items);
          setTotalPages(data.pagination?.total_pages || 1);
          setTotalItems(data.pagination?.total_items || 0);
        } else if (Array.isArray(data)) {
          setUsersList(data);
          setTotalPages(1);
          setTotalItems(data.length);
        } else {
          setUsersList([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } else {
        setUsersList([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error("Failed to fetch users from server:", err);
      setUsersList([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedStatus, currentPage, pageSize]);

  // Filtered Users List calculation (fallback/client-side safety)
  const filteredUsers = Array.isArray(usersList) ? usersList.filter((user) => {
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
  }) : [];

  // Trigger status toggle confirm modal
  const handleToggleStatus = (user) => {
    setUserToToggleStatus(user);
    setIsStatusModalOpen(true);
  };

  // Toggle user active / banned status from Modal
  const handleConfirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    const newStatus = userToToggleStatus.status === "BANNED" ? "ACTIVE" : "BANNED";
    const uId = userToToggleStatus.user_id || userToToggleStatus.userId;
    const uName = userToToggleStatus.fullName || userToToggleStatus.full_name || userToToggleStatus.username;

    try {
      setTogglingStatus(true);
      const response = await api.put(`/admin/users/${uId}/status`, { status: newStatus });
      if (response.data && response.data.success) {
        setUsersList((prev) =>
          prev.map((u) => ((u.user_id || u.userId) === uId ? { ...u, status: newStatus } : u))
        );
        if (language === "en") {
          toast.success(`User "${uName}" is now ${newStatus === "ACTIVE" ? "active" : "banned"}.`);
        } else {
          toast.success(`Người dùng "${uName}" hiện đã ${newStatus === "ACTIVE" ? "hoạt động" : "bị khóa"}.`);
        }
        setIsStatusModalOpen(false);
        setUserToToggleStatus(null);
      }
    } catch (err) {
      console.error("[User Status Toggle Failed]:", err);
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      if (language === "en") {
        toast.error(`Failed to update status for "${uName}": ${msg}`);
      } else {
        toast.error(`Cập nhật trạng thái cho "${uName}" thất bại: ${msg}`);
      }
    } finally {
      setTogglingStatus(false);
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
      await api.put(`/admin/users/${uId}/role`, { role_id: newRoleId });
      if (language === "en") {
        toast.success(`Successfully assigned role to "${uName}".`);
      } else {
        toast.success(`Đã gán vai trò mới cho "${uName}" thành công.`);
      }
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
        if (language === "en") {
          toast.error("Session expired. Please log out and log in again.");
        } else {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.");
        }
      } else if (status === 403) {
        if (language === "en") {
          toast.error("Access denied. Only SystemAdmin can change roles.");
        } else {
          toast.error("Từ chối truy cập. Chỉ Quản trị viên mới được thay đổi vai trò.");
        }
      } else if (err?.success === false && err?.message) {
        toast.error(language === "en" ? `Server Error: ${err.message}` : `Lỗi Máy chủ: ${err.message}`);
      } else if (!status || status === 0) {
        if (language === "en") {
          toast.error("Cannot reach server. Make sure backend is running on port 8080.");
        } else {
          toast.error("Không thể kết nối đến máy chủ. Hãy đảm bảo backend đang chạy tại cổng 8080.");
        }
      } else {
        toast.error(language === "en" ? `Failed to update role: ${msg}` : `Cập nhật vai trò thất bại: ${msg}`);
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
      const response = await api.delete(`/admin/users/${uId}`);
      if (response.data && response.data.success) {
        // Remove from list
        setUsersList((prev) => prev.filter((u) => (u.user_id || u.userId) !== uId));
        if (language === "en") {
          toast.success(`User "${uName}" deleted successfully!`);
        } else {
          toast.success(`Đã xóa người dùng "${uName}" thành công!`);
        }
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      console.error("[User Delete Failed]:", err);
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      if (language === "en") {
        toast.error(`Failed to delete user: ${msg}`);
      } else {
        toast.error(`Xóa người dùng thất bại: ${msg}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Add User handler (Creating Managers/Staff directly)
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setAddFieldErrors({});

    if (!newFullName || !newEmail || !newPhone || !newPassword) {
      setFormError(language === "en" ? "Please fill out all required fields." : "Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    // Same validation rules as the public user registration form (Register.jsx)
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com)$/i;
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const errors = {};
    if (!nameRegex.test(newFullName)) {
      errors.fullName = language === "en"
        ? "Full name must be 2–100 characters and contain only letters."
        : "Họ và tên phải từ 2–100 ký tự và chỉ chứa chữ cái.";
    }
    if (!emailRegex.test(newEmail)) {
      errors.email = language === "en" ? 'Invalid email address (xxxxxxgmail.com).' : 'Địa chỉ email không hợp lệ (xxxxxxgmail.com).';
    }
    if (!phoneRegex.test(newPhone)) {
      errors.phone = language === "en"
        ? "Invalid phone number (must start with 0 and have 10 digits, e.g. 0901234567)."
        : "Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10 chữ số, ví dụ: 0901234567).";
    }
    if (!passwordRegex.test(newPassword)) {
      errors.password = language === "en"
        ? "Password must be 8+ characters, with uppercase, lowercase, numbers, and special characters."
        : "Mật khẩu phải từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }

    if (Object.keys(errors).length > 0) {
      setAddFieldErrors(errors);
      setFormError(language === "en" ? "Please fix the highlighted fields." : "Vui lòng kiểm tra lại các trường được đánh dấu.");
      return;
    }

    try {
      const emailPrefix = newEmail.split("@")[0];
      const generatedUsername = emailPrefix + "_" + Math.random().toString(36).substring(2, 6);
      const generatedUserId = "usr_" + Date.now() + Math.random().toString(36).substring(2, 6);

      const response = await api.post("/admin/users", {
        user_id: generatedUserId,
        username: generatedUsername,
        full_name: newFullName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        role: newRole,
      });

      setFormSuccess(language === "en" ? "Account created successfully!" : "Tạo tài khoản thành công!");

      // Reload from server after creation
      fetchUsers();

      // Reset fields
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setAddFieldErrors({});

      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess("");
      }, 1000);

    } catch (err) {
      console.error(err);
      let errMsg = language === "en" ? "Failed to create user. Verify field constraints." : "Tạo người dùng thất bại. Vui lòng kiểm tra các ràng buộc.";

      // Extract detailed validation errors from ASP.NET Core ModelState
      if (err.errors) {
        errMsg = Object.values(err.errors).flat().join(" ");
      } else if (err.response?.data?.errors) {
        errMsg = Object.values(err.response.data.errors).flat().join(" ");
      } else if (err.message) {
        errMsg = err.message;
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setFormError(errMsg);
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

  const getRoleLabel = (role) => {
    switch (role) {
      case "SystemAdmin":
        return language === "en" ? "System Admin" : "Quản trị viên";
      case "ParkingManager":
        return language === "en" ? "Manager" : "Quản lý";
      case "ParkingStaff":
        return language === "en" ? "Staff" : "Nhân viên";
      case "ParkingUser":
        return language === "en" ? "User" : "Khách hàng";
      default:
        return role;
    }
  };

  const getRoleFilterLabel = (role) => {
    if (role === "ALL") {
      return language === "en" ? "ALL ROLES" : "TẤT CẢ VAI TRÒ";
    }
    switch (role) {
      case "SystemAdmin":
        return language === "en" ? "Admin" : "Admin";
      case "ParkingManager":
        return language === "en" ? "Manager" : "Quản lý";
      case "ParkingStaff":
        return language === "en" ? "Staff" : "Nhân viên";
      case "ParkingUser":
        return language === "en" ? "User" : "Khách hàng";
      default:
        return role;
    }
  };

  const getStatusFilterLabel = (status) => {
    if (status === "ALL") {
      return language === "en" ? "ALL" : "TẤT CẢ";
    }
    if (status === "ACTIVE") {
      return language === "en" ? "ACTIVE" : "HOẠT ĐỘNG";
    }
    if (status === "BANNED") {
      return language === "en" ? "BANNED" : "ĐÃ KHÓA";
    }
    return status;
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-12">
      {/* HEADER PARTITION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === "en" ? "User Accounts & Roles" : "Tài khoản & Vai trò"}
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            {language === "en"
              ? "Manage user accounts, assign roles, and control access permissions."
              : "Xem các tài khoản đã đăng ký, phân quyền quản trị , hoặc khóa quyền truy cập."}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 text-white"
        >
          <UserPlus size={16} />
          {language === "en" ? "Create Staff/Manager" : "Tạo Nhân viên/Quản lý"}
        </button>
      </div>

      {/* FILTERING BAR WITH SEARCH */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === "en" ? "Search by name, email, phone..." : "Tìm kiếm theo tên, email, số điện thoại..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto max-w-full">
          {/* Role Filters - Desktop (Tabs) */}
          <div className="hidden sm:flex overflow-x-auto max-w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl no-scrollbar whitespace-nowrap">
            {["ALL", "SystemAdmin", "ParkingManager", "ParkingStaff", "ParkingUser"].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0
                  ${selectedRole === role
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
              >
                {getRoleFilterLabel(role)}
              </button>
            ))}
          </div>

          {/* Role Filters - Mobile (Dropdown) */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="block sm:hidden w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer uppercase tracking-wider"
          >
            {["ALL", "SystemAdmin", "ParkingManager", "ParkingStaff", "ParkingUser"].map((role) => (
              <option key={role} value={role} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {getRoleFilterLabel(role)}
              </option>
            ))}
          </select>

          {/* Status filter - Desktop (Tabs) */}
          <div className="hidden sm:flex overflow-x-auto max-w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl no-scrollbar whitespace-nowrap">
            {["ALL", "ACTIVE", "BANNED"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0
                  ${selectedStatus === status
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
              >
                {getStatusFilterLabel(status)}
              </button>
            ))}
          </div>

          {/* Status filter - Mobile (Dropdown) */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="block sm:hidden w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer uppercase tracking-wider"
          >
            {["ALL", "ACTIVE", "BANNED"].map((status) => (
              <option key={status} value={status} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {getStatusFilterLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DENSE DATA TABLE */}
      {loading ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-xs text-slate-450">
            {language === "en" ? "Loading user database..." : "Đang tải dữ liệu người dùng..."}
          </span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                  <th className="py-3 px-4">{language === "en" ? "User Details" : "Thông tin Người dùng"}</th>
                  <th className="py-3 px-4">{language === "en" ? "Contact Info" : "Thông tin Liên hệ"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "System Role" : "Vai trò Hệ thống"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Status" : "Trạng thái"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Last Activity" : "Hoạt động Cuối"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Actions" : "Hành động"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      {language === "en" ? "No accounts found matching filter parameters." : "Không tìm thấy tài khoản nào khớp với bộ lọc."}
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 uppercase text-xs shadow-sm overflow-hidden">
                              {user.avatar_url ? (
                                <img
                                  src={
                                    user.avatar_url.startsWith("http://") || user.avatar_url.startsWith("https://")
                                      ? user.avatar_url
                                      : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace("/api/v1", "")}${user.avatar_url}`
                                  }
                                  alt={uFullName || user.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                uFullName ? uFullName[0] : user.username ? user.username[0] : "U"
                              )}
                            </div>
                            <div>
                              <strong className="block text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {uFullName || (language === "en" ? "Unconfigured Profile" : "Hồ sơ Chưa cấu hình")}
                              </strong>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold font-sans mt-0.5 block">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Channels */}
                        <td className="py-3 px-4 space-y-1 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400 shrink-0" />
                            <span>{user.email || (language === "en" ? "No Email" : "Không có Email")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            <span className="font-sans">{user.phone || (language === "en" ? "No Phone" : "Không có SĐT")}</span>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        {/* Status switch */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${user.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900/30"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {user.status === "ACTIVE"
                              ? (language === "en" ? "ACTIVE" : "HOẠT ĐỘNG")
                              : (language === "en" ? "BANNED" : "ĐÃ KHÓA")}
                          </span>
                        </td>

                        {/* Last Login timestamps */}
                        <td className="py-3 px-4 text-center text-xs text-slate-550 dark:text-slate-400 font-semibold">
                          {uLastLogin
                            ? new Date(uLastLogin).toLocaleString(language === "en" ? "en-US" : "vi-VN")
                            : (language === "en" ? "Never logged in" : "Chưa từng đăng nhập")}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            {user.role === "SystemAdmin" || uRoleId === 1 ? (
                              <span className="text-slate-400 dark:text-slate-655 font-bold text-[10px] tracking-wider uppercase inline-flex items-center justify-center gap-1 select-none py-2 bg-slate-50 dark:bg-slate-800/40 px-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                                <ShieldCheck size={13} className="text-purple-500" /> {language === "en" ? "Locked" : "Bảo vệ"}
                              </span>
                            ) : (
                              <>
                                {/* Action 1: Assign Role */}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setTargetRoleId(String(uRoleId));
                                    setIsEditRoleOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95"
                                  title={language === "en" ? "Assign Role" : "Gán vai trò"}
                                >
                                  <Key size={15} />
                                </button>

                                {/* Action 2: Change Status (Ban/Activate) */}
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  className={`p-1.5 rounded-lg transition-all active:scale-95 ${user.status === "BANNED"
                                    ? "text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                    : "text-amber-600 hover:text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-955/20"
                                    }`}
                                  title={
                                    user.status === "BANNED"
                                      ? (language === "en" ? "Activate User" : "Kích hoạt người dùng")
                                      : (language === "en" ? "Ban User" : "Khóa người dùng")
                                  }
                                >
                                  {user.status === "BANNED" ? <UserCheck size={15} /> : <Ban size={15} />}
                                </button>

                                {/* Action 3: Delete Account */}
                                <button
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-955/20 rounded-lg transition-all active:scale-95"
                                  title={language === "en" ? "Delete Account" : "Xóa tài khoản"}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
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

          {/* Premium Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Show X Entries Selector */}
              <div className="flex items-center gap-2">
                <span>{language === "en" ? "Show" : "Hiển thị"}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs font-semibold cursor-pointer"
                >
                  <option value={2}>2</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span>{language === "en" ? "entries" : "mục"}</span>
              </div>

              {/* Stats */}
              <span>
                {language === "en"
                  ? `Showing ${totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} entries`
                  : `Hiển thị từ ${totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} đến ${Math.min(currentPage * pageSize, totalItems)} trong tổng số ${totalItems} mục`}
              </span>
            </div>

            {/* Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer font-bold select-none text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-350"
                >
                  {language === "en" ? "Prev" : "Trước"}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${currentPage === p
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer font-bold select-none text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-350"
                >
                  {language === "en" ? "Next" : "Sau"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: EDIT USER ROLE */}
      {isEditRoleOpen && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsEditRoleOpen(false)} />
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-300">
            <button
              onClick={() => setIsEditRoleOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                {language === "en" ? "Assign System Role" : "Gán Vai trò Hệ thống"}
              </h3>
            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
              {language === "en"
                ? "Modifying roles alters permission boundaries. User: "
                : "Thay đổi vai trò sẽ thay đổi quyền hạn tương ứng. Tài khoản: "}
              <strong className="text-slate-850 dark:text-white">@{selectedUser.username}</strong>
            </p>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">
                  {language === "en" ? "Select Role Grade" : "Chọn Cấp bậc Vai trò"}
                </label>
                <select
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none text-xs"
                >
                  <option value="2">
                    {language === "en" ? "Parking Manager (Facility Manager)" : "Quản lý Bãi xe (ParkingManager)"}
                  </option>
                  <option value="3">
                    {language === "en" ? "Parking Staff (Gate Attendant / Staff)" : "Nhân viên Cổng (ParkingStaff)"}
                  </option>
                  <option value="4">
                    {language === "en" ? "Parking User (Regular Customer Driver)" : "Khách gửi xe (ParkingUser)"}
                  </option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-xs uppercase tracking-wider py-2.5 rounded-xl font-bold mt-2 text-white transition-all hover:scale-[1.01] active:scale-95 shadow-sm">
                {language === "en" ? "Apply Role Change" : "Áp dụng Thay đổi"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* POPUP MODAL 2: CREATE STAFF / ADMIN ACCOUNT */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setAddFieldErrors({}); setFormError(""); }} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-300">
            <button
              onClick={() => { setIsAddModalOpen(false); setAddFieldErrors({}); setFormError(""); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <UserPlus size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                {language === "en" ? "Create System Account" : "Tạo Tài khoản Hệ thống"}
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

            <form onSubmit={handleAddUserSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">
                  {language === "en" ? "Full Name" : "Họ và Tên"}
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => { setNewFullName(e.target.value); setAddFieldErrors((prev) => ({ ...prev, fullName: "" })); }}
                  placeholder="e.g. Nguyen Hoang Nam"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs ${addFieldErrors.fullName ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700"}`}
                />
                {addFieldErrors.fullName && <p className="text-red-500 text-[10px] mt-1 font-semibold">{addFieldErrors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">
                    {language === "en" ? "Email Address" : "Địa chỉ Email"}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setAddFieldErrors((prev) => ({ ...prev, email: "" })); }}
                    placeholder="name@eparking.vn"
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs ${addFieldErrors.email ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700"}`}
                  />
                  {addFieldErrors.email && <p className="text-red-500 text-[10px] mt-1 font-semibold">{addFieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">
                    {language === "en" ? "Phone Number" : "Số điện thoại"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => { setNewPhone(e.target.value); setAddFieldErrors((prev) => ({ ...prev, phone: "" })); }}
                    placeholder="090XXXXXXX"
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs ${addFieldErrors.phone ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700"}`}
                  />
                  {addFieldErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-semibold">{addFieldErrors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">
                    {language === "en" ? "Temporary Password" : "Mật khẩu Tạm thời"}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setAddFieldErrors((prev) => ({ ...prev, password: "" })); }}
                    placeholder="••••••••"
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs ${addFieldErrors.password ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700"}`}
                  />
                  {addFieldErrors.password && <p className="text-red-500 text-[10px] mt-1 font-semibold">{addFieldErrors.password}</p>}
                  {!addFieldErrors.password && (
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] mt-1">
                      {language === "en"
                        ? "8+ chars incl. uppercase, lowercase, number & special character (@$!%*?&)."
                        : "8+ ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)."}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1 uppercase text-[10px] font-bold tracking-wider">
                    {language === "en" ? "System Role" : "Vai trò Hệ thống"}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-xs"
                  >
                    <option value="ParkingStaff">
                      {language === "en" ? "ParkingStaff (Staff)" : "ParkingStaff (Nhân viên)"}
                    </option>
                    <option value="ParkingManager">
                      {language === "en" ? "ParkingManager (Manager)" : "ParkingManager (Quản lý)"}
                    </option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-wider py-3 rounded-xl text-white shadow-md transition-all hover:scale-[1.01] active:scale-95 mt-4">
                {language === "en" ? "Register Account" : "Đăng ký Tài khoản"}
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
                  {language === "en" ? "Permanently Delete User" : "Xóa Tài khoản Vĩnh viễn"}
                </h3>
                <p className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">
                  {language === "en" ? "Critical Security Action" : "Hành động Bảo mật Nghiêm trọng"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50/50 dark:bg-red-955/10 border border-red-100 dark:border-red-900/40 p-3.5 rounded-xl">
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-semibold">
                  {language === "en"
                    ? "Warning: You are about to permanently delete the user account for "
                    : "Cảnh báo: Bạn sắp sửa xóa vĩnh viễn tài khoản người dùng cho "}
                  <span className="font-sans text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                    @{userToDelete.username}
                  </span>{" "}
                  ({userToDelete.fullName || userToDelete.full_name || (language === "en" ? "Unconfigured Name" : "Tên chưa thiết lập")}).
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {language === "en"
                    ? "This action will delete user credentials and profile records. If this user has active system dependencies (like bookings or transactions), the database will reject the deletion to preserve audit history."
                    : "Hành động này sẽ xóa vĩnh viễn thông tin đăng nhập và hồ sơ người dùng. Nếu người dùng này có các ràng buộc hệ thống đang hoạt động (như đặt chỗ hoặc giao dịch), cơ sở dữ liệu sẽ từ chối xóa để bảo toàn lịch sử đối soát hệ thống."}
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
                  {language === "en" ? "Cancel" : "Hủy bỏ"}
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
                      {language === "en" ? "Deleting..." : "Đang xóa..."}
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      {language === "en" ? "Confirm Delete" : "Xác nhận Xóa"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* POPUP MODAL 4: CONFIRM TOGGLE USER STATUS */}
      {isStatusModalOpen && userToToggleStatus && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!togglingStatus) {
                setIsStatusModalOpen(false);
                setUserToToggleStatus(null);
              }
            }}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-350 transform scale-100 transition-transform">
            <button
              disabled={togglingStatus}
              onClick={() => {
                setIsStatusModalOpen(false);
                setUserToToggleStatus(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 disabled:opacity-50 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className={`p-2.5 rounded-xl ${userToToggleStatus.status === "ACTIVE"
                ? "bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400"
                : "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                }`}>
                {userToToggleStatus.status === "ACTIVE" ? (
                  <Ban size={20} className="animate-pulse" />
                ) : (
                  <UserCheck size={20} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {userToToggleStatus.status === "ACTIVE"
                    ? (language === "en" ? "Ban User Account" : "Khóa tài khoản người dùng")
                    : (language === "en" ? "Activate User Account" : "Kích hoạt tài khoản người dùng")}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {language === "en" ? "System Access Control" : "Kiểm soát truy cập hệ thống"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`border p-3.5 rounded-xl ${userToToggleStatus.status === "ACTIVE"
                ? "bg-red-50/50 dark:bg-red-955/10 border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400"
                : "bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/40 text-green-750 dark:text-green-400"
                }`}>
                <p className="text-xs leading-relaxed font-semibold">
                  {userToToggleStatus.status === "ACTIVE" ? (
                    language === "en"
                      ? "Are you sure you want to ban this account? The user will be blocked from logging into the platform and all operations immediately."
                      : "Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống và mọi hoạt động sẽ bị đình chỉ ngay lập tức."
                  ) : (
                    language === "en"
                      ? "Are you sure you want to unban this account? The user will regain standard access to log in and operate."
                      : "Bạn có chắc chắn muốn mở khóa tài khoản này? Người dùng sẽ lấy lại quyền đăng nhập và hoạt động bình thường."
                  )}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-xs text-slate-550 dark:text-slate-400">Target User:</span>
                  <span className="font-sans text-xs font-bold text-slate-900 dark:text-white ">
                    @{userToToggleStatus.username}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={togglingStatus}
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setUserToToggleStatus(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {language === "en" ? "Cancel" : "Hủy bỏ"}
                </button>
                <button
                  type="button"
                  disabled={togglingStatus}
                  onClick={handleConfirmToggleStatus}
                  className={`flex-1 px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${userToToggleStatus.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-green-600 hover:bg-green-500"
                    }`}
                >
                  {togglingStatus ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {language === "en" ? "Processing..." : "Đang xử lý..."}
                    </>
                  ) : (
                    <>
                      {userToToggleStatus.status === "ACTIVE" ? (
                        <>
                          <Ban size={14} />
                          {language === "en" ? "Confirm Ban" : "Xác nhận Khóa"}
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} />
                          {language === "en" ? "Confirm Activate" : "Xác nhận Mở"}
                        </>
                      )}
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