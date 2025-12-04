// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8090", // Spring Boot 서버
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // JWT는 쿠키가 아닌 헤더로 전송
});

// 요청 시 JWT 자동 첨부 (Request Interceptor)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("user_jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 [axiosInstance] JWT 토큰 첨부됨");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 처리 (Response Interceptor) - 인증 오류 처리
axiosInstance.interceptors.response.use(
  (response) => {
    // 정상 응답은 그대로 반환
    return response;
  },
  (error) => {
    // 에러 응답 처리
    if (error.response) {
      const { status, data } = error.response;

      // 401 Unauthorized: 인증 실패 (토큰 없음, 만료, 유효하지 않음)
      if (status === 401) {
        console.error("❌ [axiosInstance] 401 Unauthorized - 인증 실패");

        // 토큰 제거
        sessionStorage.removeItem("user_jwt");

        // 에러 메시지 표시
        const errorMessage = data?.message || "로그인이 필요합니다. 다시 로그인해주세요.";

        // 현재 로그인 페이지가 아닌 경우에만 알림 표시
        if (!window.location.pathname.includes("/login")) {
          alert(errorMessage);

          // 로그인 페이지로 리다이렉트
          window.location.href = "/login";
        }
      }

      // 403 Forbidden: 권한 없음
      else if (status === 403) {
        console.error("❌ [axiosInstance] 403 Forbidden - 권한 없음");

        // 토큰은 있지만 권한이 없는 경우
        const errorMessage = data?.message || "접근 권한이 없습니다.";

        if (!window.location.pathname.includes("/login")) {
          alert(errorMessage);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
