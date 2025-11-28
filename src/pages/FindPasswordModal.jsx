import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";   // ✅ 수정

export default function FindPasswordModal({ onClose }) {
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);

  const handleFind = async (e) => {
    e.preventDefault();

    if (!id || !email) {
      setResult("아이디와 이메일을 모두 입력해주세요.");
      return;
    }

    try {
      const response = await axiosInstance.post("/api/member/reset-password", {
        id,
        email,
      });

      if (response.data.success) {
        setResult("임시 비밀번호가 이메일로 전송되었습니다.");
      } else {
        setResult("아이디 또는 이메일이 일치하지 않습니다.");
      }
    } catch (error) {
      console.error(error);
      setResult("서버 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-body">
        <h2>비밀번호 찾기</h2>

        <form onSubmit={handleFind}>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="아이디"
            required
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            type="email"
            required
          />

          <button type="submit">임시 비밀번호 발송</button>
        </form>

        {result && <div className="result-message">{result}</div>}

        <button className="close-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
