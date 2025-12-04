// src/hooks/useAuth.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function useAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem("user_jwt");

      // 토큰이 없으면 로그인 페이지로
      if (!token) {
        console.warn("⚠️ [useAuth] 토큰이 없습니다. 로그인 페이지로 이동합니다.");
        navigate("/login");
        setIsLoading(false);
        return;
      }

      try {
        // 토큰 유효성 검증을 위해 실제 API 호출
        console.log("🔍 [useAuth] 토큰 유효성 검증 중...");
        await axiosInstance.get("/api/member/info");

        console.log("✅ [useAuth] 토큰이 유효합니다.");
        setIsAuthenticated(true);
      } catch (error) {
        console.error("❌ [useAuth] 토큰 검증 실패:", error);

        // 토큰이 유효하지 않으면 제거하고 로그인 페이지로
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
