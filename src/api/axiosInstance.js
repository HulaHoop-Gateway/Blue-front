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
// 백엔드 JwtFilter(JwtFilter.java)는 /api/login, /api/member/signup 등 PUBLIC_PATHS를 제외한
// 모든 요청에서 HTTP 헤더 'Authorization' 값을 검사함.
// 헤더가 없거나 'Bearer '로 시작하지 않으면 JwtFilter가 401 JSON 에러 응답을 바로 돌려보내고 컨트롤러까지 안 넘어감.
// 그래서 여기서 모든 요청 직전에 세션스토리지의 토큰을 꺼내 "Bearer {token}" 형식으로 헤더에 자동으로 꽂아주는 거임.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("user_jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // 백엔드 JwtFilter: authHeader.substring(7)로 'Bearer ' 7글자 잘라내고 순수 토큰만 추출해서 검증함
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
      // 백엔드 JwtFilter에서 보내는 에러 예시:
      //   { "error": "TOKEN_EXPIRED", "message": "토큰이 만료되었습니다.", "status": 401 }
      //   { "error": "MISSING_TOKEN",  "message": "Authorization 헤더가 없거나 형식이...", "status": 401 }
      // JwtFilter가 sendJsonError()로 직접 response를 씀 -> @ExceptionHandler 안 거침 -> 여기서 잡아줘야 함
      if (status === 401) {
        console.error("401 Unauthorized - 인증 실패 (토큰 만료/없음)");

        sessionStorage.removeItem("user_jwt"); // 죽은 토큰 브라우저에서 제거

        const errorMessage = data?.message || "로그인이 필요합니다. 다시 로그인해주세요.";

        // 이미 로그인 창이면 알림 두 번 안 뜨게 막음
        if (!window.location.pathname.includes("/login")) {
          alert(errorMessage);
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
