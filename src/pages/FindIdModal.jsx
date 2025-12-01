// FindIdModal.jsx

import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "./FindAccountModal.css"; // ✅ Import the new CSS

function FindIdModal({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFindId = async (e) => {
    e.preventDefault();
    setIsSuccess(false);

    if (!name || !email) {
      setResult("이름과 이메일을 모두 입력해주세요.");
      return;
    }

    try {
      const response = await axiosInstance.post("/api/member/find-id", {
        name,
        email,
      });

      const foundId = response.data.id;
      setResult(`회원님의 아이디는 "${foundId}" 입니다.`);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      if (error.response?.status === 400) {
        setResult(error.response.data || "일치하는 회원이 없습니다.");
      } else {
        setResult("서버 오류가 발생했습니다.");
      }
    }
  };

  const getResultMessageClass = () => {
    if (!result) return "result-message";
    return isSuccess ? "result-message success" : "result-message error";
  }

  return (
    <div className="find-account-modal-overlay">
      <div className="find-account-modal-body">
        <h2>아이디 찾기</h2>

        <form onSubmit={handleFindId}>
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="가입한 이메일 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="button-group">
            <button type="submit" className="submit-btn">아이디 찾기</button>
          </div>
        </form>

        {result && <p className={getResultMessageClass()}>{result}</p>}

        <div className="button-group">
            <button className="close-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default FindIdModal;
