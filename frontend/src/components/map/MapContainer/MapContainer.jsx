import "./MapContainer.css";

import GeoPostMarkers from "../GeoPostMarkers/GeoPostMarkers";
import UserLocationMarker from "../UserLocationMarker/UserLocationMarker";
import MapBridge from "../MapBridge/MapBridge";
import MAP_LAYERS from "../../../config/mapLayers";
import MapViewportTracker from "../MapViewportTracker/MapViewportTracker";

import { useState } from "react";

import {
    MapContainer as LeafletMap,
    TileLayer,
    ZoomControl,
    useMapEvents,
} from "react-leaflet";

/* Default Map Configuration */

const DEFAULT_CENTER = [
    10.8231,
    106.6297,
];

const DEFAULT_ZOOM = 13;

function MapClickHandler({
    isPickingLocation,
    onPickLocation,
}) {
    useMapEvents({
        click(e) {

            if (!isPickingLocation) return;

            onPickLocation({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                source: "map"
            });
        },
    });

    return null;
}

/* Map Container */

function MapContainer({
    activeLayer,
    isPickingLocation,
    onPickLocation,
    selectedCategory, 
    places = [], // 🆕 CHỖ SỬA 1: Nhận thêm mảng places từ MapPage truyền xuống (Mặc định là mảng rỗng)
}) {

    /* Map View State */

    const [
        mapCenter,
    ] = useState(DEFAULT_CENTER);

    const [
        mapZoom,
    ] = useState(DEFAULT_ZOOM);

    return (

        <section className="map-container">

            {/* Leaflet Map */}

            <LeafletMap
                center={mapCenter}

                zoom={mapZoom}

                zoomControl={false}

                className="map-container__leaflet"
            >

                <MapBridge />

                <MapViewportTracker />

                {/* Tile Layer */}

                <TileLayer
                    attribution={
                        MAP_LAYERS[
                            activeLayer
                        ].attribution
                    }

                    url={
                        MAP_LAYERS[
                            activeLayer
                        ].url
                    }
                />

                {/* Custom Zoom Control */}
                <ZoomControl
                    position="bottomright"
                />

                <MapClickHandler
                    isPickingLocation={isPickingLocation}
                    onPickLocation={onPickLocation}
                />
                
                <UserLocationMarker />
                
                {/* Geo Post Markers */}
                {/* 🆕 CHỖ SỬA 2: Truyền tiếp cả selectedCategory và places xuống cho GeoPostMarkers */}
                <GeoPostMarkers 
                    selectedCategory={selectedCategory} 
                    places={places} 
                />

            </LeafletMap>

        </section>
    );
}

export default MapContainer;