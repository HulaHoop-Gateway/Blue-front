import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import ReservationHistoryPage from "./pages/ReservationHistoryPage";
import UsageHistoryPage from "./pages/UsageHistoryPage";
import CancellationHistoryPage from "./pages/CancellationHistoryPage";
import NotFoundPage from "./pages/NotFoundPage";
import Layout from "./components/Layout/Layout";
import Main from "./components/Main/Main";

import { ContextProvider } from "./context/Context";

// 앱의 뼈대(Router)를 잡는 최상위 컴포넌트
// 사용자가 들어오는 URL 경로에 따라 어떤 화면(Page)을 띄워줄지 분기 처리함.
export default function App() {
  const [token, setToken] = useState(null);

  // 페이지 새로고침 방어 로직 (JWT 생명 연장)
  // 리액트는 특성상 새로고침하면 들고 있던 상태(token)가 다 날아가버려서 로그아웃 되어버림.
  // 그래서 맨 처음 켜질 때(useEffect 빈 배열) 세션 스토리지를 뒤져서 토큰을 가져오고 만료 기간(exp)을 검증해서 다시 살려냄.
  useEffect(() => {
    const savedToken = sessionStorage.getItem("user_jwt");
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        // JWT 만료 시간(exp)이 현재 시간보다 미래인지 확인
        if (payload.exp * 1000 > Date.now()) {
          setToken(savedToken);
        } else {
          sessionStorage.removeItem("user_jwt");
          setToken(null);
        }
      } catch (e) {
        // 토큰이 유효하지 않은 경우 (예: 손상된 토큰)
        sessionStorage.removeItem("user_jwt");
        setToken(null);
      }
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
    sessionStorage.setItem("user_jwt", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    sessionStorage.removeItem("user_jwt");
  };

  return (
    <ContextProvider token={token} setToken={setToken}>
      <Router>
        <Routes>
          {/* 로그인 페이지: 토큰이 있으면 홈으로 리다이렉트 */}
          <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />

          {/* 
            로그인한 사람만 들어올 수 있는 보호된 경로들 (라우터 가드)
            token이 있으면 <Layout>(사이드바 뼈대)을 그리고, 없으면 얄짤없이 <Navigate>로 튕겨서 로그인창으로 보냄.
          */}
          <Route path="/" element={token ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}>
            {/* Layout 안쪽 구멍(Outlet)에 쏙 들어갈 알맹이 컴포넌트들 */}
            <Route index element={<Main />} />
            <Route path="mypage" element={<MyPage token={token} onLogout={handleLogout} />} />
            <Route path="reservation-history" element={<ReservationHistoryPage />} />
            <Route path="usage-history" element={<UsageHistoryPage />} />
            <Route path="cancellation-history" element={<CancellationHistoryPage />} />
          </Route>

          {/* 404 페이지 (모든 경로에 매칭되지 않을 때) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ContextProvider>
  );
}