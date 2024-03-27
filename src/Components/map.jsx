import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

// const libraries = ['places'];
const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
};
const center = {
  lat: 7.2905715, // default latitude
  lng: 80.6337262, // default longitude
};

const Map = ( {latitude , longitude} ) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCmIZu7u2rel8TWvhsy2beZhkeHQSIjqhc',
    // libraries,
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps</div>;
  }

  let center2 = {
    lat: parseFloat(latitude), 
    lng: parseFloat(longitude)
  };

  const markerIcon = {
    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    scaledSize: new window.google.maps.Size(30, 30),
    origin: new window.google.maps.Point(0, 0),
    anchor: new window.google.maps.Point(15, 15),
  };


  // console.log("location : " , center2) ; 
  return (
    <div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={20}
        center={center2}
        mapTypeId = 'satellite'

      >
        <Marker position={center2} />
        {/* <Marker position={center2} icon={markerIcon}  /> */}
      </GoogleMap>
    </div>
  );
};

export default Map;
