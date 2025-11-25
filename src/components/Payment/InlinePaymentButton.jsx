import React, { useEffect, useRef } from 'react';
import { useContext } from 'react';
import { Context } from '../../context/Context';
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";
import axiosInstance from '../../api/axiosInstance';
import './InlinePaymentButton.css';

const InlinePaymentButton = ({ amount, phoneNumber, orderName = "자전거 대여 결제", onSuccess }) => {
    const { setHistory } = useContext(Context);
    const widgetRef = useRef(null);
    const widgetContainerRef = useRef(null);

    // 결제 위젯 초기화 및 렌더링
    useEffect(() => {
        if (!amount || !widgetContainerRef.current) return;

        const initWidget = async () => {
            try {
                const widget = await loadPaymentWidget(
                    import.meta.env.VITE_TOSS_CLIENT_KEY,
                    phoneNumber || "GUEST"
                );

                // 결제 수단 렌더링 (숨겨진 컨테이너에)
                await widget.renderPaymentMethods(
                    `#payment-widget-${amount}`,
                    { value: amount }
                );

                widgetRef.current = widget;
            } catch (error) {
                console.error("결제 위젯 초기화 실패:", error);
            }
        };

        initWidget();

        // cleanup
        return () => {
            if (widgetContainerRef.current) {
                widgetContainerRef.current.innerHTML = '';
            }
        };
    }, [amount, phoneNumber]);

    const handlePaymentClick = async () => {
        if (!amount) {
            console.error("결제 금액이 없습니다.");
            return;
        }

        if (!widgetRef.current) {
            console.error("결제 위젯이 아직 초기화되지 않았습니다.");
            return;
        }

        // 사용자 메시지 추가
        setHistory(prev => [...prev, { type: "user", text: "결제하기" }]);

        try {
            const orderId = crypto.randomUUID();

            // 결제 요청
            const result = await widgetRef.current.requestPayment({
                orderId,
                orderName,
                amount
            });

            // 결제 확인 요청
            await axiosInstance.post("/api/payments/confirm", {
                paymentKey: result.paymentKey,
                orderId: result.orderId,
                amount: result.amount
            });

            // onSuccess 콜백 호출 (영화 예약은 백엔드 응답으로 메시지 받음)
            if (onSuccess) {
                onSuccess();
            } else {
                // 자전거 예약은 여기서 메시지 추가
                setHistory(prev => [...prev, {
                    type: "ai",
                    text: "결제가 완료되었습니다. 자전거를 이용해주세요."
                }]);
            }
        } catch (error) {
            console.error("🔥 결제 실패:", error);

            // 사용자가 결제를 취소한 경우는 에러로 처리하지 않음
            if (error.code === "USER_CANCEL" || error.message?.includes("cancel")) {
                return;
            }

            // 결제 실패 시 에러 메시지 추가
            setHistory(prev => [...prev, {
                type: "ai",
                text: "결제 중 오류가 발생했습니다. 다시 시도해주세요."
            }]);
        }
    };

    return (
        <div className="inline-payment-button-container">
            {/* 숨겨진 결제 위젯 컨테이너 */}
            <div
                id={`payment-widget-${amount}`}
                ref={widgetContainerRef}
                style={{ display: 'none' }}
            />
            <button
                className="inline-payment-button"
                onClick={handlePaymentClick}
            >
                결제하기
            </button>
        </div>
    );
};

export default InlinePaymentButton;

