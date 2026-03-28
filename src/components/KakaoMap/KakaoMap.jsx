import React, { useEffect, useState, useRef, memo } from 'react';

// AI 채팅에서 자전거/영화관 데이터가 내려오면 지도에 핀을 꽂아주는 컴포넌트
// 보이는 데이터와 지도 인스턴스를 useRef로 관리하면서, 타이핑 취소 때 불필요한 재렌더링 없앰
const KakaoMap = ({ locations }) => {
  const mapContainerRef = useRef(null); // 실제 지도가 그려질 div 요소 참조용
  const mapInstanceRef = useRef(null);  // 카카오맵 인스턴스 보관용 (state 쓰면 렌더링 다시 되니까 ref에 담아둠)
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 이펙트: 카카오맵 스크립트 태그 헤드에 동적으로 주입하기 (앱 시작시 1번)
  // 이미 로드됐다면 다시 다운로드하지 않고 바로 쓸 수 있게 스킵 처리만.
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_APP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      window.kakao.maps.load(() => {
        setScriptLoaded(true);
      });
    };
  }, []);

  const prevLocationsRef = useRef([]);

  // 핵심 - 지도 생성 및 마커 갱신 이펙트
  // locations 데이터가 달라질 때마다 실행됨.
  // 다만 이전이랑 완전히 똑같으면 쓸데없이 지도를 다시 그리지 않음 (JSON.stringify로 얕은 비교).
  useEffect(() => {
    if (!scriptLoaded || !mapContainerRef.current) {
      console.log('KakaoMap: 스크립트 미로드 또는 컨테이너 준비 안 됨', { scriptLoaded, hasContainer: !!mapContainerRef.current });
      return;
    }

    // 이전과 완전 동일한 데이터면 지도 재생성 스킵 (깜빡임 방지)
    const isSameLocations = JSON.stringify(locations) === JSON.stringify(prevLocationsRef.current);
    if (isSameLocations && mapInstanceRef.current) {
      return;
    }

    prevLocationsRef.current = locations;
    console.log('KakaoMap: 지도에 핀 새로 그림:', locations);

    // 기존 지도 완전히 파괴 후 컨테이너 비우기
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    }

    // IntersectionObserver로 컨테이너가 화면에 등장할 때 지도 초기화 실행
    // (화면 밖에 있으면 카카오맵 타일 자체가 안 그려지는 버그 방지)
    const initMap = () => {
      const options = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667), // 기본 좌표
        level: 3,
      };
      const newMap = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapInstanceRef.current = newMap;
      console.log('KakaoMap: 지도 인스턴스 생성 완료');

      // 타일 다 올라왔을 때의 이벤트 (필요 시 로직 추가 가능)
      window.kakao.maps.event.addListener(newMap, 'tilesloaded', function () {
      });

      updateMarkers();
    };

    const updateMarkers = () => {
      const map = mapInstanceRef.current;
      if (!map || !locations || locations.length === 0) return;

      // 핀(마커)들이 딱 다 들어오는 영역으로 지도 자동 조정하려고 범위 계산용 객체 생성
      const bounds = new window.kakao.maps.LatLngBounds();

      locations.forEach(location => {
        const markerPosition = new window.kakao.maps.LatLng(location.latitude, location.longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: map,
        });

        // 자전거인지 영화관인지에 따라 말풍선(인포윈도우) 내용 달리 렌더링
        let content = '';
        if (location.bicycleCode) {
          content = `<div style="padding:5px;font-size:12px;">${location.bicycleCode} (${location.bicycleType}) - ${location.status}</div>`;
        } else if (location.branch_name) {
          const distance = location.distance ? `${location.distance.toFixed(1)} km` : '';
          content = `<div style="padding:5px;font-size:12px;"><b>${location.branch_name}</b><br/>${distance}</div>`;
        } else {
          content = `<div style="padding:5px;font-size:12px;">위치</div>`;
        }

        const infowindow = new window.kakao.maps.InfoWindow({
          content: content
        });

        // 마커 클릭하면 말풍선 뜨게 이벤트 달아줌
        window.kakao.maps.event.addListener(marker, 'click', function () {
          infowindow.open(map, marker);
        });

        bounds.extend(markerPosition);
      });

      // 마커 다 박은 다음 범위에 맞게 지도 뷰포트 자동 조정
      map.setBounds(bounds);
    };

    // IntersectionObserver: 컨테이너가 10% 이상 보일 때 지도 초기화 트리거
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('KakaoMap: 컨테이너 화면에 등장, 지도 초기화 시작');
          initMap();
          observer.disconnect(); // 한 번 초기화하면 감시 해제
        }
      });
    }, { threshold: 0.1 });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };

  }, [scriptLoaded, locations]);

  return (
    <div
      className="kakao-map-display"
      style={{
        position: 'relative',
        borderRadius: '0px',
        overflow: 'visible'
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

// React.memo로 감싸서 부모 컴포넌트 리렌더링 시 locations 변화 없으면 KakaoMap 자체는 리렌더링 안 함.
export default memo(KakaoMap);