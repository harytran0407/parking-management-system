import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, 
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        // CHỈ TOKEN nếu trong localStorage có VÀ request đó chưa được chỉ định token thủ công
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Response Interceptor: Xử lý bẫy lỗi tập trung từ hệ thống 
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const serverData = error.response?.data;

        // Xử lý lỗi 401: Hết hạn phiên làm việc hoặc Token không hợp lệ
        if (status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userData');

            // Thay vì dùng window.location.href, thường phát một Event ra toàn hệ thống
            // hoặc điều hướng mượt mà để các component Toast kịp hiển thị lời chào/thông báo lỗi
            const authErrorEvent = new CustomEvent('pbms-unauthorized');
            window.dispatchEvent(authErrorEvent);

            // Fallback an toàn nếu hệ thống không bắt Event
            setTimeout(() => {
                window.location.href = '/login';
            }, 500);
        }

        // Xử lý lỗi 403: Đăng nhập đúng nhưng sai vai trò truy cập (Vi phạm RBAC)
        if (status === 403) {
            window.location.href = '/forbidden';
        }

        // Xử lý lỗi 429: Vượt quá giới hạn lượt gọi API (Rate Limits)
        if (status === 429) {
            // Đẩy trực tiếp một custom key vào object error để tầng UI (Toast) có thể bắt được và hiển thị
            console.error('PBMS Rate Limit Security Triggered:', serverData?.message);
        }

        // Đồng bộ hóa cấu trúc trả về: Luôn ưu tiên data chi tiết từ server gửi về (chứa error_code)
        // Nếu không có, trả về object error mặc định của Axios
        return Promise.reject(serverData || error);
    }
);

export default api;