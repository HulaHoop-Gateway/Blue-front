// FindIdModal.jsx

import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";   // ✅ axiosInstance 사용

function FindIdModal({ onClose }) {
  const [name, setName] = useState("");     // ✅ 이름 추가
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");

  const handleFindId = async (e) => {
    e.preventDefault();

    if (!name || !email) {
      setResult("이름과 이메일을 모두 입력해주세요.");
      return;
    }

    try {
      // ✅ 8090 포트로 요청 보냄 (baseURL + path)
      const response = await axiosInstance.post("/api/member/find-id", {
        name,
        email,
      });

      const foundId = response.data.id;   // 백엔드에서 Map.of("id", id) 리턴함
      setResult(`회원님의 아이디는 "${foundId}" 입니다.`);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 400) {
        // MemberService에서 던진 RuntimeException 메시지
        setResult(error.response.data || "일치하는 회원이 없습니다.");
      } else {
        setResult("서버 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-body">
        <h2>아이디 찾기</h2>

        <form onSubmit={handleFindId}>
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="가입한 이메일 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit">아이디 찾기</button>
        </form>

        {result && <p className="result-message">{result}</p>}

        <button className="close-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

export default FindIdModal;
