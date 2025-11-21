import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import "./Layout.css";

export default function Layout({ onLogout }) {
  return (
    <div className="layout-container">
      <Sidebar onLogout={onLogout} />
      <Outlet />
    </div>
  );
}
