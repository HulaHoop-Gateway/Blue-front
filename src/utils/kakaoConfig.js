// Kakao SDK 초기화 (메시지용)
// 주의: 지도 SDK와 충돌하지 않도록 이미 초기화된 경우 스킵
const KAKAO_MESSAGE_KEY = import.meta.env.VITE_KAKAO_MESSAGE_KEY;

export const initKakao = () => {
    // Kakao SDK가 이미 로드되어 있는지 확인
    if (!window.Kakao) {
        console.warn('⚠️ Kakao SDK not loaded yet');
        return;
    }

    // 이미 초기화되어 있으면 스킵 (지도 SDK와 공존)
    if (window.Kakao.isInitialized()) {
        console.log('✅ Kakao SDK already initialized (likely by map)');
        return;
    }

    // 메시지 키로 초기화
    window.Kakao.init(KAKAO_MESSAGE_KEY);
    console.log('✅ Kakao SDK initialized for messaging:', window.Kakao.isInitialized());
};

export const isKakaoReady = () => {
    return window.Kakao && window.Kakao.isInitialized();
};
