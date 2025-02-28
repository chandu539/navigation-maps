import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import axios from "axios";
import "./App.css";

const startIcon = L.divIcon({
  className: "custom-icon",
  html: '<span style="font-size: 30px;">⚪</span>', 
  iconSize: [40, 40],  
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const endIcon = L.divIcon({
  className: "custom-icon",
  html: '<span style="font-size: 30px;">🚩</span>', 
  iconSize: [40, 40],  
  iconAnchor: [20, 40], 
  popupAnchor: [0, -40],
});

const DrawRoute = ({ start, end }) => {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.routes.length > 0) {
          const routeCoordinates = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          const polyline = L.polyline(routeCoordinates, {
            color: "blue",
            weight: 5,
            opacity: 0.7,
          }).addTo(map);

          map.fitBounds(polyline.getBounds());
        }
      })
      .catch((error) => console.error("Error fetching route:", error));
  }, [start, end, map]);

  return null;
};

const App = () => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [mapType, setMapType] = useState("normal");

  const fetchCoordinates = async (address, setCoords) => {
    try {
      const response = await axios.get(`https://navigation-maps-backend.vercel.app/geocode?address=${address}`);
      setCoords([response.data.lat, response.data.lng]);
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  const handleSearch = () => {
    if (startLocation) fetchCoordinates(startLocation, setStartCoords);
    if (endLocation) fetchCoordinates(endLocation, setEndCoords);
  };

  const swapLocations = () => {
    setStartLocation(endLocation);
    setEndLocation(startLocation);
    setStartCoords(endCoords);
    setEndCoords(startCoords);
  };

  const [showDropdown, setShowDropdown] = useState(false);

  const handleUseMyLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setStartCoords([latitude, longitude]);
  
          try {
            
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            setStartLocation(response.data.display_name || `${latitude}, ${longitude}`);
          } catch (error) {
            console.error("Error fetching address:", error);
            setStartLocation(`${latitude}, ${longitude}`);
          }
  
          setShowDropdown(false); 
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Unable to fetch location. Please allow location access.");
        },
        {
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0, 
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };
  

  

  return (
    <div className="container">
      <h2 className="title">Navigation Map</h2>

      <div className="input-container" style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Enter Initial Location"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
          className="input-box"
        />
      
        {showDropdown && (
          <div className="dropdown" onMouseDown={handleUseMyLocation}>
            📍 Use Current Location
          </div>
        )}


        <button className="swap-button" onClick={swapLocations}>🔄</button>
        <input
          type="text"
          placeholder="Enter Destination"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          className="input-box"
        />
        <button className="search-button" onClick={handleSearch}>Find Route</button>
      </div>

      <div className="map-type-container">
        <label>Select Map Type:</label>
        <select onChange={(e) => setMapType(e.target.value)} className="map-select">
          <option value="normal">Normal</option>
          <option value="satellite">Satellite</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <MapContainer center={[20.5937, 78.9629]} zoom={5} className="map-container">
        {mapType === "normal" && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}
        {mapType === "satellite" && <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />}
        {mapType === "hybrid" && <TileLayer url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} />}

        {startCoords && <Marker position={startCoords} icon={startIcon}><Popup>Start Location</Popup></Marker>}
        {endCoords && <Marker position={endCoords} icon={endIcon}><Popup>Destination</Popup></Marker>}

        {startCoords && endCoords && <DrawRoute start={startCoords} end={endCoords} />}
      </MapContainer>
    </div>
  );
};

export default App;
