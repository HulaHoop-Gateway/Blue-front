import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MyPage from "./pages/MyPage";
import { ContextProvider } from "./context/Context";

export default function App() {
  const [token, setToken] = useState(null);

  // ✅ 페이지 새로고침 시 JWT 유지
  useEffect(() => {
    const savedToken = localStorage.getItem("user_jwt");
    if (savedToken) {
      const payload = JSON.parse(atob(savedToken.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        setToken(savedToken);
      } else {
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
          <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/" element={token ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/mypage" element={token ? <MyPage token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </ContextProvider>
  );
}
