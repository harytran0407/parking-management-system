import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, 
});

    let isRedirecting = false; 

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

        //Case 1: Mất mạng hoàn toàn và server không phản hồi
        if(!error.response){
            window.dispatchEvent(new CustomEvent('pbms-network-error',{
                detail:{message:'Cannot connect to server . Please check your internet connection'}
            }));
            return Promise.reject(error);
        }
        const status = error.response?.status;
        const serverData = error.response?.data;

        // Case 2: Xử lý lỗi 401 Hết hạn phiên làm việc hoặc Token không hợp lệ
        if (status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userData');

            if(!isRedirecting){
                isRedirecting=true;
                // Delegate toàn bộ toast + navigate sang GlobalHttpListener
                window.dispatchEvent(new CustomEvent('pbms-unauthorized',{
                    detail:{message:serverData?.message || 'Session expired . Please login in again'}
                }));
                setTimeout(() =>{isRedirecting = false;},2500);
            }
           
        }

        // Case 3 Xử lý lỗi 403 Đăng nhập đúng nhưng sai vai trò truy cập (Vi phạm RBAC)
        if (status === 403) {
            window.dispatchEvent(new CustomEvent('pbms-forbidden',{
                detail:{message:serverData?.message || 'Access denied.You do not have permission'}
            }))
        }

        // Xử lý lỗi 429: Vượt quá giới hạn lượt gọi API (Rate Limits)
        if (status === 429) {
           window.dispatchEvent(new CustomEvent('pbms-rate-limited',{
                detail:{message: serverData?.message || 'Too many requests.Please try again later'}
           }))
        }

        // Đồng bộ hóa cấu trúc trả về: Luôn ưu tiên data chi tiết từ server gửi về (chứa error_code)
        // Nếu không có, trả về object error mặc định của Axios
        return Promise.reject(serverData || error);
    }
);

export default api;