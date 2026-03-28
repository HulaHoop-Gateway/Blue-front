import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./SeatMap.css";
import React from "react";

// 실제 좌석 배치도를 그려주는 컴포넌트
// scheduleNum을 받아서 해당 상영 회차의 좌석 목록을 API로 조회하고,
// row_label(A,B,C...)별로 묶어서 행 단위로 렌더링함.
export default function SeatMap({ scheduleNum, selectedSeats, setSelectedSeats }) {
  const [seats, setSeats] = useState([]); // 전체 좌석 데이터 (통로 포함)

  // 좌석 목록 API 조회
  // scheduleNum 없으면 무의미하니까 바로 리턴
  async function fetchSeats() {
    if (!scheduleNum) return;
    try {
      const res = await axiosInstance.get(`/api/movies/seats?scheduleNum=${scheduleNum}`);
      setSeats(res.data || []);
    } catch (err) {
      console.error("좌석 정보 조회 실패:", err);
      setSeats([]);
    }
  }

  useEffect(() => {
    fetchSeats();
    // 전역 함수 등록: SeatModal에서도 좌석 새로고침을 트리거할 수 있게 window에 달아둠
    // 언마운트 시엔 null로 정리해야 메모리 누수 없음
    window.refreshSeats = () => fetchSeats();
    return () => { window.refreshSeats = null; };
  }, [scheduleNum]);

  // 좌석 클릭 핸들러
  // 통로(is_aisle===1)는 클릭해도 아무것도 안 함
  // 이미 선택된 좌석 클릭하면 선택 해제, 아니면 추가
  const handleSeatClick = (seat) => {
    if (!seat || !seat.seat_code || seat.is_aisle === 1) return;

    const alreadySelected = selectedSeats.some(s => s.seatCode === seat.seat_code);
    if (alreadySelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seatCode !== seat.seat_code));
    } else {
      setSelectedSeats([
        ...selectedSeats,
        { seatCode: seat.seat_code, row: seat.row_label, col: seat.col_num }
      ]);
    }
  };

  // 좌석 배열을 row_label 기준으로 그루핑 (예: A열, B열, C열...)
  const rows = seats.reduce((acc, s) => {
    if (!s.row_label) return acc;
    acc[s.row_label] = acc[s.row_label] || [];
    acc[s.row_label].push(s);
    return acc;
  }, {});

  return (
    <div className="seat-wrapper">
      <div className="screen">SCREEN</div>
      <div className="seat-area">
        {Object.keys(rows).map((row) => (
          <div key={row} className="seat-row">
            <span className="seat-row-label">{row}</span>
            {rows[row]
              .sort((a, b) => a.col_num - b.col_num)
              .map((seat) => {
                if (seat.is_aisle === 1)
                  return <span key={`aisle-${seat.seat_code}`} className="aisle-space"></span>;

                const isSelected = selectedSeats.some(s => s.seatCode === seat.seat_code);
                const raw = seat.reserved;
                // DB나 백엔드 설정에 따라 reserved 값이 boolean, 숫자, 문자열 등 다양하게 내려올 수 있음
                // 어떤 형태로 와도 '예약됨'으로 인식하도록 방어적으로 처리
                const isReserved =
                  raw === true || raw === 1 || raw === "1" ||
                  String(raw).toUpperCase() === "TRUE" ||
                  String(raw).toUpperCase() === "Y" ||
                  String(raw).toUpperCase() === "YES";

                const isAvailable = !isReserved;

                return (
                  <button
                    key={seat.seat_code}
                    className={`seat-btn ${isSelected ? "selected" : ""} ${isAvailable ? "open" : "taken"}`}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && handleSeatClick(seat)}
                  >
                    {seat.col_num}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
