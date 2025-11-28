import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import axios from "axios"; // 아이디 중복확인을 위해 추가
import "./LoginPage.css";
import FindIdModal from "./FindIdModal";
import FindPasswordModal from "./FindPasswordModal";

export default function LoginPage({ onLogin }) {
  // 로그인 상태
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // 회원가입 상태
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    confirmPassword: "",
    name: "",
    phoneNum: "",
    address: "",
    email: "",
    agreements: [false, false, false, false],
  });
  const [signupError, setSignupError] = useState("");
  const [success, setSuccess] = useState("");
  const [idCheckMessage, setIdCheckMessage] = useState("");
  const [phoneCheckMessage, setPhoneCheckMessage] = useState("");
  const [emailCheckMessage, setEmailCheckMessage] = useState("");

  // UI 상태
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  const handleRegisterClick = () => setIsActive(true);
  const handleLoginClick = () => setIsActive(false);

  // 최상단 컴포넌트 내부(useState 등)에 아래 state 및 핸들러 추가
  const [showFindId, setShowFindId] = useState(false);
  const [showFindPw, setShowFindPw] = useState(false);

  // 로그인 핸들러
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await axiosInstance.post("/api/login", {
        id: loginId,
        password: loginPassword,
      });
      const token = response.data.token;
      if (token) {
        localStorage.setItem("user_jwt", token);
        onLogin(token);
        navigate("/"); // 로그인 성공 시 홈으로 이동
      } else {
        setLoginError("서버에서 토큰을 받지 못했습니다.");
      }
    } catch (err) {
      if (err.response?.status === 403) setLoginError("접근이 거부되었습니다 (403 Forbidden)");
      else if (err.response?.status === 401) setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      else setLoginError("로그인 중 오류가 발생했습니다.");
    }
  };

  // 회원가입 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSignupError("");
    setSuccess("");
  };

  // 약관 동의 핸들러
  const handleAgreementChange = (index) => {
    const updated = [...formData.agreements];
    updated[index] = !updated[index];
    setFormData((prev) => ({ ...prev, agreements: updated }));
  };

  // 아이디 중복 확인 핸들러
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

  // 주소 검색 핸들러
  const openAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        setFormData((prev) => ({ ...prev, address: data.address }));
      },
    }).open();
  };

  // 전화번호 중복확인 핸들러
  const handlePhoneCheck = async () => {
    if (!formData.phoneNum.trim()) {
      setPhoneCheckMessage("전화번호를 입력해주세요.");
      return;
    }
    try {
      const res = await axios.get("http://localhost:8090/api/member/check-phone", {
        params: { phoneNum: formData.phoneNum },
      });
      if (res.data.available) {
        setPhoneCheckMessage("✅ 사용 가능한 전화번호입니다.");
      } else {
        setPhoneCheckMessage("❌ 이미 사용 중인 전화번호입니다.");
      }
    } catch (err) {
      setPhoneCheckMessage("서버 오류가 발생했습니다.");
    }
  };

  // 이메일 중복 확인 핸들러
  const handleEmailCheck = async () => {
    if (!formData.email.trim()) {
      setEmailCheckMessage("이메일을 입력해주세요.");
      return;
    }
    try {
      const res = await axios.get("http://localhost:8090/api/member/check-email", {
        params: { email: formData.email },
      });
      if (res.data.available) {
        setEmailCheckMessage("✅ 사용 가능한 이메일입니다.");
      } else {
        setEmailCheckMessage("❌ 이미 사용 중인 이메일입니다.");
      }
    } catch (err) {
      setEmailCheckMessage("서버 오류가 발생했습니다.");
    }
  };

  // 회원가입 제출 핸들러
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSuccess("");
    const { id, password, confirmPassword, name, address, phoneNum, email } = formData;
    if (!id || !password || !name || !address || !phoneNum || !email) {
      setSignupError("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setSignupError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (formData.agreements.slice(0, 3).some((a) => !a)) {
      setSignupError("필수 약관에 모두 동의해야 합니다.");
      return;
    }
    const memberData = {
      ...formData,
      notificationStatus: formData.agreements[3] ? "Y" : "N",
    };
    try {
      await axiosInstance.post("/api/member/signup", memberData);
      setSuccess("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        setIsActive(false);
        setSuccess("");
      }, 2000);
    } catch (err) {
      if (err.response?.data?.includes('전화번호')) {
        alert('이미 회원인 전화번호입니다.');
      } else if (err.response?.data?.includes('이메일')) {
        alert('이미 회원인 이메일입니다.');
      } else if (err.response?.data?.includes('아이디')) {
        setSignupError('이미 사용 중인 아이디입니다.');
      } else {
        setSignupError('회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <>
      <div className={`container ${isActive ? "active" : ""}`} id="container">
        {/* Sign In */}
        <div className="form-container sign-in">
          <form onSubmit={handleLoginSubmit}>
            <h1>로그인</h1>
            <div className="social-icons"></div>
            <span>아이디와 비밀번호로 로그인하세요</span>
            <input
              placeholder="아이디"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <a href="#"></a>
            {loginError && <div className="error-message">{loginError}</div>}
            <button>로그인</button>
            <div className="find-links" style={{ textAlign: 'center', marginTop: 20 }}>
              <span onClick={() => setShowFindId(true)} style={{ cursor: 'pointer' }}>아이디 찾기</span>
              <span style={{ margin: '0 12px' }}>|</span>
              <span onClick={() => setShowFindPw(true)} style={{ cursor: 'pointer' }}>비밀번호 찾기</span>
            </div>
          </form>
        </div>

        {/* Sign Up */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignupSubmit}>
            <h1>회원가입</h1>
            <div className="social-icons"></div>

            {/* 아이디 */}
            <div className="form-group id-check">
              <div className="id-check-row">
                <input
                  type="text"
                  name="id"
                  placeholder="아이디 *"
                  value={formData.id}
                  onChange={handleChange}
                  required
                />
                <button type="button" onClick={handleIdCheck}>중복확인</button>
              </div>
              {idCheckMessage && <div className="id-check-message">{idCheckMessage}</div>}
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="비밀번호 *"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group password-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 확인 *"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="inline-warning">비밀번호가 일치하지 않습니다.</div>
              )}
            </div>

            {/* 이름 */}
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="이름 *"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* 전화번호 */}
            <div className="form-group">
              <input
                type="tel"
                name="phoneNum"
                placeholder="휴대전화 (예: 010-1234-5678) *"
                value={formData.phoneNum}
                onChange={handleChange}
                required
              />
            </div>

            {/* 주소 */}
            <div className="form-group address-group">
              <input
                type="text"
                name="address"
                placeholder="주소 *"
                value={formData.address}
                readOnly
                required
              />
              <button type="button" onClick={openAddressSearch}>검색</button>
            </div>
            
            {/* 이메일 */}
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="이메일 *"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* 약관 */}
            <div className="form-group agreements">
              {[
                "서비스 이용약관 (필수)",
                "개인정보 처리방침 (필수)",
                "위치기반 서비스 이용약관 (필수)",
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

            {signupError && <div className="error-message">{signupError}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit">가입하기</button>
            <p className="signup-link">
              이미 계정이 있으신가요?{" "}
              <span onClick={() => setIsActive(false)}>로그인</span>
            </p>
          </form>
        </div>

        {/* Toggle */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>다시 만나서 반가워요 👋</h1>
              <p>훌라후프 블루는 <b>가맹점과 고객을 하나의 링으로 묶는 AI 게이트웨이</b>예요.<br/>
                로그인하면 <b>예약·결제·통계</b>를 한 화면에서 이어서 처리할 수 있어요.</p>
              <button type="button" className="hidden" id="login" onClick={handleLoginClick}>
                로그인으로 이동
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>훌라후프 블루에 합류하기 🚀</h1>
              <p>   <b>AI가 이해하고, 게이트웨이가 연결합니다.</b><br />
                자전거·영화관 등 다양한 가맹점을 <b>하나의 링</b>으로 연결해
                <b>실시간 예약/좌석/매출</b>을 깔끔하게 보여드려요.</p>
              <button type="button" className="hidden" id="register" onClick={handleRegisterClick}>
                회원가입으로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
      {showFindId && <FindIdModal onClose={() => setShowFindId(false)} />}
      {showFindPw && <FindPasswordModal onClose={() => setShowFindPw(false)} />}
    </>
  );
}

