// src/pages/CancellationHistoryPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios"; // axiosInstance 없이 member/info를 직접 호출할 때 쓰는 일반 axios
import axiosInstance from "../api/axiosInstance";
import "./CancellationHistoryPage.css";

const CancellationHistoryPage = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 회원 정보 상태 (이름은 타이틀에, 코드는 내역 조회 쿼리에 씀)
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    const fetchMemberAndHistory = async () => {
      try {
        setLoading(true);
        setError("");

        // 토큰 꺼내오기
        const token = sessionStorage.getItem("user_jwt");
        if (!token) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        // 회원 정보 가져오기 (member_code, name 추출용)
        const memberRes = await axios.get(
          "http://localhost:8090/api/member/info",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { memberCode, name } = memberRes.data;
        setMemberCode(memberCode);
        setMemberName(name);

        // 취소/환불 내역 가져오기 (status=R인 거래만)
        const response = await axiosInstance.get(
          `/api/history/${memberCode}`,
          {
            params: { status: "R" }, // status=R(Refund/취소환불)인 내역만
          }
        );

        setHistories(response.data || []);
      } catch (err) {
        console.error("취소 내역 조회 실패:", err);
        setError("취소 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberAndHistory();
  }, []); // 마운트 최초 1회

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

  const totalRefundAmount = histories.reduce(
    (sum, item) => sum + (item.amountUsed || 0),
    0
  );

  const cancellationCount = histories.length;

  const lastCancellationDate = histories.reduce((latest, item) => {
    if (!item.paymentDate) return latest;
    const cur = formatDate(item.paymentDate);
    if (!latest) return cur;
    return cur > latest ? cur : latest;
  }, "");

  return (
    <div className="cancellation-history">
      <h2 className="cancellation-history__top-left-title">
        {memberName ? (
          <>
            <span className="cancellation-history__title-highlight">
              {memberName}
            </span>
            님의 취소 내역
          </>
        ) : (
          "취소 내역"
        )}
      </h2>

      {/* 헤더 영역 */}
      <header className="cancellation-history__header">
        {/* 상단 요약 카드 */}
        <div className="cancellation-history__summary">
          <div className="summary-card">
            <span className="summary-card__label">총 취소</span>
            <strong className="summary-card__value">
              {cancellationCount}건
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">환불 금액 합계</span>
            <strong className="summary-card__value">
              {formatAmount(totalRefundAmount)}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">최근 취소일</span>
            <strong className="summary-card__value">
              {lastCancellationDate || "-"}
            </strong>
          </div>
        </div>
      </header>

      {/* 본문 영역 */}
      <main className="cancellation-history__body">
        {loading && (
          <p className="cancellation-history__message">
            취소 내역을 불러오는 중입니다...
          </p>
        )}

        {!loading && error && (
          <p className="cancellation-history__message cancellation-history__message--error">
            {error}
          </p>
        )}

        {!loading && !error && histories.length === 0 && (
          <p className="cancellation-history__message">
            취소 내역이 없어요.
          </p>
        )}

        {!loading && !error && histories.length > 0 && (
          <section className="cancellation-history__list-wrapper">
            <div className="cancellation-history__list-header">
              <span className="cancellation-history__list-title">
                취소 내역 {cancellationCount}건
              </span>
              <span className="cancellation-history__list-caption">
                최근 취소 순으로 정렬되어 있어요.
              </span>
            </div>

            <ul className="cancellation-history__list">
              {histories.map((item, index) => (
                <li
                  key={item.transactionNum || index}
                  className="cancellation-history__item"
                >
                  {/* 상단: 상호명 / 날짜 / 금액 / 상태 */}
                  <div className="cancellation-history__item-main">
                    <div className="cancellation-history__item-left">
                      <div className="cancellation-history__merchant-row">
                        <span className="cancellation-history__merchant">
                          {item.merchantName}
                        </span>
                      </div>
                      <div className="cancellation-history__meta-row">
                        <span className="cancellation-history__meta">
                          취소일 · {formatDate(item.paymentDate)}
                        </span>
                        {formatPeriod(item.startDate, item.endDate) && (
                          <span className="cancellation-history__meta">
                            이용기간 ·{" "}
                            {formatPeriod(item.startDate, item.endDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="cancellation-history__item-right">
                      <span className="cancellation-history__amount">
                        {formatAmount(item.amountUsed)}
                      </span>
                      <span
                        className={`cancellation-history__status cancellation-history__status--${(item.status || "").toLowerCase()
                          }`}
                      >
                        {formatStatusText(item.status)}
                      </span>
                    </div>
                  </div>

                  {/* 하단: 예약번호 */}
                  <div className="cancellation-history__item-footer">
                    <div className="cancellation-history__footer-left">
                      <span className="cancellation-history__transaction-label">거래번호: </span>
                      <span className="cancellation-history__transaction">
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

export default CancellationHistoryPage;
