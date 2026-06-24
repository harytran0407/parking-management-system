# Sử dụng Node.js Alpine làm base image
FROM node:20-alpine

WORKDIR /app

# Copy package.json và package-lock.json để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Copy toàn bộ mã nguồn của Frontend vào container
COPY . .

# Mở cổng 5173 cho Vite Dev Server
EXPOSE 5173

# Thiết lập biến môi trường để Vite nhận diện chạy trong Docker
ENV CI=true

# Khởi chạy Vite Dev Server kết nối ra ngoài (0.0.0.0) trên cổng 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

