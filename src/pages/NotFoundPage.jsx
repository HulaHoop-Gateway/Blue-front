import React from "react";
import "./NotFoundPage.css";

// 존재하지 않는 URL로 접근했을 때 보여주는 404 페이지
// glitch CSS 애니메이션 효과로 '404' 텍스트를 꾸밈
const NotFoundPage = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="glitch-wrapper">
                    <div className="glitch" data-text="404">404</div>
                </div>
                <h1 className="not-found-title">Page Not Found</h1>
                <p className="not-found-desc">
                    요청하신 페이지를 찾을 수 없습니다
                </p>
                <div className="circles">
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                    <div className="circle circle-3"></div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
