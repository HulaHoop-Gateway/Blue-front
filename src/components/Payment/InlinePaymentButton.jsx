import React, { useEffect, useRef, useState } from 'react';
import { useContext } from 'react';
import { Context } from '../../context/Context';
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";
import axiosInstance from '../../api/axiosInstance';
import './InlinePaymentButton.css';

const InlinePaymentButton = ({ amount, phoneNumber, orderName = "자전거 대여 결제", onSuccess, reservationData }) => {
    const { setHistory, paymentCompleted, setPaymentCompleted } = useContext(Context);
    const widgetRef = useRef(null);
    const widgetContainerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 모달이 열릴 때 결제 위젯 초기화
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
            setPaymentCompleted(true); // 결제 완료 상태 설정

            if (onSuccess) {
                onSuccess();
            } else {
                setHistory(prev => [...prev, {
                    type: "ai",
                    text: "결제가 완료되었습니다. 자전거를 이용해주세요."
                }]);
            }
        } catch (error) {
            console.error("🔥 결제 실패:", error);

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

    return (
        <>
            <button
                className="inline-payment-button"
                onClick={() => setIsModalOpen(true)}
                disabled={paymentCompleted}
                style={{
                    cursor: paymentCompleted ? 'not-allowed' : 'pointer',
                    opacity: paymentCompleted ? 0.5 : 1,
                    backgroundColor: paymentCompleted ? '#ccc' : ''
                }}
            >
                {paymentCompleted ? '결제 완료' : '결제하기'}
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
