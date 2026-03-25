// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function useAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 화면 그리는 컴포넌트(로그인 페이지 등) 안에 검증 로직까지 길게 쓰면 코드가 더러워지니까,
  // '토큰 있는지 확인하고 유효한 지 묻는 로직'만 뚝 떼어내서 커스텀 훅(Hook)으로 만든 거임. (관심사 분리)
  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem("user_jwt");

      // 토큰 껍데기조차 없으면 얄짤없이 쫓아냄
      if (!token) {
        console.warn("[useAuth] 토큰이 없습니다. 로그인 페이지로 이동합니다.");
        navigate("/login");
        setIsLoading(false);
        return;
      }

      try {
        // 백엔드한테 진짜로 살아있는 토큰인지 찔러봄 (서버에서 만료됐는지 한 번 더 더블체크)
        await axiosInstance.get("/api/member/info");

        console.log("[useAuth] 토큰 유효성 검증 중...");
        setIsAuthenticated(true);
      } catch (error) {
        console.error("유효하지 않은 토큰입니다:", error);

        // 썩은(?) 토큰이면 날려버리고 로그인하러 보냄
        sessionStorage.removeItem("user_jwt");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [navigate]);

  return { isAuthenticated, isLoading };
}
