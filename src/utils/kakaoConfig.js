// 카카오 SDK 초기화 (공유하기 메시지용)
// 카카오맵 SDK랑 스크립트가 겹쳐서 두 번 로드되면 런타임 에러 터짐.
// 그래서 여기서 window 객체 뒤져보고 이미 누가 켜놨으면 초기화 패스하는 방어 로직임.
const KAKAO_MESSAGE_KEY = import.meta.env.VITE_KAKAO_MESSAGE_KEY;

export const initKakao = () => {
    // Kakao SDK가 이미 로드되어 있는지 확인
    if (!window.Kakao) {
        console.warn('Kakao SDK not loaded yet'); // index.html에 스크립트 태그 자체가 안 불려왔을 때
        return;
    }

    // 이미 초기화되어 있으면 스킵 (메인화면 맵이 이미 켜놨을 확률 99%)
    if (window.Kakao.isInitialized()) {
        console.log('Kakao SDK already initialized (likely by map)');
        return;
    }

    // 공유하기 기능 쓰려면 카카오 데브에서 발급받은 내 자바스크립트 키를 꽂아줘야 함
    window.Kakao.init(KAKAO_MESSAGE_KEY);
    console.log('Kakao SDK initialized for messaging:', window.Kakao.isInitialized());
};

export const isKakaoReady = () => {
    return window.Kakao && window.Kakao.isInitialized();
};
