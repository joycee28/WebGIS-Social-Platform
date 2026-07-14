import "./GeoToolbar.css";

import { useState } from "react";

import useMap from "../../../context/useMap";
import getCurrentLocation from "../../../lib/getCurrentLocation";
import useGeoFeed from "../../../context/useGeoFeed";
import usePosts from "../../../context/usePosts";
import findNearbyPosts from "../../../lib/findNearbyPosts";

import {
    Locate,
    Layers3,
    ZoomIn,
    ZoomOut,
    MapPinned,
} from "lucide-react";

/* Geo Toolbar */

function GeoToolbar({
    activeLayer,
    setActiveLayer,
}) {

    const {
        map,
        userLocation,
        setUserLocation,
    } = useMap();

    const {
        posts,
    } = usePosts();

    const {
        setSearchAreaPosts,
        setFeedSource,
        setSelectedPost,
        setSelectedLocation,
        setIsGeoFeedOpen,
    } = useGeoFeed();

    const [isLayerOpen,
        setIsLayerOpen]
        = useState(false);

    function handleZoomIn() {

        if (!map) return;

        map.zoomIn();
    }

    function handleZoomOut() {

        if (!map) return;

        map.zoomOut();
    }

    async function handleLocate() {

        if (!map) return;

        try {

            const location =
                await getCurrentLocation();

            setUserLocation(
                location
            );

            map.flyTo(
                [
                    location.lat,
                    location.lng,
                ],
                16,
                {
                    duration: 1.5,
                }
            );

        } catch (error) {

            console.error(error);

            alert(
                "Không thể lấy vị trí hiện tại."
            );
        }
    }

    function handleNearbyPosts() {

        if (!userLocation) {

            alert(
                "Hãy xác định vị trí hiện tại trước."
            );

            return;
        }

        const nearbyPosts =
            findNearbyPosts(
                posts,
                userLocation.lat,
                userLocation.lng
            );

        setSearchAreaPosts(
            nearbyPosts
        );

        setSelectedPost(
            nearbyPosts[0] || null
        );

        setSelectedLocation(
            null
        );

        setFeedSource(
            "nearby"
        );

        setIsGeoFeedOpen(
            true
        );
    }

    return (


        <div className="geo-toolbar-wrapper">

            <div className="geo-toolbar">

                <button
                    className="geo-toolbar__button"
                    onClick={handleZoomIn}
                >

                    <ZoomIn size={20} />

                </button>

                <button
                    className="geo-toolbar__button"
                    onClick={handleZoomOut}
                >

                    <ZoomOut size={20} />

                </button>

                <button
                    className="geo-toolbar__button"
                    onClick={handleLocate}
                >

                    <Locate size={20} />

                </button>

                <button
                    className="geo-toolbar__button"
                    onClick={handleNearbyPosts}
                >

                    <MapPinned size={20} />

                </button>

                <button
                    className="geo-toolbar__button"

                    onClick={() => {
                        setIsLayerOpen(
                            prev => !prev
                        );
                    }}
                >

                    <Layers3 size={20} />

                </button>

            </div>

            {
                isLayerOpen && (

                    <div
                        className="geo-toolbar__layers"
                    >

                        <button
                            className={
                                activeLayer === "osm"
                                    ? "geo-toolbar__layer geo-toolbar__layer--active"
                                    : "geo-toolbar__layer"
                            }

                            onClick={() =>
                                setActiveLayer("osm")
                            }
                        >
                            OpenStreetMap
                        </button>

                        <button
                            className={
                                activeLayer === "dark"
                                    ? "geo-toolbar__layer geo-toolbar__layer--active"
                                    : "geo-toolbar__layer"
                            }

                            onClick={() =>
                                setActiveLayer("dark")
                            }
                        >
                            Dark
                        </button>

                        <button
                            className={
                                activeLayer === "satellite"
                                    ? "geo-toolbar__layer geo-toolbar__layer--active"
                                    : "geo-toolbar__layer"
                            }

                            onClick={() =>
                                setActiveLayer("satellite")
                            }
                        >
                            Satellite
                        </button>

                    </div>

                )
            }
        </div>
    );
}

export default GeoToolbar;