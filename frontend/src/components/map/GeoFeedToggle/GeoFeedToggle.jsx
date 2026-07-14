import "./GeoFeedToggle.css";

import { PanelRight } from "lucide-react";

import useGeoFeed
    from "../../../context/useGeoFeed";

function GeoFeedToggle() {

    const {
        isGeoFeedOpen,
        setIsGeoFeedOpen,
        setFeedSource,
    } = useGeoFeed();

    if (isGeoFeedOpen) {

        return null;

    }

    return (

        <button
            className="geo-feed-toggle"

            onClick={() => {

                setFeedSource(
                    "viewport"
                );

                setIsGeoFeedOpen(true);
            }}
        >

            <PanelRight size={20} />

        </button>

    );
}

export default GeoFeedToggle;