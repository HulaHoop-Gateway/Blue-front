import React, { useContext, useEffect, useRef } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';

const Main = () => {
    const { onSent, showResult, loading, resultData, setInput, input, history, typingLock } = useContext(Context);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            const element = chatContainerRef.current;
            element.scrollTo({
                top: element.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [history, resultData]);

    const sendMessage = () => {
        if (input.trim() === '' || typingLock) return;
        onSent(input);
    }

    const handleKeyDown = (e) => {
        if (typingLock) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    }

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
                                    <p>예약하시고 싶은 영화를 말씀해주세요!<br/>
                                    먼저 예약을 진행하시고 싶은 영화관 지점을 말해주시면 AI가 상영 중인 영화를 안내합니다.
                                    영화 선택 후 시간과 정보들을 알려주시면 결제를 진행합니다.</p>
                                    <img src={assets.compass_icon} alt="영화관 아이콘" />
                                </div>
                                <div className="card">
                                    <p>예약하시고 싶은 자전거를 말씀해주세요!</p>
                                    <img src={assets.compass_icon} alt="자전거아이콘" />
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
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setInput(e.target.value)}
                            value={input}
                            type="text"
                            placeholder='텍스트를 입력해주세요..'
                            disabled={typingLock}
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
        </div>
    );
}

export default Main;
