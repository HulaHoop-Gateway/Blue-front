import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import Layout from "./components/Layout/Layout";
import Main from "./components/Main/Main";

import { ContextProvider } from "./context/Context";

export default function App() {
  const [token, setToken] = useState(null);

  // ✅ 페이지 새로고침 시 JWT 유지 및 만료 확인
  useEffect(() => {
    const savedToken = localStorage.getItem("user_jwt");
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        // JWT 만료 시간(exp)이 현재 시간보다 미래인지 확인
        if (payload.exp * 1000 > Date.now()) {
          setToken(savedToken);
        } else {
          localStorage.removeItem("user_jwt");
          setToken(null);
        }
      } catch (e) {
        // 토큰이 유효하지 않은 경우 (예: 손상된 토큰)
        localStorage.removeItem("user_jwt");
        setToken(null);
      }
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("user_jwt", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("user_jwt");
  };

  return (
    <ContextProvider token={token} setToken={setToken}>
      <Router>
        <Routes>
          {/* 로그인 페이지: 토큰이 있으면 홈으로 리다이렉트 */}
          <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
          
          {/* 보호된 경로 (Layout을 통해 렌더링) */}
          <Route path="/" element={token ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}>
            {/* Layout의 Outlet에서 렌더링될 컴포넌트들 */}
            <Route index element={<Main />} />
            <Route path="mypage" element={<MyPage token={token} onLogout={handleLogout} />} />
          </Route>
        </Routes>
      </Router>
    </ContextProvider>
  );
}