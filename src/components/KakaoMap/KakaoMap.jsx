import React, { useEffect, useState, useContext, useRef } from 'react';
import { Context } from '../../context/Context'; // Import Context

const KakaoMap = () => {
  const { bikeLocations } = useContext(Context);
  const [mapCenter] = useState({ latitude: 33.450701, longitude: 126.570667 }); // Default to Jeju Island, no longer dynamic from internal fetch

  const mapRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const markersRef = useRef([]); // To keep track of current markers

  // Effect for loading the Kakao Map API script only once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_APP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        setScriptLoaded(true);
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []); // Empty dependency array means it runs once on mount

  // Effect for map initialization and marker management
  useEffect(() => {
    if (!scriptLoaded) return;

    const container = document.getElementById('map');
    if (!container) return; // Ensure container exists

    if (!mapRef.current) { // Initialize map only once
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.latitude, mapCenter.longitude),
        level: 3,
      };
      mapRef.current = new window.kakao.maps.Map(container, options);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for bike locations
    if (bikeLocations && bikeLocations.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds(); // To adjust map bounds

      bikeLocations.forEach(bike => {
        const markerPosition = new window.kakao.maps.LatLng(bike.latitude, bike.longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map: mapRef.current,
        });
        markersRef.current.push(marker); // Store marker reference

        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:12px;">${bike.bicycleCode} (${bike.bicycleType}) - ${bike.status}</div>`
        });

        window.kakao.maps.event.addListener(marker, 'click', function() {
          infowindow.open(mapRef.current, marker);
        });

        bounds.extend(markerPosition); // Extend bounds for each marker
      });

      // Center map to show all markers
      mapRef.current.setBounds(bounds);
    } else {
      // If no bike locations, reset to default center
      mapRef.current.setCenter(new window.kakao.maps.LatLng(mapCenter.latitude, mapCenter.longitude));
    }

  }, [scriptLoaded, bikeLocations, mapCenter]); // Dependencies for map and marker updates

  return (
    <div id="map" style={{ width: '100%', height: '500px' }}></div>
  );
};

export default KakaoMap;