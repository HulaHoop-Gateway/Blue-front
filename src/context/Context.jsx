import { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import React from "react";
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";

export const Context = createContext();

export const ContextProvider = ({ token, setToken, children }) => {
    const [username, setUsername] = useState("");
    const [input, setInput] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [history, setHistory] = useState([]);
    const [typingLock, setTypingLock] = useState(false);

    const [scheduleNum, setScheduleNum] = useState(null);
    const [seatModalOpen, setSeatModalOpen] = useState(false);
    const [bikeLocations, setBikeLocations] = useState([]);

    // ✨ 결제에 필요한 상태 추가
    const [paymentAmount, setPaymentAmount] = useState(null);
    const [paymentPhone, setPaymentPhone] = useState(null);
    const [actionType, setActionType] = useState(null);

    /** ------------------------
     *  🔐 로그인 / 로그아웃
     * ------------------------ */
    const login = (jwt, user) => {
        localStorage.setItem("user_jwt", jwt);
        setToken(jwt);
        setUsername(user || "");
        newChat();
    };

    const logout = async () => {
        const token = localStorage.getItem("user_jwt");
        if (token) {
            try {
                await axiosInstance.post("/api/ai/reset");
            } catch (e) {
                console.warn("AI reset failed (logout):", e);
            }
        }

        localStorage.removeItem("user_jwt");
        setToken(null);
        setUsername("");
        newChat(); // 로컬 클리어
    };

    /** 텍스트 타이핑 효과 */
    const delayPara = (i, w) => {
        setTimeout(() => setResultData(prev => prev + w), 75 * i);
    };

    // ✅ 토스페이먼츠 결제 요청 함수
    const requestTossPayment = async (amount, phoneNumber, onSuccess, onError) => {
        try {
            const widget = await loadPaymentWidget(
                import.meta.env.VITE_TOSS_CLIENT_KEY,
                phoneNumber || "GUEST"
            );

            const orderId = crypto.randomUUID();

            const result = await widget.requestPayment({
                orderId,
                orderName: "자전거 대여 결제",
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

    /** ------------------------
     *  🧹 newChat(): 세션 초기화
     * ------------------------ */
    const newChat = async () => {
        const token = localStorage.getItem("user_jwt");

        /** 로그인한 사용자만 백엔드 세션 초기화 */
        if (token) {
            try {
                await axiosInstance.post("/api/ai/reset", null, {
                    withCredentials: false,
                });
            } catch (e) {
                console.warn("AI reset skipped (not authenticated yet):", e);
            }
        }

        // 프론트 로컬 초기화
        setHistory([]);
        setResultData("");
        setShowResult(false);
        setLoading(false);
        setTypingLock(false);
        setScheduleNum(null);
        setSeatModalOpen(false);
        setBikeLocations([]);

        // ✨ 결제 정보 초기화
        setPaymentAmount(null);
        setPaymentPhone(null);
        setActionType(null);
    };

    /** token이 변하면(로그인/로그아웃) newChat 실행 */
    useEffect(() => {
        newChat();
    }, [token]);

    /** ------------------------
     *   🧠 AI 메시지 전송
     * ------------------------ */
    const onSent = async (promptText) => {
        const text = promptText?.trim();
        if (!text || typingLock) return;

        /** 상세 좌석 명령 */
        if (
            text.includes("상세좌석") ||
            text.includes("상세 좌석") ||
            text.includes("좌석 상세") ||
            text.includes("좌석 보여") ||
            text.includes("좌석 볼래")
        ) {
            setInput("");
            setHistory(prev => [...prev, { type: "user", text }]);

            if (!scheduleNum) {
                setHistory(prev => [
                    ...prev,
                    { type: "ai", text: "❗ 먼저 영화와 시간 선택 후 좌석을 불러와주세요." }
                ]);
                return;
            }

            setHistory(prev => [
                ...prev,
                { type: "ai", text: "🎬 좌석 선택창을 열게요!" }
            ]);

            setSeatModalOpen(true);
            return;
        }

        /** 일반 텍스트 전송 */
        setInput("");
        setResultData("");
        setLoading(true);
        setShowResult(true);
        setTypingLock(true);

        setHistory(prev => [...prev, { type: "user", text }]);

        try {
            const res = await axiosInstance.post("/api/ai/ask", { message: text });

            /** 🚲 자전거 처리 */
            if (res.data && Array.isArray(res.data.bicycles)) {
                const bikes = res.data.bicycles;

                const summary = `🚲 ${bikes.length}대의 자전거를 찾았습니다. 지도에서 확인하세요.`;
                setHistory(prev => [...prev, { type: "ai", text: summary, bikeData: bikes }]);

                setResultData("");
                setLoading(false);
                setTypingLock(false);
                return;
            }

            const aiText = res.data?.result || res.data?.message;
            if (!aiText) return;

            // ✅ JSON 응답에서 정보 추출
            let extractedActionType = null;
            let extractedAmount = null;
            let extractedPhone = null;

            // JSON 형식으로 파싱 시도
            try {
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[0]);
                    extractedActionType = jsonData.actionType || null;
                    extractedAmount = jsonData.amount ? Number(jsonData.amount) : null;
                    extractedPhone = jsonData.phone ? String(jsonData.phone).replace(/-/g, '') : null;
                }
            } catch (e) {
                // JSON 파싱 실패 시 정규식으로 추출
            }

            // 정규식으로도 추출 시도
            if (!extractedActionType) {
                const matchActionType = aiText.match(/"actionType"\s*:\s*"([^"]+)"/i);
                extractedActionType = matchActionType ? matchActionType[1] : null;
            }

            if (!extractedAmount) {
                const matchAmount = aiText.match(/"amount"\s*:\s*([0-9]+)/i);
                extractedAmount = matchAmount ? Number(matchAmount[1]) : null;
            }

            if (!extractedPhone) {
                const matchPhone = aiText.match(/"phone"\s*:\s*([\d\-]+)/i);
                extractedPhone = matchPhone ? matchPhone[1].replace(/-/g, '') : null;
            }

            /** scheduleNum 추출 */
            const match =
                aiText.match(/"scheduleNum"\s*:\s*([0-9]+)/i) ||
                aiText.match(/scheduleNum\s*[:=]\s*([0-9]+)/i) ||
                aiText.match(/<!--\s*scheduleNum\s*:\s*([0-9]+)\s*-->/i);

            if (match) setScheduleNum(Number(match[1]));

            // 상태 업데이트
            if (extractedAmount) setPaymentAmount(extractedAmount);
            if (extractedPhone) setPaymentPhone(extractedPhone);
            if (extractedActionType) {
                setActionType(extractedActionType);
                if (extractedActionType === 'OPEN_SEAT_MODAL') {
                    setSeatModalOpen(true);
                }
            }

            // 사용자 입력에 "상세"와 "좌석"이 포함되어 있으면 모달 오픈
            if (text.includes("상세") && text.includes("좌석")) {
                setSeatModalOpen(true);
            }

            setBikeLocations([]);

            let modified = aiText
                .split("**")
                .map((v, i) => (i % 2 ? `<b>${v}</b>` : v))
                .join("")
                .replace(/\*/g, "<br />");

            const words = modified.split(" ");
            words.forEach((word, i) => delayPara(i, word + " "));

            setTimeout(() => {
                // history에 actionType 정보 포함
                setHistory(prev => [...prev, {
                    type: "ai",
                    text: modified,
                    action: extractedActionType || undefined,
                    amount: extractedAmount || undefined,
                    phone: extractedPhone || undefined
                }]);
                setResultData("");
                setLoading(false);
                setTypingLock(false);
            }, 75 * words.length);
        } catch (e) {
            setResultData("서버 오류 발생");
            setLoading(false);
            setTypingLock(false);
        }
    };

    /** 👇 Context Provider Exports */
    return (
        <Context.Provider
            value={{
                token, username, login, logout,
                input, setInput, onSent, showResult,
                loading, resultData, history, setHistory, typingLock, newChat,
                scheduleNum, seatModalOpen, setSeatModalOpen,
                bikeLocations, setBikeLocations,
                paymentAmount, setPaymentAmount,
                paymentPhone, setPaymentPhone,
                actionType, setActionType,
                requestTossPayment
            }}
        >
            {children}
        </Context.Provider>
    );
};
