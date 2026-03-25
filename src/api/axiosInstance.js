// src/api/axiosInstance.js
import axios from "axios";

// 매번 fetch나 axios 쏠 때마다 서버 주소 치기 귀찮으니까
// 여기서 아예 기본 세팅을 잡아서 '공용 통신 객체'로 만들어 둔 거임.
const axiosInstance = axios.create({
  baseURL: "http://localhost:8090",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 세션 유지나 CORS 에러 뚫을 때 필수 옵션
});

// 요청 가로채기 (Request Interceptor)
// 백엔드는 API 요청 시 JWT 토큰이 없으면 무조건 입구컷(401) 시켜버리기 때문에,
// 여기서 무언가를 요청하기 직전에 세션스토리지에서 토큰을 꺼내서 헤더(Authorization)에 자동으로 꽂아줌.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("user_jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[axiosInstance] JWT 토큰 첨부됨");
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

      // 401 Unauthorized: 로그인 토큰이 없거나 기간이 다 돼서 죽었음
      if (status === 401) {
        console.error("401 Unauthorized - 인증 실패 (토큰 만료/없음)");

        sessionStorage.removeItem("user_jwt");

        const errorMessage = data?.message || "로그인이 필요합니다. 다시 로그인해주세요.";

        // 이미 로그인 창이면 알림 두 번 안 뜨게 막음
        if (!window.location.pathname.includes("/login")) {
          alert(errorMessage);

          // 로그인 페이지로 리다이렉트
          window.location.href = "/login";
        }
      }

      // 403 Forbidden: 로그인은 했는데, 관리자 페이지 등 남의 구역 넘볼 때
      else if (status === 403) {
        console.error("403 Forbidden - 권한 없음");

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
