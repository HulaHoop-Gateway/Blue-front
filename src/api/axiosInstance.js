// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8090", // Spring Boot 서버
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // JWT는 쿠키가 아닌 헤더로 전송
});

// 요청 시 JWT 자동 첨부
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("user_jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
