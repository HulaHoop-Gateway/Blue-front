// src/pages/ReservationHistoryPage.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "./ReservationHistoryPage.css";

const ReservationHistoryPage = () => {
  // TODO: 실제로는 로그인한 사용자 정보에서 memberCode 받아오는 로직으로 교체
  const memberCode = "U000000001";

  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get(`/api/history/${memberCode}`, {
          params: { status: "S" }, // 이용내역만
        });

        setHistories(response.data || []);
      } catch (err) {
        console.error("Failed to fetch reservation history:", err);
        setError("이용내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [memberCode]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.toString().substring(0, 10);
  };

  const formatAmount = (amount) => {
    if (amount == null) return "";
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
    return status || "";
  };

  const memberName = histories.length > 0 ? histories[0].memberName : "";

  const totalAmount = histories.reduce(
    (sum, item) => sum + (item.amountUsed || 0),
    0
  );

  const completedCount = histories.filter(
    (item) => item.status === "S"
  ).length;

  const lastUsedDate = histories.reduce((latest, item) => {
    if (!item.paymentDate) return latest;
    const cur = formatDate(item.paymentDate);
    if (!latest) return cur;
    return cur > latest ? cur : latest;
  }, "");

  return (
    <div className="reservation-history">
      <h2 className="reservation-history__top-left-title">
        {memberName ? (
          <>
            <span className="reservation-history__title-highlight">
              {memberName}
            </span>
            님의 이용 내역
          </>
        ) : (
          "이용 내역"
        )}
      </h2>

      {/* 헤더 영역 */}
      <header className="reservation-history__header">

        {/* 상단 요약 카드 */}
        <div className="reservation-history__summary">
          <div className="summary-card">
            <span className="summary-card__label">총 이용</span>
            <strong className="summary-card__value">
              {histories.length}건
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">이용 금액 합계</span>
            <strong className="summary-card__value">
              {formatAmount(totalAmount)}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">최근 이용일</span>
            <strong className="summary-card__value">
              {lastUsedDate || "-"}
            </strong>
          </div>
        </div>
      </header>

      {/* 본문 영역 */}
      <main className="reservation-history__body">
        {loading && (
          <p className="reservation-history__message">
            이용내역을 불러오는 중입니다...
          </p>
        )}

        {!loading && error && (
          <p className="reservation-history__message reservation-history__message--error">
            {error}
          </p>
        )}

        {!loading && !error && histories.length === 0 && (
          <p className="reservation-history__message">
            아직 이용내역이 없어요.
            <br />
            첫 예약을 시작해볼까요?
          </p>
        )}

        {!loading && !error && histories.length > 0 && (
          <section className="reservation-history__list-wrapper">
            <div className="reservation-history__list-header">
              <span className="reservation-history__list-title">
                이용 내역 {completedCount}건
              </span>
              <span className="reservation-history__list-caption">
                최근 이용 순으로 정렬되어 있어요.
              </span>
            </div>

            <ul className="reservation-history__list">
              {histories.map((item, index) => (
                <li
                  key={item.transactionNum || index}
                  className="reservation-history__item"
                >
                  {/* 상단: 상호명 / 날짜 / 금액 / 상태 */}
                  <div className="reservation-history__item-main">
                    <div className="reservation-history__item-left">
                      <div className="reservation-history__merchant-row">
                        <span className="reservation-history__merchant">
                          {item.merchantName}
                        </span>
                      </div>
                      <div className="reservation-history__meta-row">
                        <span className="reservation-history__meta">
                          이용일 · {formatDate(item.paymentDate)}
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

                  {/* 하단: 회원 / 예약번호 / 액션 */}
                  <div className="reservation-history__item-footer">
                    <div className="reservation-history__footer-right">
                      <span className="reservation-history__transaction">
                        {formatTransactionNum(item.transactionNum)}
                      </span>
                    </div>
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
