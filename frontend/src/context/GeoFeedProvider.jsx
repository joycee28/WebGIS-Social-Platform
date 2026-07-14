import {
    useState,
    useMemo,
} from "react";

import GeoFeedContext from "./GeoFeedContext";

import usePosts from "./usePosts";

function GeoFeedProvider({ children }) {

    const {
        posts,
    } = usePosts();

    const [mapBounds, setMapBounds]
        = useState(null);

    const [isGeoFeedOpen, setIsGeoFeedOpen]
        = useState(false);

    const [selectedLocation, setSelectedLocation]
        = useState(null);

    const [selectedPost, setSelectedPost]
        = useState(null);

    const [hoveredPost, setHoveredPost]
        = useState(null);

    const postsInView = useMemo(() => {

        if (!mapBounds) {
            return [];
        }

        return posts.filter((post) => {

            if (
                typeof post.geo?.lat !== "number" ||
                typeof post.geo?.lng !== "number"
            ) {
                return false;
            }

            return mapBounds.contains([
                post.geo.lat,
                post.geo.lng,
            ]);
        });

    }, [posts, mapBounds]);

    const [
        searchAreaPosts,
        setSearchAreaPosts,
    ] = useState([]);

    const [
        feedSource,
        setFeedSource,
    ] = useState("viewport");

    return (

        <GeoFeedContext.Provider
            value={{

                isGeoFeedOpen,
                setIsGeoFeedOpen,

                selectedLocation,
                setSelectedLocation,

                selectedPost,
                setSelectedPost,

                hoveredPost,
                setHoveredPost,

                mapBounds,
                setMapBounds,

                postsInView,

                searchAreaPosts,
                setSearchAreaPosts,

                feedSource,
                setFeedSource,
            }}
        >

            {children}

        </GeoFeedContext.Provider>

    );
}

export default GeoFeedProvider;