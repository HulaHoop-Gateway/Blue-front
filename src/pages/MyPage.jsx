import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyPage.css";

export default function MyPage() {
  const [member, setMember] = useState({
    name: "",
    phoneNum: "",
    email: "",
    address: "",
    notificationStatus: "N",
  });

  const [loading, setLoading] = useState(true);

  // 회원정보 불러오기
  const fetchMemberInfo = async () => {
    try {
      const token = localStorage.getItem("user_jwt");
      if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login";
        return;
      }

      const response = await axios.get("http://localhost:8090/api/member/info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMember(response.data);
    } catch (error) {
      console.error("❌ 회원정보 불러오기 실패:", error);
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
    const token = localStorage.getItem("user_jwt");
    try {
      await axios.patch("http://localhost:8090/api/member/update", member, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("회원정보가 수정되었습니다.");
    } catch (error) {
      console.error("❌ 회원정보 수정 실패:", error);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  };

  // 회원 탈퇴
  const handleDelete = async () => {
    if (!window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    const token = localStorage.getItem("user_jwt");
    try {
      await axios.delete("http://localhost:8090/api/member/delete", {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("회원 탈퇴가 완료되었습니다.");
      localStorage.removeItem("user_jwt");
      window.location.href = "/";
    } catch (error) {
      console.error("❌ 회원 탈퇴 실패:", error);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <p className="loading-text">회원 정보를 불러오는 중...</p>;

  return (
    <div className="mypage-screen">
      <aside className="sidebar-space" />
      <div className="mypage-wrapper">
        <div className="mypage-container">
          <header className="mypage-header">
            <h1>계정</h1>
            <span className="version">v1.6.1</span>
          </header>

          <div className="mypage-body">
            <section className="mypage-section">
              <h2>내정보</h2>
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
            </section>

            <section className="mypage-section">
              <h2>알림 설정</h2>
              <ul className="mypage-list">
                <li>
                  <input
                    type="checkbox"
                    checked={member.notificationStatus === "Y"}
                    onChange={handleNotificationToggle}
                  />
                  카카오톡 알림 동의
                </li>
              </ul>
            </section>

            <section className="mypage-section">
              <h2>약관</h2>
              <ul className="mypage-list static">
                <li>개인정보 수집 동의서</li>
                <li>위치제공 동의서</li>
                <li>제3자 개인정보 제공 동의서</li>
                <li>이용약관</li>
              </ul>
            </section>
          </div>

          {/* 🚀 하단 버튼 */}
          <div className="mypage-actions">
            <button className="btn-update" onClick={handleUpdate}>수정</button>
            <button className="btn-delete" onClick={handleDelete}>탈퇴</button>
          </div>
        </div>
      </div>
    </div>
  );
}
