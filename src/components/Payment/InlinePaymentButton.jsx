import React, { useEffect, useRef, useState } from 'react';
import { useContext } from 'react';
import { Context } from '../../context/Context';
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";
import axiosInstance from '../../api/axiosInstance';
import './InlinePaymentButton.css';

// AI 채팅 안에서 '결제하기' 버튼 역할을 하는 인라인 컴포넌트
// 버튼 누르면 모달창이 뜨고, 그 안에 토스페이먼츠 결제 위젯을 렌더링해 줌.
const InlinePaymentButton = ({ amount, phoneNumber, orderName = "자전거 대여 결제", onSuccess, reservationData, disabled, isCompleted }) => {
    const { setHistory, setPaymentCompleted } = useContext(Context);
    const widgetRef = useRef(null);
    const widgetContainerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 모달이 열릴 때 토스 결제 위젯 로드하고 지정 div에 렌더링
    // 모달 닫히면 컨테이너 싹 비워버림 (위젯 재마운트 시 충돌 방지)
    useEffect(() => {
        if (!isModalOpen || !amount || !widgetContainerRef.current) return;

        const initWidget = async () => {
            try {
                const widget = await loadPaymentWidget(
                    import.meta.env.VITE_TOSS_CLIENT_KEY,
                    phoneNumber || "GUEST"
                );

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

        return () => {
            if (widgetContainerRef.current) {
                widgetContainerRef.current.innerHTML = '';
            }
        };
    }, [isModalOpen, amount, phoneNumber]);

    const handlePaymentClick = async () => {
        if (!amount) {
            console.error("결제 금액이 없습니다.");
            return;
        }

        if (!widgetRef.current) {
            console.error("결제 위젯이 아직 초기화되지 않았습니다.");
            return;
        }

        setHistory(prev => [...prev, { type: "user", text: "결제하기" }]);

        try {
            // 무작위 주문번호 생성 후 토스 결제 요청
            const orderId = crypto.randomUUID();

            const result = await widgetRef.current.requestPayment({
                orderId,
                orderName,
                amount
            });

            await axiosInstance.post("/api/payments/confirm", {
                paymentKey: result.paymentKey,
                orderId: result.orderId,
                amount: result.amount
            });

            setIsModalOpen(false); // 결제 성공 시 모달 닫기
            // setPaymentCompleted(true); // 전역 상태로 안 쓰고 히스토리 업데이트로 대체한 방식

            if (onSuccess) {
                onSuccess();
            } else {
                setHistory(prev => [...prev, {
                    type: "ai",
                    text: "결제가 완료되었습니다. 자전거를 이용해주세요."
                }]);
            }
        } catch (error) {
            console.error("결제 실패:", error);

            if (error.code === "USER_CANCEL" || error.message?.includes("cancel")) {
                setIsModalOpen(false); // 취소 시 모달 닫기
                return;
            }

            setHistory(prev => [...prev, {
                type: "ai",
                text: "결제 중 오류가 발생했습니다. 다시 시도해주세요."
            }]);
        }
    };

    const isButtonDisabled = disabled || isCompleted;

    return (
        <>
            <button
                className="inline-payment-button"
                onClick={() => setIsModalOpen(true)}
                disabled={isButtonDisabled}
                style={{
                    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                    opacity: isButtonDisabled ? 0.5 : 1,
                    backgroundColor: isButtonDisabled ? '#ccc' : ''
                }}
            >
                {isCompleted ? '결제 완료' : '결제하기'}
            </button>

            {isModalOpen && (
                <div className="payment-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="payment-modal-header">
                            <h3>결제 수단 선택</h3>
                            <button className="payment-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <div
                            id={`payment-widget-${amount}`}
                            ref={widgetContainerRef}
                        />
                        <button
                            className="payment-modal-submit"
                            onClick={handlePaymentClick}
                        >
                            결제하기
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InlinePaymentButton;
