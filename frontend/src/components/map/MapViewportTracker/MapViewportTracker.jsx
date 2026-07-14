import { useEffect } from "react";

import { useMap } from "react-leaflet";

import useGeoFeed
    from "../../../context/useGeoFeed";

function MapViewportTracker() {

    const map = useMap();

    const {
        setMapBounds,
        setFeedSource,
        setSelectedLocation,
        setSelectedPost,
    } = useGeoFeed();

    useEffect(() => {

        function updateBounds() {

            setMapBounds(
                map.getBounds()
            );
        }

        updateBounds();

        map.on(
            "moveend",
            updateBounds
        );

        map.on(
            "zoomend",
            updateBounds
        );

        return () => {

            map.off(
                "moveend",
                updateBounds
            );

            map.off(
                "zoomend",
                updateBounds
            );
        };

    }, [
        map,
        setMapBounds,
        setFeedSource,
    ]);

    useEffect(() => {

        function handleUserInteraction() {

            setFeedSource(
                "viewport"
            );

            setSelectedLocation(
                null
            );

            setSelectedPost(
                null
            );
        }

        map.on(
            "dragstart",
            handleUserInteraction
        );

        map.on(
            "zoomstart",
            handleUserInteraction
        );

        return () => {

            map.off(
                "dragstart",
                handleUserInteraction
            );

            map.off(
                "zoomstart",
                handleUserInteraction
            );
        };

    }, [
        map,
        setFeedSource,
        setSelectedLocation,
        setSelectedPost,
    ]);

    return null;
}

export default MapViewportTracker;