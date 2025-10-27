// src/context/Context.jsx
import { createContext, useState } from "react";
import main from "../config/Gemini";

export const Context = createContext();

const ContextProvider = (props) => {
    // ==========================
    // 로그인 관련 상태
    // ==========================
    const [token, setToken] = useState(localStorage.getItem("user_jwt") || null);
    const [username, setUsername] = useState(""); // 필요시 사용자 이름 관리

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
    };

    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);

        const currentPrompt = prompt !== undefined ? prompt : input;

        if (prompt === undefined) {
            setPrevPrompts((prev) => [...prev, currentPrompt]);
        }

        setRecentPrompt(currentPrompt);
        setHistory((prev) => [...prev, { type: "user", text: currentPrompt }]);
        setInput("");

        const response = await main(currentPrompt);

        // 강조 ** 처리
        let responseArray = response.split("**");
        let newResponse = "";
        for (let i = 0; i < responseArray.length; i++) {
            if (i === 0 || i % 2 !== 1) {
                newResponse += responseArray[i];
            } else {
                newResponse += "<b>" + responseArray[i] + "</b>";
            }
        }

        let newResponse2 = newResponse.split("*").join("</br>");

        // 글자 단위로 딜레이 처리
        let newResponseArray = newResponse2.split(" ");
        for (let i = 0; i < newResponseArray.length; i++) {
            const nextWord = newResponseArray[i];
            delayPara(i, nextWord + " ");
        }

        setTimeout(() => {
            setHistory((prev) => [...prev, { type: "ai", text: newResponse2 }]);
            setLoading(false);
            setResultData("");
        }, 75 * newResponseArray.length);
    };

    // ==========================
    // Context value
    // ==========================
    const contextValue = {
        // 로그인
        token,
        username,
        login,
        logout,

        // 채팅
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
    };

    return <Context.Provider value={contextValue}>{props.children}</Context.Provider>;
};

export default ContextProvider;
