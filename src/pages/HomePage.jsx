import React from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Main from "../components/Main/Main";

export default function HomePage({ onLogout }) {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <Sidebar onLogout={onLogout} />
      <Main />
    </div>
  );
}
