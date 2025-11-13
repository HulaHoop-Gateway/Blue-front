import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./SeatMap.css";
import React from "react";

export default function SeatMap({ scheduleNum, selectedSeats, setSelectedSeats }) {
  const [seats, setSeats] = useState([]);

  async function fetchSeats() {
    if (!scheduleNum) return;
    try {
      const res = await axiosInstance.get(`/api/movies/seats?scheduleNum=${scheduleNum}`);
      setSeats(res.data || []);
    } catch (err) {
      console.error("좌석 정보를 불러오는 데 실패했습니다:", err);
      setSeats([]);
    }
  }

  useEffect(() => {
    fetchSeats();
    window.refreshSeats = () => fetchSeats();
    return () => { window.refreshSeats = null; };
  }, [scheduleNum]);

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
