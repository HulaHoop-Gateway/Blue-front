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

  // Main effect for map creation and updates
  useEffect(() => {
    // Exit if the script isn't loaded or the container isn't ready
    if (!scriptLoaded || !mapContainerRef.current) {
      return;
    }

    // Create map instance only once
    if (!mapInstanceRef.current) {
      const options = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
      };
      mapInstanceRef.current = new window.kakao.maps.Map(mapContainerRef.current, options);
    }

    const map = mapInstanceRef.current;
    
    // Create bounds object to reposition map
    if (locations && locations.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();

      locations.forEach(bike => {
        const markerPosition = new window.kakao.maps.LatLng(bike.latitude, bike.longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: map,
        });

        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:12px;">${bike.bicycleCode} (${bike.bicycleType}) - ${bike.status}</div>`
        });

        window.kakao.maps.event.addListener(marker, 'click', function() {
          infowindow.open(map, marker);
        });

        bounds.extend(markerPosition);
      });

      // Set map bounds to show all markers
      map.setBounds(bounds);
    }

    // Use ResizeObserver to call relayout when the container size changes
    const observer = new ResizeObserver(() => {
      map.relayout();
    });
    
    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };

  }, [scriptLoaded, locations]); // Rerun when script is loaded or locations change

  return (
    // Outer div for styling and layout (shadows, border-radius, etc.)
    <div className="kakao-map-display">
      {/* Inner div is the clean target for the Kakao Maps API */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default memo(KakaoMap);