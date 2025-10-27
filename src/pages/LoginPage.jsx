import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axiosInstance.post("/api/login", { username, password });
      const token = response.data.token;
      if (token) {
        localStorage.setItem("user_jwt", token);
        onLogin(token);
      } else {
        setError("서버에서 토큰을 받지 못했습니다.");
      }
    } catch (err) {
      if (err.response?.status === 403) setError("접근이 거부되었습니다 (403 Forbidden)");
      else if (err.response?.status === 401) setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      else setError("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Blue-front 로그인</h2>

        <div className="form-group">
          <label>아이디</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit">로그인</button>
      </form>
    </div>
  );
}
