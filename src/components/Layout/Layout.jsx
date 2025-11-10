import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout({ onLogout }) {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <Sidebar onLogout={onLogout} />
      <Outlet />
    </div>
  );
}
