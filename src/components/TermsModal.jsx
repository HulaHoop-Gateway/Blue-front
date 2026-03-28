import React from 'react';
import './TermsModal.css';

// 약관 내용 보기 모달
// 회원가입 폼에서 약관 항목 텍스트 클릭 시 뜨는 모달
// title(약관 제목)과 content(약관 본문)를 props로 받아서 그냥 보여주는 다목적 컴포넌트
const TermsModal = ({ title, content, onClose }) => {
    return (
        <div className="terms-modal-overlay" onClick={onClose}>
            <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="terms-modal-header">
                    <h2>{title}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="terms-modal-body">
                    <pre>{content}</pre>
                </div>
                <div className="terms-modal-footer">
                    <button className="confirm-button" onClick={onClose}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
