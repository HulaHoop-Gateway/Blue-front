import { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export const Context = createContext();

export const ContextProvider = ({ token, setToken, children }) => {
    // ==========================
    // 로그인된 유저 정보
    // ==========================
    const [username, setUsername] = useState("");

    const login = (jwt, user) => {
        localStorage.setItem("user_jwt", jwt);
        setToken(jwt);             // ✅ App에게 token 전달
        setUsername(user || "");
        newChat();                 // ✅ 로그인 시 기존 대화 초기화
    };

    const logout = async () => {
        try {
            await axiosInstance.post("/api/ai/reset");
        } catch (e) {
            console.warn("대화 초기화 실패", e);
        }
        localStorage.removeItem("user_jwt");
        setToken(null);            // ✅ App에서 token 비움
        setUsername("");
        newChat();                 // ✅ 로그아웃 시 대화 초기화
    };

    // ==========================
    // 채팅 상태
    // ==========================
    const [input, setInput] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [history, setHistory] = useState([]);
    const [typingLock, setTypingLock] = useState(false);

    const delayPara = (i, w) => {
        setTimeout(() => setResultData(prev => prev + w), 75 * i);
    };

    const newChat = () => {
        setHistory([]);
        setResultData("");
        setShowResult(false);
        setLoading(false);
        setTypingLock(false);
    };

    // ✅ token이 바뀌면(다른 계정 로그인) → 대화 초기화
    useEffect(() => {
        newChat();
    }, [token]);

    // ==========================
    // AI 요청
    // ==========================
    const onSent = async (promptText) => {
        const text = promptText?.trim();
        if (!text || typingLock) return;

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

            let modified = aiText.split("**")
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

        } catch (err) {
            setResultData("서버 오류 발생");
            setLoading(false);
            setTypingLock(false);
        }
    };

    return (
        <Context.Provider value={{
            token, username, login, logout,
            input, setInput, onSent, showResult,
            loading, resultData, history, typingLock, newChat
        }}>
            {children}
        </Context.Provider>
    );
};
