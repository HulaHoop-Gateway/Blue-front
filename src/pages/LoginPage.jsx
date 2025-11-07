import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  const handleRegisterClick = () => setIsActive(true);
  const handleLoginClick = () => setIsActive(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axiosInstance.post("/api/login", { id, password });
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

  const handleSignup = (e) => {
    e.preventDefault();
    alert("회원가입 로직 연결해줘!");
  };

  return (
    // ✅ active 클래스 토글
    <div className={`container ${isActive ? "active" : ""}`} id="container">
      {/* Sign In */}
      <div className="form-container sign-in">
        <form onSubmit={handleSubmit}>
          <h1>로그인</h1>
          <div className="social-icons"></div>
          <span>or use your email password</span>

          <input
            placeholder="이메일"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <a href="#"></a>
          {error && <div className="error-message">{error}</div>}
          <button>로그인</button>

          {/* 필요 시 회원가입 라우팅 */}
          <p className="signup-link">
            아직 회원이 아니신가요?{" "}
            <span onClick={() => navigate("/signup")}>회원가입</span>
          </p>
        </form>
      </div>

      {/* Sign Up */}
      <div className="form-container sign-up">
        <form onSubmit={handleSignup}>
          <h1>Create Account</h1>
          <div className="social-icons"></div>
          <input type="text" placeholder="Name" required/>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <input type="" name="" id="" />
          <input type="" name="" id="" />
          <input type="" name="" id="" />
          <input type="" name="" id="" />
          <input type="" name="" id="" />
          <a href="#"></a>
          <button>Sign Up</button>
        </form>
      </div>

      {/* Toggle */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of site features</p>
            {/* ✅ submit 방지 */}
            <button
              type="button"
              className="hidden"
              id="login"
              onClick={handleLoginClick}
            >
              Sign In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Hello, Friend!</h1>
            <p>Register with your personal details to use all of site features</p>
            {/* ✅ submit 방지 */}
            <button
              type="button"
              className="hidden"
              id="register"
              onClick={handleRegisterClick}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
