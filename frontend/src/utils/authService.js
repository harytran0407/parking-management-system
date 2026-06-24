import api from '../utils/api';

/**
 * AuthService - Quản lý các cuộc gọi API xác thực hệ thống bãi xe (PMS)
 * Tuân thủ cấu trúc từ Update_API_Document và FUNCTIONAL_REQUIREMENTS
 */
export const authService = {

    /**
     * 1.1 User Login
     * @param {string} email - Email đăng nhập của người dùng (Max 100 ký tự)
     * @param {string} password - Mật khẩu (Từ 6 đến 255 ký tự)
     * @returns {Promise} Trả về JWT Token, thời gian hết hạn và thông tin User kèm Role
     */
    login: async (email, password) => {
        try {
            // Đúng theo thiết kế API 1.1, request body chỉ cần email và password
            const response = await api.post('/auth/login', { email, password });
            return response.data;
        } catch (error) {
            // Chuyển tiếp lỗi có cấu trúc từ backend hoặc lỗi của axios interceptor
            throw error;
        }
    },

    /**
     * 1.3 Register Account
     * @param {Object} userData - Đối tượng chứa thông tin đăng ký
     * @param {string} userData.full_name - Họ và tên (2-100 ký tự)
     * @param {string} userData.email - Email (Duy nhất, hợp lệ)
     * @param {string} userData.phone_number - Số điện thoại (VD: 10 chữ số)
     * @param {string} userData.password - Mật khẩu
     * @param {string} userData.confirm_password - Mật khẩu xác nhận (phải khớp)
     * @returns {Promise} Trả về thông tin User đã tạo với Role mặc định là 'ParkingUser'
     */
    register: async (userData) => {
        try {
            // Gửi chính xác các trường được định nghĩa trong tài liệu API mục 1.3
            const response = await api.post('/auth/register', {
                full_name: userData.full_name,
                email: userData.email,
                phone_number: userData.phone_number,
                password: userData.password,
                confirm_password: userData.confirm_password
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * 1.2 Logout
     * Thực hiện hủy phiên làm việc phía server. 
     * Header Authorization sẽ tự động được đính kèm nhờ interceptor trong api.js nếu token tồn tại.
     */
    logout: async () => {
        try {
            const response = await api.post('/auth/logout');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * FR-AUTH-04 Quên mật khẩu (Forgot Password)
     * @param {string} method - Phương thức khôi phục: 'email' hoặc 'phone'
     * @param {string} contactInfo - Giá trị email hoặc số điện thoại tương ứng
     */
    forgotPassword: async (method, contactInfo) => {
        try {
            // Thiết kế API linh hoạt theo yêu cầu nghiệp vụ FR-AUTH-04 khôi phục qua email/OTP số điện thoại
            const response = await api.post('/auth/forgot-password', {
                method, // 'email' hoặc 'phone'
                destination: contactInfo
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};