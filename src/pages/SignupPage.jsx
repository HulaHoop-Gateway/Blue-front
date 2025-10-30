import React, { useState } from "react";
import axios from "axios";
import "./SignupPage.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    confirmPassword: "",
    name: "",
    phoneNum: "",
    address: "",
    email: "",
    agreements: [false, false, false, false], // 마지막이 알림 수신동의
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [idCheckMessage, setIdCheckMessage] = useState("");

  // ✅ 입력 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  // ✅ 약관 체크박스
  const handleAgreementChange = (index) => {
    const updated = [...formData.agreements];
    updated[index] = !updated[index];
    setFormData((prev) => ({ ...prev, agreements: updated }));
  };

  // ✅ 아이디 중복확인
  const handleIdCheck = async () => {
    if (!formData.id.trim()) {
      setIdCheckMessage("아이디를 입력해주세요.");
      return;
    }

    try {
      const res = await axios.get("http://localhost:8090/api/member/check-id", {
        params: { id: formData.id },
      });

      if (res.data.available) {
        setIdCheckMessage("✅ 사용 가능한 아이디입니다.");
      } else {
        setIdCheckMessage("❌ 이미 사용 중인 아이디입니다.");
      }
    } catch (err) {
      console.error(err);
      setIdCheckMessage("서버 오류가 발생했습니다.");
    }
  };

  // ✅ 회원가입 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { id, password, confirmPassword, name, address, phoneNum } = formData;

    if (!id || !password || !name || !address || !phoneNum) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // ✅ 필수 약관 3개 체크 (마지막은 선택)
    if (formData.agreements.slice(0, 3).some((a) => !a)) {
      setError("필수 약관에 모두 동의해야 합니다.");
      return;
    }

    const notificationStatus = formData.agreements[3] ? "Y" : "N";

    const memberData = {
      ...formData,
      notificationStatus,
    };

    try {
      await axios.post("http://localhost:8090/api/member/signup", memberData);
      setSuccess("회원가입이 완료되었습니다!");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err) {
      console.error(err);
      setError("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="signup-page">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>회원가입</h2>

        {/* 아이디 */}
        <div className="form-group id-check">
          <label>아이디 *</label>
          <div className="id-check-row">
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={handleIdCheck}>
              중복확인
            </button>
          </div>
          {idCheckMessage && (
            <div className="id-check-message">{idCheckMessage}</div>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="form-group">
          <label>비밀번호 *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* 비밀번호 확인 */}
        <div className="form-group password-group">
          <label>비밀번호 확인 *</label>
          <div className="password-container">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <div className="inline-warning">비밀번호가 일치하지 않습니다.</div>
              )}
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <div className="inline-good">비밀번호가 일치합니다.</div>
              )}
          </div>
        </div>

        {/* 이름 */}
        <div className="form-group">
          <label>이름 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* 전화번호 */}
        <div className="form-group">
          <label>전화번호 *</label>
          <input
            type="tel"
            name="phoneNum"
            placeholder="예: 010-1234-5678"
            value={formData.phoneNum}
            onChange={handleChange}
            required
          />
        </div>

        {/* 주소 */}
        <div className="form-group">
          <label>주소 *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        {/* 이메일 */}
        <div className="form-group">
          <label>이메일 (선택)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        {/* 약관 동의 */}
        <div className="agreements">
          <label>약관 동의 *</label>
          {[
            "서비스 이용약관",
            "개인정보 처리방침",
            "위치기반 서비스 이용약관",
            "알림 메시지 수신 동의 (선택)",
          ].map((text, idx) => (
            <div key={idx} className="agreement-item">
              <input
                type="checkbox"
                checked={formData.agreements[idx]}
                onChange={() => handleAgreementChange(idx)}
              />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit">회원가입</button>

        <div className="login-link">
          이미 계정이 있으신가요?{" "}
          <span onClick={() => (window.location.href = "/login")}>로그인</span>
        </div>
      </form>
    </div>
  );
}
