import { initKakao, isKakaoReady } from './kakaoConfig';

// 카카오톡 메시지 전송 (SDK 로드 대기 포함)
export const sendKakaoMessage = async (reservationType, reservationData) => {
    console.log('📱 Attempting to send Kakao message:', { reservationType, reservationData });

    // Kakao SDK 로드 대기 (최대 5초)
    let retries = 0;
    while (!window.Kakao && retries < 10) {
        console.log(`⏳ Waiting for Kakao SDK to load... (${retries + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
    }

    if (!window.Kakao) {
        console.error('❌ Kakao SDK failed to load after 5 seconds');
        alert('카카오톡 SDK를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        return;
    }

    // Kakao SDK 초기화 확인
    if (!isKakaoReady()) {
        console.log('⚙️ Kakao not ready, initializing...');
        initKakao();
    }

    if (!window.Kakao || !window.Kakao.isInitialized()) {
        console.error('❌ Kakao SDK not initialized');
        alert('카카오톡 메시지를 보낼 수 없습니다. SDK가 초기화되지 않았습니다.');
        return;
    }

    try {
        const messageTemplate = reservationType === 'movie'
            ? createMovieMessage(reservationData)
            : createBikeMessage(reservationData);

        console.log('📤 Sending message template:', messageTemplate);
        window.Kakao.Share.sendDefault(messageTemplate);
        console.log('✅ Message sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send Kakao message:', error);
        alert('카카오톡 메시지 전송 실패: ' + error.message);
    }
};

// 영화 예약 메시지 템플릿
const createMovieMessage = (data) => {
    const { movieTitle, showtime, amount, seats } = data;

    return {
        objectType: 'feed',
        content: {
            title: '🎬 영화 예약 완료',
            description: `${movieTitle}\n\n📅 상영시간: ${showtime}\n💺 좌석: ${seats}\n💰 결제금액: ${amount.toLocaleString()}원`,
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
