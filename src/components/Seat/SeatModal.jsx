import React, { useState, useEffect } from "react";
import SeatMap from "./SeatMap";
import axiosInstance from "../../api/axiosInstance";
import "./SeatModal.css";

export default function SeatModal({ open, onClose, scheduleNum, userId }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open) {
      setSelectedSeats([]);
      setRefreshKey(prev => prev + 1);

      setTimeout(() => {
        window.refreshSeats?.();
      }, 50);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      alert("좌석을 선택해주세요!");
      return;
    }

    try {
      for (const seat of selectedSeats) {
        await axiosInstance.post("/api/movies/book-seat", {
          scheduleNum,
          seatCode: seat.seatCode,
        });
      }

      // ✅ DB 저장 성공
      alert("✅ 좌석 예약 완료!");

      // ✅ 좌석 최신화
      window.refreshSeats?.();

      // ✅ AI 시나리오 종료 + 메시지 출력
      const res = await axiosInstance.post(`/api/chat/complete-seat?userId=${userId}`);
      const aiMsg = res.data?.message || `✅ 좌석 선택이 완료되었습니다!\n💳 10분 내 결제해주세요.`;

      alert(aiMsg);

      // ✅ 모달 닫기
      onClose();

    } catch (err) {
      alert("❌ 예약 실패: " + err.response?.data);
    }
  };

  return (
    <div className="seat-modal-overlay">
      <div className="seat-modal-container">
        <div className="seat-modal-header">
          <h2>좌석 선택</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="seat-modal-body">
          <SeatMap
            key={refreshKey}
            scheduleNum={scheduleNum}
            selectedSeats={selectedSeats}
            setSelectedSeats={setSelectedSeats}
          />
        </div>

        <div className="seat-modal-footer">
          <button className="seat-confirm-btn" onClick={handleConfirm}>
            좌석 선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}
