import React, { useContext, useEffect, useRef, useState } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import SeatModal from "../Seat/SeatModal";
import KakaoMap from "../KakaoMap/KakaoMap";
import InlinePaymentButton from "../Payment/InlinePaymentButton";

const Main = () => {
    const {
        onSent, showResult, loading, resultData,
        setInput, input, history, isTyping,
        scheduleNum, seatModalOpen, setSeatModalOpen,
        bikeLocations, cinemaLocations
    } = useContext(Context);

    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    // 한글 IME 조합 상태 (조합 중에 엔터 누르면 글자 깨지는 현상 방지용)
    const [isComposing, setIsComposing] = useState(false);
    const [isRecording, setIsRecording] = useState(false); // 마이크 녹음 켜짐/꺼짐
    const recognitionRef = useRef(null);

    // 마이크 권한 및 음성 인식 엔진 초기화 (앱 시작 1번)
    // Chrome에서만 SpeechRecognition API가 지원되기 때문에, 없으면 조기 종료.
    // continuous: 이야기 도중에 자동으로 멈추지 않게 계속 듣는 모드.
    // interimResults: 확정 안 된 중간 문장도 실시간으로 input에 채워줌.
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition API를 지원하지 않는 브라우저입니다.');
            alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
            return;
        }

        const recognizer = new SpeechRecognition();
        recognizer.lang = 'ko-KR';
        recognizer.continuous = true;
        recognizer.interimResults = true;

        recognizer.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcriptPart;
                } else {
                    interim += transcriptPart;
                }
            }
            // 최종+중간 문장 합쳐서 인풋창에 실시간으로 뿌려줌
            setInput(final + interim);
        };

        recognizer.onerror = (e) => {
            console.error('SpeechRecognition error:', e);
            setIsRecording(false);
        };

        recognizer.onend = () => {
            // 녹음이 자동으로 끊겼을 때 상태 업데이트
            setIsRecording(false);
        };

        recognitionRef.current = recognizer;
    }, []);


    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('음성 인식 기능이 초기화되지 않았습니다.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
                setInput(''); // 녹음 시작 시 입력창 초기화
            } catch (error) {
                console.error("Speech recognition start error:", error);
                setIsRecording(false);
            }
        }
    };

    // 채팅 히스토리나 타이핑 내용이 바뀔 때마다 스크롤을 맨 아래로
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [history, resultData]);

    // 전송 버튼 / 엔터 눌렀을 때 실행되는 메시지 전송 함수
    // 타이핑 중이거나(isTyping), 한글 조합 중이면(isComposing) 무시
    const sendMessage = () => {
        const trimmed = (input || '').trim();
        if (!trimmed || isTyping || isComposing) return;

        const message = trimmed;

        // 조합 중 글자 재삽입 방지: blur 시키고 인풋 비운 다음 비동기로 보냄
        inputRef.current?.blur();
        setInput('');

        setTimeout(() => onSent(message), 0);
    };

    const handleKeyDown = (e) => {
        if (isTyping) return;
        if (e.key === 'Enter' && !isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className='main'>
            <div className='nav'>
                <p>Hulahoop Blue</p>
            </div>

            <div className="main-container">
                {!showResult ? (
                    <>
                        <div className='card-view-scroll-container'>

                            <div className="greet">
                                <p><span>안녕하세요!</span></p>
                                <p>예약하시고 싶은 것을 말씀해주세요!</p>
                            </div>

                            <div className="cards">
                                <div>
                                    <div className='card-top'>
                                        <img src={assets.cinema_icon} alt="영화관 아이콘" />
                                        <p>영화관</p>
                                    </div>
                                    <div className="card">
                                        <p>영화관 지점을 말하면 AI가 상영 정보와 스케줄을 안내합니다.</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="card-top">
                                        <img src={assets.compass_icon} alt="자전거 아이콘" />
                                        <p>자전거</p>
                                    </div>
                                    <div className="card">
                                        <p>예약하시고 싶은 자전거를 말씀해주세요!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='result' ref={chatContainerRef}>
                        {history.map((item, index) => (
                            <React.Fragment key={index}>
                                {item.type === 'user' ? (
                                    <div className="result-title">
                                        <p>{item.text}</p>
                                    </div>
                                ) : (
                                    <div className="result-data">
                                        <img src={assets.chatbot_icon} alt="" className="avatar" />
                                        <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                                            {/* 🎬 영화관 지도 표시 (이 메시지 위에) */}
                                            {item.cinemaData && item.cinemaData.length > 0 && (
                                                <KakaoMap locations={item.cinemaData} mapId={`cinema-map-${index}`} />
                                            )}

                                            {/* 🚲 자전거 지도 표시 (이 메시지 위에) */}
                                            {item.bikeData && item.bikeData.length > 0 && (
                                                <KakaoMap locations={item.bikeData} mapId={`bike-map-${index}`} />
                                            )}

                                            <p
                                                style={{ whiteSpace: "pre-wrap" }}
                                                dangerouslySetInnerHTML={{ __html: item.text }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* AI 응답에 actionType=PAYMENT_CONFIRM이 달려오면 결제 버튼 렌더링 */}
                                {item.type === 'ai' &&
                                    item.action === 'PAYMENT_CONFIRM' &&
                                    item.amount && (
                                        <div className="result-data">
                                            <InlinePaymentButton
                                                amount={item.amount}
                                                phoneNumber={item.phone}
                                                orderName={item.paymentType === 'BICYCLE' ? '자전거 대여 결제' : '영화 예매 결제'}
                                                disabled={item.disabled}
                                                isCompleted={item.completed}
                                                onSuccess={() => {
                                                    onSent("결제 완료");
                                                }}
                                            />
                                        </div>
                                    )}
                            </React.Fragment>
                        ))}

                        {/* 백엔드 응답 대기 중이거나 타이핑 애니메이션 중일 때 */}
                        {(loading || resultData) && (
                            <div className="result-data">
                                <img src={assets.chatbot_icon} alt="" className="avatar" />
                                <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                                    {/* 🎬 타이핑 중 영화관 지도 표시 */}
                                    {cinemaLocations && cinemaLocations.length > 0 && (
                                        <KakaoMap locations={cinemaLocations} mapId="temp-cinema-map" />
                                    )}

                                    {/* 🚲 타이핑 중 자전거 지도 표시 */}
                                    {bikeLocations && bikeLocations.length > 0 && (
                                        <KakaoMap locations={bikeLocations} mapId="temp-bike-map" />
                                    )}

                                    {loading ? (
                                        <div className='loader'>
                                            <hr /><hr /><hr />
                                        </div>
                                    ) : (
                                        <p
                                            style={{ whiteSpace: "pre-wrap" }}
                                            dangerouslySetInnerHTML={{ __html: resultData }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="main-bottom">
                    <div className="search-box">
                        <input
                            ref={inputRef}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            onChange={(e) => setInput(e.target.value)}
                            value={input}
                            type="text"
                            placeholder='텍스트를 입력해주세요..'
                            disabled={isTyping}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <div>
                            <img
                                src={assets.mic_icon}
                                alt=""
                                onClick={toggleRecording}
                                className={isRecording ? 'listening' : ''}
                                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            />
                            {input && !isTyping ? (
                                <img
                                    onClick={isTyping ? null : sendMessage}
                                    src={assets.send_icon}
                                    alt=""
                                    style={{ cursor: isTyping ? 'not-allowed' : 'pointer', opacity: isTyping ? 0.5 : 1 }}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* 💺 좌석 선택 모달 (Context에서 seatModalOpen=true가 될 때 렌더링) */}
            <SeatModal
                open={seatModalOpen}
                scheduleNum={scheduleNum}
                onClose={() => setSeatModalOpen(false)}
            />
        </div>
    );
};
export default Main;