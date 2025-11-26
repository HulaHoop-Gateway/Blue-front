import React, { useEffect, useState, useRef, memo } from 'react';

const KakaoMap = ({ locations }) => {
  const mapContainerRef = useRef(null); // Ref for the div where the map will be rendered
  const mapInstanceRef = useRef(null);  // Ref to store the map instance
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Effect for loading the Kakao Map API script only once
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

  // Main effect for map creation and updates
  useEffect(() => {
    // Exit if the script isn't loaded or the container isn't ready
    if (!scriptLoaded || !mapContainerRef.current) {
      console.log('🗺️ KakaoMap: script not loaded or container not ready', { scriptLoaded, hasContainer: !!mapContainerRef.current });
      return;
    }

    // ⚡️ 깜빡임 방지: 데이터가 이전과 완전히 동일하면 지도 재생성 스킵
    const isSameLocations = JSON.stringify(locations) === JSON.stringify(prevLocationsRef.current);
    if (isSameLocations && mapInstanceRef.current) {
      return;
    }

    // 데이터가 다르면 업데이트
    prevLocationsRef.current = locations;

    console.log('🗺️ KakaoMap: Rendering map with locations:', locations);

    // ✅ 기존 지도 완전히 파괴 (새로운 데이터일 때만)
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
      // 컨테이너 내용 완전히 비우기
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    }

    // ✅ IntersectionObserver로 컨테이너가 화면에 보일 때 지도 초기화
    const initMap = () => {
      // 지도 생성
      const options = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
      };
      const newMap = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapInstanceRef.current = newMap;
      console.log('🗺️ KakaoMap: Map instance created');

      // 타일 로드 이벤트 리스너
      window.kakao.maps.event.addListener(newMap, 'tilesloaded', function () {
        // 타일 로드 완료 시점
      });

      // 마커 추가
      updateMarkers();
    };

    const updateMarkers = () => {
      const map = mapInstanceRef.current;
      if (!map || !locations || locations.length === 0) return;

      // 기존 마커 제거 (필요하다면)
      // 이 예제에서는 마커를 다시 생성하므로 기존 마커를 관리하는 로직이 필요할 수 있습니다.
      // 예를 들어, 마커 배열을 관리하고 map.setMap(null)로 제거하는 방식.
      // 여기서는 간단히 새 마커를 추가하고 bounds를 재설정합니다.

      const bounds = new window.kakao.maps.LatLngBounds();

      locations.forEach(location => {
        const markerPosition = new window.kakao.maps.LatLng(location.latitude, location.longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: map,
        });

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

        window.kakao.maps.event.addListener(marker, 'click', function () {
          infowindow.open(map, marker);
        });

        bounds.extend(markerPosition);
      });

      map.setBounds(bounds);
    };

    // IntersectionObserver로 컨테이너가 보일 때 초기화
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('🗺️ KakaoMap: Container is visible, initializing map');
          // 즉시 초기화 (지연 시간 제거하여 반응성 향상)
          initMap();
          observer.disconnect();
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
        // border: '2px solid red', // 디버깅용: 컨테이너 영역 확인
        borderRadius: '0px', // 모서리 둥글기 제거
        overflow: 'visible' // overflow 숨김 제거
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

export default memo(KakaoMap);