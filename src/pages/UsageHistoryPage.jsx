// src/pages/UsageHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import './UsageHistoryPage.css';

const UsageHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberName, setMemberName] = useState(''); // memberName 상태 추가
  
  useEffect(() => {
    const fetchMemberCodeAndUsageHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("user_jwt");
        if (!token) {
          throw new Error("로그인이 필요합니다.");
        }

        // 1. 회원 정보 조회
        const memberInfoResponse = await axiosInstance.get('/api/member/info');
        const memberCode = memberInfoResponse.data.memberCode;
        setMemberName(memberInfoResponse.data.name); // memberName 대신 name 키를 사용

        if (!memberCode) {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
        }

        // 2. 이용 내역 조회
        const response = await axiosInstance.get(`/api/history/${memberCode}?status=S`);
        setHistory(response.data);
      } catch (err) {
        console.error("이용내역 로딩 오류:", err);
        setError(err.message || "이용내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberCodeAndUsageHistory();
  }, []);

  if (loading) {
    return <div className="history-status">이용내역을 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="history-status error">{error}</div>;
  }

  return (
    <div className="history-page">
      <h1 className="page-title">{memberName ? `${memberName}님의 이용 내역` : '이용 내역'}</h1>
      {history.length === 0 ? (
        <div className="history-status">이용내역이 없습니다.</div>
      ) : (
        <ul className="history-list">
          {history.map((item) => (
            <li key={item.transaction_num} className="history-item">
              <div className="item-header">
                <span className="merchant-name">{item.merchant_name}</span>
                <span className="payment-date">{formatDate(item.payment_date)}</span>
              </div>
              <div className="item-body">
                <div className="item-row">
                  <span className="item-label">이용 기간</span>
                  <span className="item-value">{formatDate(item.start_date)} ~ {formatDate(item.end_date)}</span>
                </div>
                <div className="item-row">
                  <span className="item-label">금액</span>
                  <span className="item-value amount">{formatAmount(item.amount_used)}</span>
                </div>
              </div>
              <div className="item-footer">
                <span className="status completed">이용 완료</span>
                <span className="transaction-num">{formatTransactionNum(item.transaction_num)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UsageHistoryPage;