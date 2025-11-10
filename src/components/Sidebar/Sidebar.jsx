// src/components/Sidebar/Sidebar.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';

const Sidebar = ({ onLogout }) => {
    const [extended, setExtended] = useState(false);
    const { onSent, prevPrompts, setRecentPrompt, newChat } = useContext(Context);
    const navigate = useNavigate();

    const loadPrompt = async (prompt) => {
        setRecentPrompt(prompt);
        await onSent(prompt);
    };

    return (
        <div className={`sidebar ${extended ? 'extended' : ''}`}>
            <div className="top">
                <img
                    onClick={() => setExtended(prev => !prev)} 
                    className="menu" 
                    src={assets.menu_icon} 
                    alt="메뉴" 
                />
                <div onClick={() => newChat()} className="new-chat">
                    <img src={assets.plus_icon} alt="새로운 채팅" />
                    {extended && <p>새로운 채팅</p>}
                </div>

                {/* {extended && (
                    <div className="recent">
                        <p className="recent-title">최근 내역</p>
                        {prevPrompts.map((item, index) => (
                            <div onClick={() => loadPrompt(item)} className="recent-entry" key={index}>
                                <img src={assets.message_icon} alt="메시지 아이콘" />
                                <p>{item.slice(0, 18)} ...</p>
                            </div>
                        ))}
                    </div>
                )} */}
            </div>

            <div className="bottom">
                <div className="bottom-item recent-entry" onClick={() => navigate('/mypage')} style={{ cursor: 'pointer' }}>
                    <img src={assets.user_icon} alt="마이페이지" />
                    <p className={extended ? 'visible' : 'hidden'}>마이페이지</p>
                </div>
                <div className="bottom-item recent-entry" onClick={onLogout} style={{ cursor: 'pointer' }}>
                    <img src={assets.user_icon} alt="로그아웃 아이콘으로 바꿀 예정" />
                    <p className={extended ? 'visible' : 'hidden'}>로그아웃</p>
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.question_icon} alt="Help" />
                    <p className={extended ? 'visible' : 'hidden'}>Help</p>
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.history_icon} alt="예약 내역" />
                    <p className={extended ? 'visible' : 'hidden'}>예약 내역</p>
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.setting_icon} alt="설정" />
                    <p className={extended ? 'visible' : 'hidden'}>설정</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
