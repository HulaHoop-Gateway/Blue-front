import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk"; // Toss Payments SDK import

export const Context = createContext();

export const ContextProvider = (props) => {

    const [input, setInput] = useState("");
    const [resultData, setResultData] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [history, setHistory] = useState([]);


    // 🔹 로그인 상태 관리
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [username, setUsername] = useState(localStorage.getItem("username") || null);

    // 🔹 페이지 로드(새로고침) 시 백엔드 세션 초기화
    useEffect(() => {
        const resetSession = async () => {
            try {
                // 토큰이 있든 없든 세션 초기화 요청 (필요하다면 토큰 체크)
                await axiosInstance.post("/api/ai/reset");
                console.log("Session reset on page load");
            } catch (error) {
                console.warn("Failed to reset session on load:", error);
            }
        };
        resetSession();
    }, []); // 빈 배열: 마운트 시 1회 실행

    // 🔹 예약 상태 관리
    const [scheduleNum, setScheduleNum] = useState(null);
    const [seatModalOpen, setSeatModalOpen] = useState(false);
    const [bikeLocations, setBikeLocations] = useState([]);
    const [cinemaLocations, setCinemaLocations] = useState([]);

    // 🔹 결제 상태 관리
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentPhone, setPaymentPhone] = useState("");
    const [actionType, setActionType] = useState(null);

    const login = (newToken, newUsername) => {
        setToken(newToken);
        setUsername(newUsername);
        localStorage.setItem("token", newToken);
        localStorage.setItem("username", newUsername);
    };

    const logout = () => {
        setToken(null);
        setUsername(null);
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setHistory([]); // 로그아웃 시 히스토리 초기화
        newChat();
    };

    const newChat = () => {
        setLoading(false);
        setShowResult(false);
        setHistory([]);
        setScheduleNum(null);
        setSeatModalOpen(false);
        setBikeLocations([]);
        setCinemaLocations([]);
        setPaymentAmount(0);
        setPaymentPhone("");
        setActionType(null);
    }

    // 🔹 Toss Payments 결제 요청
    const requestTossPayment = async (amount, phoneNumber, orderName = "자전거 대여 결제", onSuccess, onError) => {
        try {
            const widget = await loadPaymentWidget(
                import.meta.env.VITE_TOSS_CLIENT_KEY,
                phoneNumber || "GUEST"
            );

            const orderId = crypto.randomUUID();

            const result = await widget.requestPayment({
                orderId,
                orderName, // ✅ 파라미터로 받은 orderName 사용
                amount
            });

            await axiosInstance.post("/api/payments/confirm", {
                paymentKey: result.paymentKey,
                orderId: result.orderId,
                amount: result.amount
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("🔥 결제 실패:", error);

            if (error.code === "USER_CANCEL" || error.message?.includes("cancel")) {
                return;
            }

            if (onError) {
                onError(error);
            }
        }
    };

    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);

        let text = prompt;
        if (!text) {
            text = input;
        }

        // 사용자 메시지 추가
        setHistory(prev => [...prev, { type: "user", text }]);
        setInput("");

        // 🔹 좌석 선택 모달 열기 명령 처리
        if (text === "좌석 선택창 열어줘" || (actionType === 'OPEN_SEAT_MODAL' && text === "네")) {
            if (!scheduleNum) {
                setHistory(prev => [
                    ...prev,
                    { type: "ai", text: "❗ 먼저 영화와 시간 선택 후 좌석을 불러와주세요." }
                ]);
                setLoading(false);
                return;
            }

            setHistory(prev => [
                ...prev,
                { type: "ai", text: "🎬 좌석 선택창을 열게요!" }
            ]);
            setSeatModalOpen(true);
            setLoading(false);
            return;
        }

        // 사용자 입력에 "상세"와 "좌석"이 포함되어 있으면 모달 오픈
        if (text.includes("상세") && text.includes("좌석")) {
            if (!scheduleNum) {
                setHistory(prev => [
                    ...prev,
                    { type: "ai", text: "❗ 먼저 영화와 시간 선택 후 좌석을 불러와주세요." }
                ]);
                setLoading(false);
                return;
            }

            setHistory(prev => [
                ...prev,
                { type: "ai", text: "🎬 좌석 선택창을 열게요!" }
            ]);
            setSeatModalOpen(true);
            setLoading(false);
            return;
        }

        try {
            const res = await axiosInstance.post("/api/ai/ask", { message: text });
            const aiText = res.data?.result || res.data?.message || "";

            // 데이터 추출
            // 🚲 자전거 데이터: 예약 진행 중(actionType이 있거나 결제 단계 등)이 아닐 때만 표시
            // 초기 조회 시에는 actionType이 null이거나 특정 값일 수 있음. 
            // 여기서는 "자전거 예약해줘" -> 목록 보여줌(지도O) -> "1번 선택" -> 상세/결제(지도X) 흐름을 가정.
            // actionType이 'PAYMENT_CONFIRM' 등이면 지도를 안 보여주는 식.
            // 하지만 더 확실한 건, AI가 "목록"을 줄 때만 지도를 띄우는 것.
            // 백엔드에서 목록 줄 때만 bicycles/cinemas 데이터를 채워준다면 프론트는 그대로 쓰면 됨.
            // 만약 백엔드가 계속 데이터를 준다면 프론트에서 걸러야 함.

            // 🎬 영화관 데이터: 예약 진행 중(scheduleNum 등)이 아닐 때만 표시
            let cinemas = (res.data && Array.isArray(res.data.cinemas) && res.data.cinemas.length > 0 && !scheduleNum) ? res.data.cinemas : null;

            // 🚲 자전거 데이터
            let bikes = (res.data && Array.isArray(res.data.bicycles) && res.data.bicycles.length > 0) ? res.data.bicycles : null;

            // 🚫 지도 중복 표시 방지 (강력한 필터링)
            // 사용자가 무언가를 "선택"하거나 "예약"하는 단계라면 지도를 보여주지 않음.
            // 또한 AI 응답에 "결제", "예약" 관련 단어가 있어도 숨김.
            const filterKeywords = ["선택", "예약", "결제", "해줘", "할게"];
            // "해줘"는 "예약해줘" 같은 명령일 수 있으므로 주의. 하지만 "1번 선택해줘" 같은 경우를 잡아야 함.
            // 따라서 "숫자 + 번" 또는 "선택" 키워드가 핵심.

            if (text.includes("선택") || text.includes("번") || text.includes("결제")) {
                cinemas = null;
                bikes = null;
            }

            // AI 응답 텍스트 기반 2차 필터링
            if (aiText.includes("결제") || aiText.includes("예약되었습니다") || aiText.includes("좌석")) {
                cinemas = null;
                bikes = null;
            }

            // JSON 파싱 (결제 정보 등)
            let extractedActionType = null;
            let extractedAmount = null;
            let extractedPhone = null;
            let extractedPaymentType = null; // ✅ 결제 타입 추가

            try {
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[0]);
                    extractedActionType = jsonData.actionType || null;
                    extractedAmount = jsonData.amount ? Number(jsonData.amount) : null;
                    extractedPhone = jsonData.phone ? String(jsonData.phone).replace(/-/g, '') : null;
                    extractedPaymentType = jsonData.paymentType || null; // ✅ 결제 타입 추출

                    // JSON에서 scheduleNum 추출 (더 안정적)
                    if (jsonData.scheduleNum) {
                        setScheduleNum(Number(jsonData.scheduleNum));
                    }

                    /** scheduleNum 추출 (백업: 정규식) */
                    const match =
                        aiText.match(/"scheduleNum"\s*:\s*([0-9]+)/i) ||
                        aiText.match(/scheduleNum\s*[:=]\s*([0-9]+)/i) ||
                        aiText.match(/<!--\s*scheduleNum\s*:\s*([0-9]+)\s*-->/i);

                    if (match && !jsonData.scheduleNum) setScheduleNum(Number(match[1]));

                    // 상태 업데이트
                    if (extractedAmount) setPaymentAmount(extractedAmount);
                    if (extractedPhone) setPaymentPhone(extractedPhone);
                    if (extractedActionType) {
                        setActionType(extractedActionType);
                        if (extractedActionType === 'OPEN_SEAT_MODAL') {
                            setSeatModalOpen(true);
                        }

                        // 🚲 자전거: 결제/예약 진행 단계(ActionType 존재)면 지도 숨김
                        if (extractedActionType === 'PAYMENT_CONFIRM' || extractedActionType === 'BIKE_RESERVE') {
                            bikes = null;
                        }
                    }
                }
            } catch (e) {
                console.error("JSON parsing error", e);
            }

            // 추가: 텍스트에 "결제"나 "예약" 관련 내용이 명확하면 지도 숨김 (안전장치)
            if (aiText.includes("결제") || aiText.includes("예약되었습니다")) {
                bikes = null;
                // 영화는 scheduleNum으로 이미 제어됨
            }

            // 지도 데이터 상태 업데이트 (타이핑 중 표시를 위해)
            if (bikes) setBikeLocations(bikes);
            else setBikeLocations([]);

            if (cinemas) setCinemaLocations(cinemas);
            else setCinemaLocations([]);

            // 화면 표시용 텍스트 정리 (JSON 제거)
            let displayText = aiText.replace(/\{[\s\S]*\}/g, "").trim();

            // 불필요한 공백 정리
            displayText = displayText.replace(/\n\s*\n/g, "\n\n");

            let modified = displayText
                .split("**")
                .map((v, i) => (i % 2 ? `<b>${v}</b>` : v))
                .join("")
                .replace(/\*/g, "<br />");

            setLoading(false); // 로딩 종료

            // ✍️ 타이핑 효과 구현 (글자 단위)
            const characters = modified.split("");

            // 깜빡임 방지
            if (characters.length > 0) {
                characters.forEach((char, i) => {
                    setTimeout(() => {
                        setResultData(prev => prev + char);
                    }, 10 * i); // 속도: 10ms (0.01초)
                });
            }

            // 타이핑 종료 후 히스토리 추가
            setTimeout(() => {
                setHistory(prev => [...prev, {
                    type: "ai",
                    text: modified,
                    bikeData: bikes,
                    cinemaData: cinemas,
                    action: extractedActionType || undefined,
                    amount: extractedAmount || undefined,
                    phone: extractedPhone || undefined,
                    paymentType: extractedPaymentType || undefined // ✅ 결제 타입 추가
                }]);
                setResultData("");
                // 지도 상태 초기화 (History로 넘어갔으므로)
                setBikeLocations([]);
                setCinemaLocations([]);
            }, 10 * characters.length + 200);

        } catch (error) {
            console.error("Error:", error);
            setLoading(false);
            setResultData("에러가 발생했습니다. 다시 시도해주세요.");
        }
    };

    const contextValue = {
        token, username, login, logout,
        input, setInput, onSent, showResult,
        loading, resultData, history, setHistory, newChat,
        scheduleNum, setScheduleNum, seatModalOpen, setSeatModalOpen,
        bikeLocations, setBikeLocations,
        cinemaLocations, setCinemaLocations,
        paymentAmount, setPaymentAmount,
        paymentPhone, setPaymentPhone,
        actionType, setActionType,
        requestTossPayment
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;
