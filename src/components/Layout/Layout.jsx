import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

// 로그인 후 진입하는 공통 레이아웃
// react-router-dom의 Outlet이 오른쪽 콘텐츠 영역 역할을 하고,
// 왼쪽엔 항상 Sidebar가 따라붙는 구조.
export default function Layout({ onLogout }) {
  return (
    <div className="layout-container">
      <Sidebar onLogout={onLogout} />
      <Outlet />
    </div>
  );
}
