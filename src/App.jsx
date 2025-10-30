// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage"; // ✅ 회원가입 페이지 추가
import HomePage from "./pages/HomePage";
import MyPage from "./pages/MyPage";

export default function App() {
  const [token, setToken] = useState(null);

  // ✅ 토큰 유효성 확인 및 자동 로그인 유지
  useEffect(() => {
    const savedToken = localStorage.getItem("user_jwt");
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(savedToken);
        } else {
          localStorage.removeItem("user_jwt");
          setToken(null);
        }
      } catch (e) {
        console.error("JWT 파싱 오류:", e);
        localStorage.removeItem("user_jwt");
      }
    }
  }, []);

  // ✅ 로그인 성공 시 토큰 저장
  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("user_jwt", newToken);
  };

  // ✅ 로그아웃 시 토큰 제거
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("user_jwt");
  };

  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route
          path="/login"
          element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />}
        />

        {/* 회원가입 페이지 */}
        <Route
          path="/signup"
          element={token ? <Navigate to="/" /> : <SignupPage />}
        />

        {/* 메인 홈 */}
        <Route
          path="/"
          element={token ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* 마이페이지 */}
        <Route
          path="/mypage"
          element={
            token ? (
              <MyPage token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 잘못된 경로 → 로그인 or 홈으로 리다이렉트 */}
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}
