import axios from 'axios';
// read URL from .env
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    headers:{
        'Content-Type':'application/json',
    },
});

//automate import token to header
api.interceptors.request.use(
    (config) =>{
        const token = localStorage.getItem('accessToken');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) =>Promise.reject(error)
);
// catch error from backend
api.interceptors.response.use(
    (response) => response,
    (error) =>{
        const status = error.response?.status;
        const data = error.response?.data;
        // 401 Error : Expired token or incomplete login
        if(status === 401){
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userData');
            window.location.href='/login';
        }
        // 403 Error: no permission (wrong role)
        if(status === 403){
            window.location.href='/forbidden';
        }
        if(status === 429){
            console.warn('Rate limit exceeded');
        }
        return Promise.reject(data || error);
    }
);
export default api;