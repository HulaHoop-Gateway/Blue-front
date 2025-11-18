import { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import React from "react";

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
                setBikeLocations(bikes);

                const summary = `🚲 ${bikes.length}대의 자전거를 찾았습니다. 지도에 표시됩니다.`;
                setHistory(prev => [...prev, { type: "ai", text: summary, bikeData: bikes }]);

                setResultData("");
                setLoading(false);
                setTypingLock(false);
                return;
            }

            const aiText = res.data?.result || res.data?.message;
            if (!aiText) return;

            /** scheduleNum 추출 */
            const match =
                aiText.match(/"scheduleNum"\s*:\s*([0-9]+)/i) ||
                aiText.match(/scheduleNum\s*[:=]\s*([0-9]+)/i) ||
                aiText.match(/<!--\s*scheduleNum\s*:\s*([0-9]+)\s*-->/i);

            if (match) setScheduleNum(Number(match[1]));

            setBikeLocations([]);

            let modified = aiText
                .split("**")
                .map((v, i) => (i % 2 ? `<b>${v}</b>` : v))
                .join("")
                .replace(/\*/g, "<br />");

            const words = modified.split(" ");
            words.forEach((word, i) => delayPara(i, word + " "));

            setTimeout(() => {
                setHistory(prev => [...prev, { type: "ai", text: modified }]);
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
                loading, resultData, history, typingLock, newChat,
                scheduleNum, seatModalOpen, setSeatModalOpen,
                bikeLocations
            }}
        >
            {children}
        </Context.Provider>
    );
};
