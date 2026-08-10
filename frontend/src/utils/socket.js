import { io } from "socket.io-client";
import { API_URL } from "../api/apiClient";

// Lấy base URL từ API_URL (bỏ phần /api ở đuôi)
const backendUrl = API_URL.replace('/api', '');

export const socket = io(backendUrl, {
  autoConnect: false // Tránh tự động connect ngay khi import
});
