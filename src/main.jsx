import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ContextProvider } from "./context/Context";

// 리액트 앱의 심장부(진입점)
// 여기서 ContextProvider(전역 상태)로 앱 전체를 감싸주기 때문에, 
// 하위의 어떤 컴포넌트에서든 자유롭게 데이터(토큰, 챗봇 상태 등)를 꺼내 쓸 수 있게 됨.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ContextProvider>
    <App />
  </ContextProvider>,
)
