import "./MapPage.css";

import {
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import MapContainer from "../../components/map/MapContainer/MapContainer";
import GeoToolbar from "../../components/map/GeoToolbar/GeoToolbar";
import GeoFeedToggle from "../../components/map/GeoFeedToggle/GeoFeedToggle";
import GeoFeedPanel from "../../components/map/GeoFeedPanel/GeoFeedPanel";
import GeoPostPreview from "../../components/map/GeoPostPreview/GeoPostPreview";

import useCreatePostModal from "../../context/useCreatePostModal";
import useMap from "../../context/useMap";
import useGeoFeed from "../../context/useGeoFeed";
import usePosts from "../../context/usePosts";
import useSearch from "../../context/useSearch";

import findNearbyPosts from "../../lib/findNearbyPosts";
import reverseGeocode from "../../lib/reverseGeocode";

import {
    getPlaces,
    getCategories,
} from "../../services/placeService";

function getCategoryIcon(category) {
    const code = category?.category_code;
    const id = Number(category?.category_id);

    if (code === "historical" || id === 1) {
        return "🏛️";
    }

    if (code === "museum" || id === 2) {
        return "🖼️";
    }

    if (code === "entertainment" || id === 3) {
        return "🎡";
    }

    if (code === "ecology" || id === 4) {
        return "🌳";
    }

    if (code === "food" || id === 5) {
        return "🍲";
    }

    if (code === "architecture" || id === 6) {
        return "🏢";
    }

    if (code === "religion" || id === 7) {
        return "🕌";
    }

    if (code === "shopping" || id === 8) {
        return "🛍️";
    }

    if (code === "coffee" || id === 9) {
        return "☕";
    }

    return "📌";
}

function normalizeApiList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    return data?.results || [];
}

function getPostId(post) {
    return (
        post?.post_id ??
        post?.id ??
        null
    );
}

function samePostId(firstPost, secondPost) {
    const firstId = getPostId(firstPost);
    const secondId = getPostId(secondPost);

    if (
        firstId === null ||
        firstId === undefined ||
        secondId === null ||
        secondId === undefined
    ) {
        return firstPost === secondPost;
    }

    return String(firstId) === String(secondId);
}

function getPostLatLng(post) {
    const lat =
        post?.geo?.lat ??
        post?.latitude;

    const lng =
        post?.geo?.lng ??
        post?.longitude;

    const numberLat = Number(lat);
    const numberLng = Number(lng);

    if (
        !Number.isFinite(numberLat) ||
        !Number.isFinite(numberLng)
    ) {
        return null;
    }

    return {
        lat: numberLat,
        lng: numberLng,
    };
}

function MapPage() {
    const navigate = useNavigate();

    const { posts } = usePosts();

    const {
        selectedPlace,
        setSelectedPlace,
    } = useSearch();

    const {
        map,
        pendingPost,
        setPendingPost,
    } = useMap();

    const {
        isGeoFeedOpen,
        setSelectedPost,
        setSelectedLocation,
        setIsGeoFeedOpen,
        setSearchAreaPosts,
        setFeedSource,
    } = useGeoFeed();

    const {
        isLocationPickerOpen,
        setGeo,
        setIsLocationPickerOpen,
        openCreatePostModal,
    } = useCreatePostModal();

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState(null);

    const [
        activeLayer,
        setActiveLayer,
    ] = useState("osm");

    const [
        places,
        setPlaces,
    ] = useState([]);

    const [
        categories,
        setCategories,
    ] = useState([]);

    useEffect(() => {
        async function fetchPlacesData() {
            try {
                const data = await getPlaces();

                setPlaces(
                    normalizeApiList(data)
                );
            } catch (error) {
                console.error(
                    "Lỗi khi tải địa điểm:",
                    error
                );

                setPlaces([]);
            }
        }

        fetchPlacesData();
    }, []);

    useEffect(() => {
        async function fetchCategoriesData() {
            try {
                const data =
                    await getCategories();

                setCategories(
                    normalizeApiList(data)
                );
            } catch (error) {
                console.error(
                    "Lỗi khi tải danh mục:",
                    error
                );

                setCategories([]);
            }
        }

        fetchCategoriesData();
    }, []);

    useEffect(() => {
        if (
            !map ||
            !pendingPost ||
            !map._loaded
        ) {
            return;
        }

        const coord =
            getPostLatLng(pendingPost);

        if (!coord) {
            setPendingPost(null);
            return;
        }

        const latestPost =
            posts.find((post) =>
                samePostId(
                    post,
                    pendingPost
                )
            ) || pendingPost;

        const nearbyPosts =
            findNearbyPosts(
                posts,
                coord.lat,
                coord.lng
            );

        const panelPosts = [
            latestPost,
            ...nearbyPosts.filter(
                (post) =>
                    !samePostId(
                        post,
                        latestPost
                    )
            ),
        ];

        map.flyTo(
            [
                coord.lat,
                coord.lng,
            ],
            17,
            {
                animate: true,
                duration: 1.5,
            }
        );

        setSearchAreaPosts(
            panelPosts
        );

        setFeedSource(
            "marker"
        );

        setSelectedPost(
            latestPost
        );

        setSelectedLocation(
            latestPost?.place?.name ||
            latestPost?.geo?.locationName ||
            latestPost?.location_name ||
            latestPost?.locationName ||
            "Vị trí bài viết"
        );

        setIsGeoFeedOpen(true);
        setPendingPost(null);
    }, [
        map,
        pendingPost,
        posts,
        setPendingPost,
        setSearchAreaPosts,
        setFeedSource,
        setSelectedPost,
        setSelectedLocation,
        setIsGeoFeedOpen,
    ]);

    useEffect(() => {
        if (
            !map ||
            !selectedPlace ||
            !map._loaded
        ) {
            return;
        }

        map.flyTo(
            [
                selectedPlace.geo.lat,
                selectedPlace.geo.lng,
            ],
            17,
            {
                animate: true,
                duration: 1.5,
            }
        );

        const nearbyPosts =
            findNearbyPosts(
                posts,
                selectedPlace.geo.lat,
                selectedPlace.geo.lng
            );

        setSearchAreaPosts(
            nearbyPosts
        );

        setSelectedPost(
            nearbyPosts[0] || null
        );

        setFeedSource(
            "search"
        );

        setSelectedLocation(
            selectedPlace.name
        );

        setIsGeoFeedOpen(true);
        setSelectedPlace(null);
    }, [
        map,
        posts,
        selectedPlace,
        setSelectedPost,
        setSelectedPlace,
        setSearchAreaPosts,
        setSelectedLocation,
        setIsGeoFeedOpen,
        setFeedSource,
    ]);

    return (
        <main
            className="map-page"
            style={{
                position: "relative",
            }}
        >
            {isLocationPickerOpen && (
                <div className="map-page__picker-banner">
                    <strong>
                        📍 Chế độ chọn vị trí
                    </strong>

                    <span>
                        Nhấn vào bản đồ để gắn vị trí cho bài viết
                    </span>
                </div>
            )}

            <div
                className={
                    isGeoFeedOpen
                        ? "map-page__category-menu map-page__category-menu--panel-open"
                        : "map-page__category-menu"
                }
            >
                <button
                    type="button"
                    onClick={() =>
                        setSelectedCategory(null)
                    }
                    className={
                        selectedCategory === null
                            ? "category-menu__btn category-menu__btn--active"
                            : "category-menu__btn"
                    }
                    style={{
                        fontFamily: "inherit",
                    }}
                >
                    🌍 Tất cả
                </button>

                {categories.map(
                    (category) => (
                        <button
                            type="button"
                            key={
                                category.category_id
                            }
                            onClick={() =>
                                setSelectedCategory(
                                    category.category_id
                                )
                            }
                            className={
                                selectedCategory ===
                                category.category_id
                                    ? "category-menu__btn category-menu__btn--active"
                                    : "category-menu__btn"
                            }
                            style={{
                                fontFamily:
                                    "inherit",
                            }}
                        >
                            {getCategoryIcon(
                                category
                            )}{" "}
                            {
                                category.category_name
                            }
                        </button>
                    )
                )}
            </div>

            <MapContainer
                activeLayer={activeLayer}
                isPickingLocation={
                    isLocationPickerOpen
                }
                selectedCategory={
                    selectedCategory
                }
                places={places}
                onPickLocation={async (
                    coord
                ) => {
                    try {
                        const locationName =
                            await reverseGeocode(
                                coord.lat,
                                coord.lng
                            );

                        setGeo({
                            lat: coord.lat,
                            lng: coord.lng,
                            locationName,
                            source: "map",
                        });
                    } catch (error) {
                        console.error(
                            error
                        );

                        setGeo({
                            lat: coord.lat,
                            lng: coord.lng,
                            locationName:
                                "Vị trí đã chọn",
                            source: "map",
                        });
                    }

                    setIsLocationPickerOpen(
                        false
                    );

                    openCreatePostModal();
                    navigate("/");
                }}
            />

            <GeoToolbar
                activeLayer={activeLayer}
                setActiveLayer={
                    setActiveLayer
                }
            />

            <GeoFeedToggle />

            <GeoPostPreview />

            <GeoFeedPanel />
        </main>
    );
}

export default MapPage;
