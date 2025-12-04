import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "./MyPage.css";
import TermsModal from "../components/TermsModal";

export default function MyPage() {
  const [member, setMember] = useState({
    name: "",
    phoneNum: "",
    email: "",
    address: "",
    notificationStatus: "N",
  });

  const [loading, setLoading] = useState(true);

  // 비밀번호 변경 상태
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 약관 모달 상태
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsTitle, setTermsTitle] = useState("");
  const [termsContent, setTermsContent] = useState("");

  // 회원정보 불러오기
  const fetchMemberInfo = async () => {
    try {
      const token = sessionStorage.getItem("user_jwt");
      if (!token) {
        console.warn("⚠️ [MyPage] 토큰이 없습니다.");
        alert("로그인이 필요합니다.");
        window.location.href = "/login";
        return;
      }

      console.log("🔍 [MyPage] 회원정보 요청 중...");
      const response = await axiosInstance.get("/api/member/info");

      console.log("✅ [MyPage] 회원정보 로드 성공:", response.data);
      setMember(response.data);
    } catch (error) {
      console.error("❌ [MyPage] 회원정보 불러오기 실패:", error);

      // 401/403 에러는 axiosInstance interceptor가 처리
      // 여기서는 네트워크 오류 등만 처리
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Interceptor가 이미 처리했으므로 여기서는 아무것도 하지 않음
        return;
      }

      // 기타 오류
      alert("회원 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberInfo();
  }, []);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMember((prev) => ({ ...prev, [name]: value }));
  };

  // SNS 알림 토글 (서버 호출 ❌ / 상태만 변경)
  const handleNotificationToggle = (e) => {
    const enabled = e.target.checked;
    setMember((prev) => ({
      ...prev,
      notificationStatus: enabled ? "Y" : "N",
    }));
  };

  // 회원정보 수정 (여기서 모든 정보 + 알림 상태 전송)
  const handleUpdate = async () => {
    try {
      await axiosInstance.patch("/api/member/update", member);
      alert("회원정보가 수정되었습니다.");
    } catch (error) {
      console.error("❌ 회원정보 수정 실패:", error);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await axiosInstance.patch("/api/member/update-password", {
        currentPassword,
        newPassword
      });
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordChange(false);
    } catch (error) {
      console.error("❌ 비밀번호 변경 실패:", error);
      alert(error.response?.data || "비밀번호 변경 중 오류가 발생했습니다.");
    }
  };

  // 회원 탈퇴
  const handleDelete = async () => {
    if (!window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await axiosInstance.delete("/api/member/delete");
      alert("회원 탈퇴가 완료되었습니다.");
      sessionStorage.removeItem("user_jwt");
      window.location.href = "/";
    } catch (error) {
      console.error("❌ 회원 탈퇴 실패:", error);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  // 약관 클릭 핸들러
  const handleTermsClick = (title) => {
    let content = "";
    switch (title) {
      case "개인정보 수집 동의서":
        content = `[개인정보 수집 및 이용 동의]

1. 수집하는 개인정보 항목
- 필수항목: 이름, 전화번호, 이메일, 주소
- 선택항목: 알림 수신 여부

2. 개인정보의 수집 및 이용 목적
- 회원 관리, 서비스 제공, 계약 이행, 요금 정산, 고객 상담

3. 보유 및 이용 기간
- 회원 탈퇴 시까지 (단, 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관)

4. 동의 거부 권리 및 불이익
- 귀하는 개인정보 수집 및 이용에 거부할 권리가 있으나, 동의 거부 시 서비스 이용이 제한될 수 있습니다.`;
        break;
      case "위치제공 동의서":
        content = `[위치기반 서비스 이용약관]

1. 목적
본 약관은 회사가 제공하는 위치기반 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.

2. 서비스 내용
- 현재 위치를 기반으로 한 주변 가맹점(영화관, 자전거 대여소) 검색 및 추천 서비스 제공

3. 위치정보의 보유 및 이용 기간
- 회사는 위치정보를 일회성으로 이용하며 별도로 저장하지 않습니다.`;
        break;
      case "제3자 개인정보 제공 동의서":
        content = `[개인정보 제3자 제공 동의]

1. 제공받는 자
- 제휴 가맹점 (영화관, 자전거 대여 업체 등)

2. 제공 목적
- 예약 및 결제 서비스 이행, 서비스 이용 확인

3. 제공 항목
- 이름, 전화번호, 예약 정보

4. 보유 및 이용 기간
- 서비스 제공 완료 및 관계 법령에 따른 보존 기간까지`;
        break;
      case "이용약관":
        content = `[서비스 이용약관]

제1조 (목적)
본 약관은 훌라후프(이하 "회사")가 제공하는 서비스의 이용 조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"라 함은 회사가 제공하는 모든 온라인 서비스를 의미합니다.
2. "회원"이라 함은 회사와 서비스 이용 계약을 체결하고 이용자 아이디를 부여받은 자를 말합니다.

제3조 (약관의 효력 및 변경)
회사는 본 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 공지함으로써 효력이 발생합니다.`;
        break;
      default:
        content = "내용을 불러올 수 없습니다.";
    }
    setTermsTitle(title);
    setTermsContent(content);
    setShowTermsModal(true);
  };

  if (loading) return <p className="loading-text">회원 정보를 불러오는 중...</p>;

  return (
    <div className="mypage-screen">
      <h2 className="mypage-title">
        계정 관리 <span className="version">v1.6.1</span>
      </h2>

      <div className="mypage-container">
        <div className="mypage-body">
          {/* 섹션 1: 계정 정보 (내정보 + 알림 + 수정버튼) */}
          <section className="mypage-section account-section">
            <h2>계정 정보</h2>

            <div className="mypage-field">
              <label>이름</label>
              <input type="text" name="name" value={member.name} disabled />
            </div>
            <div className="mypage-field">
              <label>이메일</label>
              <input type="text" name="email" value={member.email || ""} onChange={handleChange} />
            </div>
            <div className="mypage-field">
              <label>전화번호</label>
              <input type="text" name="phoneNum" value={member.phoneNum} onChange={handleChange} />
            </div>
            <div className="mypage-field">
              <label>주소</label>
              <input type="text" name="address" value={member.address} onChange={handleChange} />
            </div>

            <div className="notification-checkbox">
              <input
                type="checkbox"
                id="notification"
                checked={member.notificationStatus === "Y"}
                onChange={handleNotificationToggle}
              />
              <label htmlFor="notification">이메일 알림 동의</label>
            </div>

            <button className="btn-update" onClick={handleUpdate}>수정</button>
          </section>

          {/* 섹션 2: 비밀번호 변경 */}
          <div className="password-change-section">
            <h3 onClick={() => setShowPasswordChange(!showPasswordChange)} className="password-toggle">
              비밀번호 변경 {showPasswordChange ? "▲" : "▼"}
            </h3>
            {showPasswordChange && (
              <div className="password-form">
                <div className="mypage-field">
                  <label>현재 비밀번호</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="현재 비밀번호 입력"
                  />
                </div>
                <div className="mypage-field">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="새 비밀번호 입력"
                  />
                </div>
                <div className="mypage-field">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="새 비밀번호 확인"
                  />
                </div>
                <button className="btn-password-change" onClick={handlePasswordChange}>
                  비밀번호 변경하기
                </button>
              </div>
            )}
          </div>

          {/* 섹션 3: 이용약관 */}
          <section className="mypage-section terms-section">
            <h2>이용약관</h2>
            <ul className="mypage-list">
              <li onClick={() => handleTermsClick("개인정보 수집 동의서")}>개인정보 수집 동의서</li>
              <li onClick={() => handleTermsClick("위치제공 동의서")}>위치제공 동의서</li>
              <li onClick={() => handleTermsClick("제3자 개인정보 제공 동의서")}>제3자 개인정보 제공 동의서</li>
              <li onClick={() => handleTermsClick("이용약관")}>이용약관</li>
            </ul>
          </section>

          {/* 탈퇴 버튼 (맨 하단) */}
          <div className="mypage-delete-section">
            <button className="btn-delete" onClick={handleDelete}>회원 탈퇴</button>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <TermsModal
          title={termsTitle}
          content={termsContent}
          onClose={() => setShowTermsModal(false)}
        />
      )}
    </div>
  );
}
