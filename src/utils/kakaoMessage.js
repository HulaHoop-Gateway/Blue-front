import { initKakao, isKakaoReady } from './kakaoConfig';

// 카카오톡 '공유하기' 메시지 날리는 핵심 함수
// 리액트 마운트 속도보다 카카오 스크립트 로드 속도가 느릴 수 있어서, 
// 최대 5초(0.5초 * 10번) 동안 뺑뺑이 돌면서 스크립트 태그 켜졌는지 기다려주는 무식하지만 확실한 로직 포함.
export const sendKakaoMessage = async (reservationType, reservationData) => {
    console.log('Attempting to send Kakao message:', { reservationType, reservationData });

    // SDK 로드 대기 타임루프
    let retries = 0;
    while (!window.Kakao && retries < 10) {
        console.log(`Waiting for Kakao SDK to load... (${retries + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
    }

    if (!window.Kakao) {
        console.error('Kakao SDK failed to load after 5 seconds'); // 5초 넘어도 안 오면 포기
        alert('카카오톡 SDK를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        return;
    }

    if (!isKakaoReady()) {
        console.log('Kakao not ready, initializing...');
        initKakao();
    }

    if (!window.Kakao || !window.Kakao.isInitialized()) {
        console.error('Kakao SDK not initialized');
        alert('카카오톡 메시지를 보낼 수 없습니다. SDK가 초기화되지 않았습니다.');
        return;
    }

    try {
        // 어떤 예약이냐에 따라 메시지 틀(Template) 갈아끼우기
        const messageTemplate = reservationType === 'movie'
            ? createMovieMessage(reservationData)
            : createBikeMessage(reservationData);

        console.log('Sending message template:', messageTemplate);

        // 만들어진 템플릿 들고 진짜로 카카오톡 앱 띄우는 API 트리거
        window.Kakao.Share.sendDefault(messageTemplate);
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Failed to send Kakao message:', error);
        alert('카카오톡 메시지 전송 실패: ' + error.message);
    }
};

// 영화 예약 메시지 템플릿
const createMovieMessage = (data) => {
    const { movieTitle, showtime, amount, seats } = data;

    return {
        objectType: 'feed',
        content: {
            title: '영화 예약 완료',
            description: `${movieTitle}\n\n상영시간: ${showtime}\n좌석: ${seats}\n결제금액: ${amount.toLocaleString()}원`,
            imageUrl: 'https://mud-kage.kakao.com/dn/Q2iNx/btqgeRgV54P/VLdBs9cvyn8BJXB3o7N8UK/kakaolink40_original.png',
            link: {
                mobileWebUrl: window.location.origin,
                webUrl: window.location.origin,
            },
        },
        buttons: [
            {
                title: '예약 내역 확인',
                link: {
                    mobileWebUrl: `${window.location.origin}/reservation-history`,
                    webUrl: `${window.location.origin}/reservation-history`,
                },
            },
        ],
    };
};

// 자전거 예약 메시지 템플릿
const createBikeMessage = (data) => {
    const { bikeName, rentalTime, amount, location } = data;

    return {
        objectType: 'feed',
        content: {
            title: '🚴 자전거 예약 완료',
            description: `${bikeName}\n\n📍 대여지점: ${location}\n⏰ 대여시간: ${rentalTime}\n💰 결제금액: ${amount.toLocaleString()}원`,
            imageUrl: 'https://mud-kage.kakao.com/dn/Q2iNx/btqgeRgV54P/VLdBs9cvyn8BJXB3o7N8UK/kakaolink40_original.png',
            link: {
                mobileWebUrl: window.location.origin,
                webUrl: window.location.origin,
            },
        },
        buttons: [
            {
                title: '예약 내역 확인',
                link: {
                    mobileWebUrl: `${window.location.origin}/reservation-history`,
                    webUrl: `${window.location.origin}/reservation-history`,
                },
            },
        ],
    };
};
