import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";

// 이 앱 전체에서 필요한 데이터(토큰이나 채팅 내역 등)를 아무 컴포넌트나 꺼내 쓸 수 있도록
// 커다란 전역 보따리를 하나 만드는 거라고 보면 됨.
export const Context = createContext();

export const ContextProvider = ({ token, setToken, children }) => {

    const [input, setInput] = useState("");
    const [resultData, setResultData] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);

    const [history, setHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    // 예약 진행 상태 저장용
    const [scheduleNum, setScheduleNum] = useState(null);
    const [seatModalOpen, setSeatModalOpen] = useState(false);
    const [bikeLocations, setBikeLocations] = useState([]);
    const [cinemaLocations, setCinemaLocations] = useState([]);

    // 결제 창 띄울 때 필요한 정보들
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentPhone, setPaymentPhone] = useState("");
    const [actionType, setActionType] = useState(null);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    // 토큰이 바뀌었을 때(로그인하거나 튕겼을 때) 
    // 채팅 내용 싹 다 지우고 백엔드 세션도 엎어버림.
    useEffect(() => {
        newChat();

        const savedToken = sessionStorage.getItem("user_jwt");
        if (savedToken) {
            import("axios").then(axios => {
                axios.default.post("http://localhost:8090/api/ai/reset", {}, {
                    headers: { Authorization: `Bearer ${savedToken}` }
                })
                    .then(() => console.log("백엔드 AI 챗봇 세션 초기화 성공"))
                    .catch(err => console.error("백엔드 세션 초기화 실패:", err));
            });
        }
    }, [token]);

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
        setPaymentCompleted(false);
    };

    // 토스페이먼츠 연동 로직
    // SDK 스크립트 불러와서 위젯 장착한 다음에, 주문번호 렌덤으로 따서 결제창 띄워주는 역할.
    const requestTossPayment = async (amount, phoneNumber, orderName = "자전거 대여 결제", onSuccess, onError) => {
        try {
            const widget = await loadPaymentWidget(
                import.meta.env.VITE_TOSS_CLIENT_KEY,
                phoneNumber || "GUEST"
            );

            const orderId = crypto.randomUUID();

            const result = await widget.requestPayment({
                orderId,
                orderName,
                amount
            });

            // 프론트에서 결제 성공하면 영수증 키를 백엔드로 한 번 더 쏴서 이중 확인(승인) 받음
            await axiosInstance.post("/api/payments/confirm", {
                paymentKey: result.paymentKey,
                orderId: result.orderId,
                amount: result.amount
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("결제 실패:", error);

            // 사용자가 단순히 결제창 끈 거면 에러 리포트 무시
            if (error.code === "USER_CANCEL" || error.message?.includes("cancel")) {
                return;
            }

            if (onError) {
                onError(error);
            }
        }
    };

    // 내가 챗봇한테 말 걸었을 때(전송) 돌아가는 메인 로직 처리
    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);

        let text = prompt;
        if (!text) {
            text = input;
        }

        const newHistoryItem = { type: "user", text };

        // 취소나 종료 뉘앙스의 단어를 감지하면, 
        // 화면에 남아있는 그 이전 '결제하기' 버튼 같은 걸 아예 못 누르게 회색(비활성화)으로 막아버림.
        if ["취소", "그만", "종료", "안할래", "나가기"].some(keyword => text.includes(keyword))) {
            setHistory(prev => prev.map(item => {
                if (item.action === 'PAYMENT_CONFIRM') {
                    return { ...item, disabled: true };
                }
                return item;
            }).concat(newHistoryItem));
        }
        else if (text === "결제 완료") {
            setHistory(prev => {
                const lastPaymentIndex = prev.findLastIndex(item => item.action === 'PAYMENT_CONFIRM');
                if (lastPaymentIndex !== -1) {
                    const newHistory = [...prev];
                    newHistory[lastPaymentIndex] = { ...newHistory[lastPaymentIndex], completed: true };
                    return newHistory.concat(newHistoryItem);
                }
                return prev.concat(newHistoryItem);
            });
        } else {
            setHistory(prev => [...prev, newHistoryItem]);
        }

        setInput("");

        // 좌석 선택 모달 오픈 캐치
        if (text === "좌석 선택창 열어줘" || (actionType === 'OPEN_SEAT_MODAL' && text === "네")) {
            if (!scheduleNum) {
                setHistory(prev => [
                    ...prev,
                    { type: "ai", text: "먼저 영화와 시간 선택 후 좌석을 불러와주세요." }
                ]);
                setLoading(false);
                return;
            }

            setHistory(prev => [
                ...prev,
                { type: "ai", text: "💺 좌석 선택창을 열게요!" }
            ]);
            setSeatModalOpen(true);
            setLoading(false);
            return;
        }

        if (text.includes("상세") && text.includes("좌석")) {
            if (!scheduleNum) {
                setHistory(prev => [
                    ...prev,
                    { type: "ai", text: "먼저 영화와 시간 선택 후 좌석을 불러와주세요." }
                ]);
                setLoading(false);
                return;
            }

            setHistory(prev => [
                ...prev,
                { type: "ai", text: "💺 좌석 선택창을 열게요!" }
            ]);
            setSeatModalOpen(true);
            setLoading(false);
            return;
        }

        // 결제가 끝났으면 다음 손님(예약) 받을 준비하려고 관련 상태 싹 다 갈아엎음
        if (text.includes("결제 완료") || text.includes("결제가 완료")) {
            setPaymentCompleted(false);
            setPaymentAmount(0);
            setPaymentPhone("");
            setActionType(null);
        }

        try {
            // 진짜로 백엔드 AI 챗봇한테 말 던지고 답장 기다리는 부분
            const res = await axiosInstance.post("/api/ai/ask", { message: text });
            const aiText = res.data?.result || res.data?.message || "";

            // 🎬 영화관 지도 데이터 분리 
            // 현재 내가 상영스케줄 조회 등을 진행 중이 아니면(처음 물어볼 때 화면이면) 백엔드가 준 제휴 영화관 목록을 지도에 뿌려줌.
            let cinemas = (res.data && Array.isArray(res.data.cinemas) && res.data.cinemas.length > 0 && !scheduleNum) ? res.data.cinemas : null;

            // 🚲 자전거 지도 데이터 분리
            let bikes = (res.data && Array.isArray(res.data.bicycles) && res.data.bicycles.length > 0) ? res.data.bicycles : null;

            // 지도 중복 렌더링 방지용 더블 필터링
            // 사용자가 "1번 선택", "예약" 단계로 넘어갔는데도 지도가 계속 떠있으면 시야를 가리니까,
            // 텍스트에 뭔가 결정하는 키워드가 들어있으면 지도 데이터를 아예 null로 죽여버림.
            if (text.includes("선택") || text.includes("번") || text.includes("결제") || /^\d+$/.test(text.trim())) {
                cinemas = null;
                bikes = null;
            }

            // AI 대답 내용에 따라서도 한 번 더 죽여줌
            if (aiText.includes("결제") || aiText.includes("예약되었습니다") || aiText.includes("좌석")) {
                cinemas = null;
                bikes = null;
            }

            // 백엔드가 AI 대답 끝에 JSON 배열 박싱해서 { "actionType": ... } 히든 정보 보낸 걸 정규식으로 따서 파싱
            let extractedActionType = null;
            let extractedAmount = null;
            let extractedPhone = null;
            let extractedPaymentType = null;

            try {
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[0]);
                    extractedActionType = jsonData.actionType || null;
                    extractedAmount = jsonData.amount ? Number(jsonData.amount) : null;
                    extractedPhone = jsonData.phone ? String(jsonData.phone).replace(/-/g, '') : null;
                    extractedPaymentType = jsonData.paymentType || null;

                    if (jsonData.scheduleNum) {
                        setScheduleNum(Number(jsonData.scheduleNum));
                    }

                    const match =
                        aiText.match(/"scheduleNum"\s*:\s*([0-9]+)/i) ||
                        aiText.match(/scheduleNum\s*[:=]\s*([0-9]+)/i) ||
                        aiText.match(/<!--\s*scheduleNum\s*:\s*([0-9]+)\s*-->/i);

                    if (match && !jsonData.scheduleNum) setScheduleNum(Number(match[1]));

                    if (extractedAmount) setPaymentAmount(extractedAmount);
                    if (extractedPhone) setPaymentPhone(extractedPhone);
                    if (extractedActionType) {
                        setActionType(extractedActionType);
                        if (extractedActionType === 'OPEN_SEAT_MODAL') {
                            setSeatModalOpen(true);
                        }

                        // 결제 확인창 떴는데 자전거 지도가 뒤에 서있으면 이상하니까 숨김
                        if (extractedActionType === 'PAYMENT_CONFIRM' || extractedActionType === 'BIKE_RESERVE') {
                            bikes = null;
                        }
                    }
                }
            } catch (e) {
                console.error("JSON 파싱 에러 (백엔드 데이터 형식 오류 의심됨)", e);
            }

            if (aiText.includes("결제") || aiText.includes("예약되었습니다")) {
                bikes = null;
            }

            // 타이핑될 화면을 위해 프론트 상태 변수에 세팅
            if (bikes) setBikeLocations(bikes);
            else setBikeLocations([]);

            if (cinemas) setCinemaLocations(cinemas);
            else setCinemaLocations([]);

            // 채팅화면엔 진짜 말투만 나와야 하니까 뽑아낸 JSON 객체 문자열 부분은 싹 잘라버림
            let displayText = aiText.replace(/\{[\s\S]*\}/g, "").trim();

            displayText = displayText.replace(/\n\s*\n/g, "\n\n");

            let modified = displayText
                .split("**")
                .map((v, i) => (i % 2 ? `<b>${v}</b>` : v))
                .join("")
                .replace(/\*/g, "<br />");

            setLoading(false);
            setIsTyping(true);

            // 타이핑 효과 구현하는 단순 트릭
            // 길다란 문자를 배열로 쪼개고, 0.01초 간격으로 한 글자씩 이어붙이면서 화면 업데이트 시켜줌
            const characters = modified.split("");

            if (characters.length > 0) {
                characters.forEach((char, i) => {
                    setTimeout(() => {
                        setResultData(prev => prev + char);
                    }, 10 * i);
                });
            }

            // 한 글자씩 다 박히고 나서 최종적으로 히스토리 배열에 통합 세이브
            setTimeout(() => {
                setHistory(prev => [...prev, {
                    type: "ai",
                    text: modified,
                    bikeData: bikes,        // 🚲 Map한테 넘겨줄 자전거 좌표 덩어리
                    cinemaData: cinemas,    // 🎬 Map한테 넘겨줄 영화 좌표 덩어리
                    action: extractedActionType || undefined,
                    amount: extractedAmount || undefined,
                    phone: extractedPhone || undefined,
                    paymentType: extractedPaymentType || undefined
                }]);
                setResultData("");
                setIsTyping(false);

                // 히스토리 컴포넌트 쪽으로 렌더링 턴을 넘겼으니, 본체 지도는 지워둠
                setBikeLocations([]);
                setCinemaLocations([]);
            }, 10 * characters.length + 200);

        } catch (error) {
            console.error("에러 발생:", error);
            setLoading(false);
            setResultData("통신 중 에러가 발생했습니다. 다시 시도해주세요.");
        }
    };

    // 요 보따리를 Provider로 던져주면, 하위 자식들이 useContext(Context) 해서 맘대로 빼 씀.
    const contextValue = {
        onSent,
        input,
        setInput,
        resultData,
        showResult,
        loading,
        history,
        setHistory,
        isTyping,
        newChat,
        token,
        scheduleNum, setScheduleNum,
        seatModalOpen, setSeatModalOpen,
        bikeLocations, setBikeLocations,
        cinemaLocations, setCinemaLocations,
        paymentAmount, setPaymentAmount,
        paymentPhone, setPaymentPhone,
        actionType, setActionType,
        paymentCompleted, setPaymentCompleted,
        requestTossPayment
    };

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
};

export default ContextProvider;
