// src/pages/ReservationHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import axios from "axios";
import axiosInstance from '../api/axiosInstance';
import './ReservationHistoryPage.css';

const ReservationHistoryPage = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [lastReservationDate, setLastReservationDate] = useState("");

  const fetchReservationHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("user_jwt");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const memberInfoResponse = await axios.get(
        "http://localhost:8090/api/member/info",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { memberCode, name } = memberInfoResponse.data;
      setMemberName(name);

      if (!memberCode) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const response = await axiosInstance.get(`/api/history/${memberCode}`, {
        params: { status: "P" }, // 예약 내역만
      });
      setHistories(response.data || []);

      const latestDate = (response.data || []).reduce((latest, item) => {
        if (!item.paymentDate) return latest;
        const cur = formatDate(item.paymentDate);
        if (!latest) return cur;
        return cur > latest ? cur : latest;
      }, "");
      setLastReservationDate(latestDate);

    } catch (err) {
      console.error("예약내역 로딩 오류:", err);
      setError(err.message || "예약내역을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservationHistory();
  }, []);

  const handleCancel = async (transactionNum) => {
    if (window.confirm("정말로 이 예약을 취소하시겠습니까?")) {
      try {
        await axiosInstance.put("/api/history/cancel", { transactionNum });
        alert("예약이 성공적으로 취소되었습니다.");
        // Refetch or remove the item from state
        setHistories(histories.filter(item => item.transactionNum !== transactionNum));
      } catch (err) {
        console.error("Failed to cancel reservation:", err);
        alert("예약 취소 중 오류가 발생했습니다.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.toString().substring(0, 10);
  };

  const formatAmount = (amount) => {
    if (amount == null) return "0";
    return `${Number(amount).toLocaleString()}원`;
  };
  
  const formatTransactionNum = (num) => {
    if (num == null) return "";
    return `#${String(num).padStart(4, "0")}`;
  };

  const formatPeriod = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (!start && !end) return "";
    if (start === end) return start;
    return `${start} ~ ${end}`;
  };

  const formatStatusText = (status) => {
    if (status === "S") return "이용 완료";
    if (status === "R") return "취소/환불";
    if (status === "P") return "예약 완료";
    return status || "";
  };

  const totalAmount = histories.reduce(
    (sum, item) => sum + (item.amountUsed || 0),
    0
  );

  return (
    <div className="reservation-history">
      <h2 className="reservation-history__top-left-title">
        {memberName ? (
          <>
            <span className="reservation-history__title-highlight">
              {memberName}
            </span>
            님의 예약 내역
          </>
        ) : (
          "예약 내역"
        )}
      </h2>

      <header className="reservation-history__header">
        <div className="reservation-history__summary">
          <div className="summary-card">
            <span className="summary-card__label">총 예약</span>
            <strong className="summary-card__value">
              {histories.length}건
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">예약 금액 합계</span>
            <strong className="summary-card__value">
              {formatAmount(totalAmount)}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">최근 예약일</span>
            <strong className="summary-card__value">
              {lastReservationDate || "-"}
            </strong>
          </div>
        </div>
      </header>

      <main className="reservation-history__body">
        {loading && (
          <p className="reservation-history__message">
            예약내역을 불러오는 중입니다...
          </p>
        )}

        {!loading && error && (
          <p className="reservation-history__message reservation-history__message--error">
            {error}
          </p>
        )}

        {!loading && !error && histories.length === 0 && (
          <p className="reservation-history__message">
            아직 예약내역이 없어요.
          </p>
        )}

        {!loading && !error && histories.length > 0 && (
          <section className="reservation-history__list-wrapper">
            <div className="reservation-history__list-header">
              <span className="reservation-history__list-title">
                예약 내역 {histories.length}건
              </span>
              <span className="reservation-history__list-caption">
                최근 예약 순으로 정렬되어 있어요.
              </span>
            </div>

            <ul className="reservation-history__list">
              {histories.map((item, index) => (
                <li
                  key={item.transactionNum || index}
                  className="reservation-history__item"
                >
                  <div className="reservation-history__item-main">
                    <div className="reservation-history__item-left">
                      <div className="reservation-history__merchant-row">
                        <span className="reservation-history__merchant">
                          {item.merchantName}
                        </span>
                      </div>
                      <div className="reservation-history__meta-row">
                        <span className="reservation-history__meta">
                          예약일 · {formatDate(item.paymentDate)}
                        </span>
                        {formatPeriod(item.startDate, item.endDate) && (
                          <span className="reservation-history__meta">
                            이용기간 ·{" "}
                            {formatPeriod(item.startDate, item.endDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="reservation-history__item-right">
                      <span className="reservation-history__amount">
                        {formatAmount(item.amountUsed)}
                      </span>
                      <span
                        className={`reservation-history__status reservation-history__status--${
                          (item.status || "").toLowerCase()
                        }`}
                      >
                        {formatStatusText(item.status)}
                      </span>
                    </div>
                  </div>

                  <div className="reservation-history__item-footer">
                    <div className="reservation-history__footer-left">
                      <span className="reservation-history__transaction-label">거래번호: </span>
                      <span className="reservation-history__transaction">
                        {formatTransactionNum(item.transactionNum)}
                      </span>
                    </div>
                    <button 
                      className="reservation-history__cancel-button"
                      onClick={() => handleCancel(item.transactionNum)}
                    >
                      예약 취소
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default ReservationHistoryPage;