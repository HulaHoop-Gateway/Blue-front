import React, { useContext, useEffect, useRef, useState } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import SeatModal from "../Seat/SeatModal";

const Main = () => {
    const {
        onSent, showResult, loading, resultData,
        setInput, input, history, typingLock,
        scheduleNum, seatModalOpen, setSeatModalOpen
    } = useContext(Context);

    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    // ✅ 한글 IME 조합 상태
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [history, resultData]);

    const sendMessage = () => {
        const trimmed = (input || '').trim();
        if (!trimmed || typingLock || isComposing) return;

        const message = trimmed;

        // ✅ 조합 중 글자 재삽입 방지 흐름
        inputRef.current?.blur();
        setInput('');

        setTimeout(() => onSent(message), 0);
    };

    const handleKeyDown = (e) => {
        if (typingLock) return;
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
                        <div className="greet">
                            <p><span>안녕하세요!</span></p>
                            <p>예약하시고 싶은 것을 말씀해주세요!</p>
                        </div>

                        <div className="cards">
                            <div className="card">
                                <p>영화관 지점을 말하면 AI가 상영 정보와 스케줄을 안내합니다.</p>
                                <img src={assets.compass_icon} alt="영화관 아이콘" />
                            </div>
                            <div className="card">
                                <p>예약하시고 싶은 자전거를 말씀해주세요!</p>
                                <img src={assets.compass_icon} alt="자전거 아이콘" />
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
                                        <img src={assets.chatbot_icon} alt="" />
                                        <p
                                            style={{ whiteSpace: "pre-wrap" }}
                                            dangerouslySetInnerHTML={{ __html: item.text }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}

                        {loading && (
                            <div className="result-data">
                                <img src={assets.chatbot_icon} alt="" />
                                {resultData ? (
                                    <p
                                        style={{ whiteSpace: "pre-wrap" }}
                                        dangerouslySetInnerHTML={{ __html: resultData }}
                                    />
                                ) : (
                                    <div className='loader'>
                                        <hr /><hr /><hr />
                                    </div>
                                )}
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
                            disabled={typingLock}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <div>
                            <img src={assets.mic_icon} alt="" />
                            {input && !typingLock ? (
                                <img onClick={sendMessage} src={assets.send_icon} alt="" />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ 좌석 모달 */}
            <SeatModal
                open={seatModalOpen}
                scheduleNum={scheduleNum}
                onClose={() => setSeatModalOpen(false)}
            />
        </div>
    );
};

export default Main;
