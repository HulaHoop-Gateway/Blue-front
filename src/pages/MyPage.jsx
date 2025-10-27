// src/pages/MyPage.jsx
import React from "react";

export default function MyPage({ token, onLogout }) {
  return (
    <div style={{ padding: "20px" }}>
      <h1>마이페이지</h1>
      <p>로그인된 사용자 토큰:</p>
      <pre style={{ wordBreak: "break-all" }}>{token}</pre>

      <button
        onClick={onLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          backgroundColor: "#ff4d4f",
          color: "white",
          cursor: "pointer",
        }}
      >
        로그아웃
      </button>
    </div>
  );
}
