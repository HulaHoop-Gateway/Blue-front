import React from 'react';
import './TermsModal.css';

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
