import { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

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

    const login = (jwt, user) => {
        localStorage.setItem("user_jwt", jwt);
        setToken(jwt);
        setUsername(user || "");
        newChat();
    };

    const logout = async () => {
        try {
            await axiosInstance.post("/api/ai/reset");
        } catch {}
        localStorage.removeItem("user_jwt");
        setToken(null);
        setUsername("");
        newChat();
    };

    const delayPara = (i, w) => {
        setTimeout(() => setResultData(prev => prev + w), 75 * i);
    };

    const newChat = () => {
        setHistory([]);
        setResultData("");
        setShowResult(false);
        setLoading(false);
        setTypingLock(false);
        setScheduleNum(null);
        setSeatModalOpen(false);
    };

    useEffect(() => {
        newChat();
    }, [token]);

    const onSent = async (promptText) => {
        const text = promptText?.trim();
        if (!text || typingLock) return;

        /** ✅ 상세좌석 명령 처리 (AI 호출 없이 모달만 열기) */
        if (
            text.includes("상세좌석") ||
            text.includes("상세 좌석") ||
            text.includes("좌석 상세") ||
            text.includes("좌석 보여") ||
            text.includes("좌석 볼래")
        ) {
            setInput("");

            // ✅ 사용자 메시지 히스토리 기록
            setHistory(prev => [...prev, { type: "user", text }]);

            // ✅ 스케줄 없는 경우
            if (!scheduleNum) {
                setHistory(prev => [
                    ...prev,
                    { type: "ai", text: "❗ 먼저 영화와 시간 선택 후 좌석을 불러와주세요." }
                ]);
                return;
            }

            // ✅ AI 응답 형태로 출력 (UI 흐름 자연스럽게)
            setHistory(prev => [
                ...prev,
                { type: "ai", text: "🎬 좌석 선택창을 열게요!" }
            ]);

            // ✅ 좌석 모달 열기
            setSeatModalOpen(true);

            return;
        }

        /** ✨ 일반 텍스트 요청 → AI 호출 */
        setInput("");
        setResultData("");
        setLoading(true);
        setShowResult(true);
        setTypingLock(true);

        setHistory(prev => [...prev, { type: "user", text }]);

        try {
            const res = await axiosInstance.post("/api/ai/ask", { message: text });
            const aiText = res.data?.result || res.data?.message;
            if (!aiText) return;

            // ✅ scheduleNum 파싱
            const match =
                aiText.match(/"scheduleNum"\s*:\s*([0-9]+)/i) ||
                aiText.match(/scheduleNum\s*[:=]\s*([0-9]+)/i) ||
                aiText.match(/<!--\s*scheduleNum\s*:\s*([0-9]+)\s*-->/i);

            if (match) setScheduleNum(Number(match[1]));

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
        } catch {
            setResultData("서버 오류 발생");
            setLoading(false);
            setTypingLock(false);
        }
    };

    return (
        <Context.Provider value={{
            token, username, login, logout,
            input, setInput, onSent, showResult,
            loading, resultData, history, typingLock, newChat,
            scheduleNum, seatModalOpen, setSeatModalOpen
        }}>
            {children}
        </Context.Provider>
    );
};
