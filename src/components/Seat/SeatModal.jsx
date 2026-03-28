import React, { useState, useEffect, useContext } from "react";
import SeatMap from "./SeatMap";
import axiosInstance from "../../api/axiosInstance";
import "./SeatModal.css";
import { Context } from "../../context/Context";

// 좌석 선택 모달
// AI가 '영화 예약' 플로우 중에 scheduleNum을 Context에 세팅하면 이 모달이 뜸.
// 모달이 열릴 때마다 선택 좌석 초기화 + 최신 좌석 상태 재조회
export default function SeatModal({ open, onClose, scheduleNum, userId }) {
  const { onSent } = useContext(Context);
  const [selectedSeats, setSelectedSeats] = useState([]); // 현재 선택한 좌석 목록
  const [refreshKey, setRefreshKey] = useState(0); // SeatMap 강제 리마운트용 키

  useEffect(() => {
    if (open) {
      setSelectedSeats([]); // 이전 선택 초기화
      setRefreshKey(prev => prev + 1); // SeatMap 키 바꿔서 재마운트 유도
      setTimeout(() => {
        window.refreshSeats?.(); // 전역에 달아둔 좌석 재조회 함수 실행 (50ms 딜레이로 DOM 안정화 대기)
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
      // DB 저장은 여기서 안 함 - 결제 완료 시점에 저장하는 방식으로 설계됨
      // (아래 주석 처리된 코드가 원래 의도였으나, 결제 전에 미리 저장하면
      //  결제 실패 시 유령 예약이 생길 수 있어서 제거함)
      /*
      for (const seat of selectedSeats) {
        await axiosInstance.post("/api/movies/book-seat", {
          scheduleNum,
          seatCode: seat.seatCode,
        });
      }
      */

      // 선택한 좌석 코드를 문자열로 만들어 AI 채팅에 '사용자 메시지'로 전달
      // 예: "A2 B3" 형태 -> Context의 onSent가 받아서 다음 예약 플로우 진행
      const seatNames = selectedSeats.map(s => s.row + s.col).join(" ");
      if (onSent) onSent(seatNames);

      onClose();

    } catch (err) {
      alert("좌석 선택 처리 중 오류 발생: " + err.message);
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
