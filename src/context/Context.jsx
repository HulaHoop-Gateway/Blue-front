import { createContext, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export const Context = createContext();

const ContextProvider = (props) => {
    // ==========================
    // 로그인 관련 상태
    // ==========================
    const [token, setToken] = useState(localStorage.getItem("user_jwt") || null);
    const [username, setUsername] = useState("");

    const login = (jwt, user) => {
        localStorage.setItem("user_jwt", jwt);
        setToken(jwt);
        setUsername(user || "");
    };

    const logout = () => {
        localStorage.removeItem("user_jwt");
        setToken(null);
        setUsername("");
    };

    // ==========================
    // 채팅 관련 상태
    // ==========================
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompts, setPrevPrompts] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [history, setHistory] = useState([]);
    const [typingLock, setTypingLock] = useState(false); // AI 답변 중 입력 차단

    const delayPara = (index, nextWord) => {
        setTimeout(() => {
            setResultData((prev) => prev + nextWord);
        }, 75 * index);
    };

    const newChat = () => {
        setLoading(false);
        setShowResult(false);
        setHistory([]);
        setResultData("");
        setTypingLock(false);
    };

    // ==========================
    // AI 메시지 전송
    // ==========================
    const onSent = async (promptText) => {
        const currentPrompt = promptText?.trim();
        if (!currentPrompt || typingLock) return;

        // 입력창 즉시 초기화
        setInput("");
        setResultData("");
        setLoading(true);
        setShowResult(true);
        setTypingLock(true); // AI 답변 시작 시 입력 차단

        // 사용자 메시지 기록
        setPrevPrompts((prev) => [...prev, currentPrompt]);
        setRecentPrompt(currentPrompt);
        setHistory((prev) => [...prev, { type: "user", text: currentPrompt }]);

        try {
            const response = await axiosInstance.post("/api/ai/ask", { message: currentPrompt });
            const aiText = response.data?.result || response.data?.message;

            if (!aiText) {
                setResultData("AI 서버로부터 올바른 응답을 받지 못했습니다.");
                setLoading(false);
                setTypingLock(false);
                return;
            }

            let textStr = String(aiText);

            // 강조 ** 처리
            let responseArray = textStr.split("**");
            let newResponse = "";
            for (let i = 0; i < responseArray.length; i++) {
                newResponse += i % 2 === 1 ? "<b>" + responseArray[i] + "</b>" : responseArray[i];
            }

            // 줄바꿈 * 처리
            newResponse = newResponse.split("*").join("</br>");

            // 타이핑 효과
            const words = newResponse.split(" ");
            words.forEach((word, index) => delayPara(index, word + " "));

            // 타이핑 완료 후 history에 저장
            setTimeout(() => {
                setHistory((prev) => [...prev, { type: "ai", text: newResponse }]);
                setLoading(false);
                setResultData("");
                setTypingLock(false); // AI 답변 종료 시 입력 허용
            }, 75 * words.length);

        } catch (error) {
            console.error("AI 요청 오류:", error);
            const errorMessage = error.response?.data?.message || "AI 요청 중 오류가 발생했습니다.";
            setResultData(errorMessage);
            setLoading(false);
            setTypingLock(false);
        }
    };

    // ==========================
    // Context value
    // ==========================
    const contextValue = {
        token,
        username,
        login,
        logout,
        prevPrompts,
        setPrevPrompts,
        onSent,
        setRecentPrompt,
        recentPrompt,
        showResult,
        loading,
        resultData,
        input,
        setInput,
        newChat,
        history,
        setHistory,
        typingLock, // Main.jsx에서 입력 차단에 사용
    };

    return <Context.Provider value={contextValue}>{props.children}</Context.Provider>;
};

export default ContextProvider;
