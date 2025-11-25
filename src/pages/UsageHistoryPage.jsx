// src/pages/UsageHistoryPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "../api/axiosInstance";
import "./UsageHistoryPage.css";

const UsageHistoryPage = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    const fetchMemberAndHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("user_jwt");
        if (!token) {
          setError("로그인이 필요합니다.");
          return;
        }

        const memberRes = await axios.get(
          "http://localhost:8090/api/member/info",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { memberCode, name } = memberRes.data;
        setMemberCode(memberCode);
        setMemberName(name);

        const historyRes = await axiosInstance.get(
          `/api/history/${memberCode}`,
          {
            params: { status: "S" }, // 이용내역만
          }
        );

        setHistories(historyRes.data || []);
      } catch (err) {
        console.error("Failed to fetch usage history:", err);
        setError("이용내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberAndHistory();
  }, []);

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
    <div className="usage-history">
      <h2 className="usage-history__top-left-title">
        {memberName ? (
          <>
            <span className="usage-history__title-highlight">
              {memberName}
            </span>
            님의 이용 내역
          </>
        ) : (
          "이용 내역"
        )}
      </h2>

      <header className="usage-history__header">
        <div className="usage-history__summary">
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

      <main className="usage-history__body">
        {loading && (
          <p className="usage-history__message">
            이용내역을 불러오는 중입니다...
          </p>
        )}

        {!loading && error && (
          <p className="usage-history__message usage-history__message--error">
            {error}
          </p>
        )}

        {!loading && !error && histories.length === 0 && (
          <p className="usage-history__message">
            아직 이용내역이 없어요.
            <br />
            첫 예약을 시작해볼까요?
          </p>
        )}

        {!loading && !error && histories.length > 0 && (
          <section className="usage-history__list-wrapper">
            <div className="usage-history__list-header">
              <span className="usage-history__list-title">
                이용 내역 {completedCount}건
              </span>
              <span className="usage-history__list-caption">
                최근 이용 순으로 정렬되어 있어요.
              </span>
            </div>

            <ul className="usage-history__list">
              {histories.map((item, index) => (
                <li
                  key={item.transactionNum || index}
                  className="usage-history__item"
                >
                  <div className="usage-history__item-main">
                    <div className="usage-history__item-left">
                      <div className="usage-history__merchant-row">
                        <span className="usage-history__merchant">
                          {item.merchantName}
                        </span>
                      </div>
                      <div className="usage-history__meta-row">
                        <span className="usage-history__meta">
                          이용일 · {formatDate(item.paymentDate)}
                        </span>
                        {formatPeriod(item.startDate, item.endDate) && (
                          <span className="usage-history__meta">
                            이용기간 ·{" "}
                            {formatPeriod(item.startDate, item.endDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="usage-history__item-right">
                      <span className="usage-history__amount">
                        {formatAmount(item.amountUsed)}
                      </span>
                      <span
                        className={`usage-history__status usage-history__status--${
                          (item.status || "").toLowerCase()
                        }`}
                      >
                        {formatStatusText(item.status)}
                      </span>
                    </div>
                  </div>

                  <div className="usage-history__item-footer">
                    <div className="usage-history__footer-left">
                      <span className="usage-history__transaction-label">거래번호: </span>
                      <span className="usage-history__transaction">
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

export default UsageHistoryPage;
