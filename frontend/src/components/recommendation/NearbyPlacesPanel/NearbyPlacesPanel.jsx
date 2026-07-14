import "./NearbyPlacesPanel.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    LocateFixed,
    MapPin,
    Navigation,
    RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getPlaces } from "../../../services/placeService";
import useSearch from "../../../context/useSearch";
import calculateDistance from "../../../lib/calculateDistance";

const MAX_RESULTS = 5;

function normalizeApiList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

function getCategoryIcon(place) {
    const code =
        place?.category_code ||
        place?.category?.category_code ||
        "";

    const categoryId = Number(
        place?.category_id ||
        place?.category ||
        place?.category?.category_id
    );

    if (code === "historical" || categoryId === 1) {
        return "🏛️";
    }

    if (code === "museum" || categoryId === 2) {
        return "🖼️";
    }

    if (code === "entertainment" || categoryId === 3) {
        return "🎡";
    }

    if (code === "ecology" || categoryId === 4) {
        return "🌳";
    }

    if (code === "food" || categoryId === 5) {
        return "🍲";
    }

    if (code === "architecture" || categoryId === 6) {
        return "🏢";
    }

    if (code === "religion" || categoryId === 7) {
        return "🕌";
    }

    if (code === "shopping" || categoryId === 8) {
        return "🛍️";
    }

    if (code === "coffee" || categoryId === 9) {
        return "☕";
    }

    return "📍";
}

function formatDistance(distance) {
    if (!Number.isFinite(distance)) {
        return "";
    }

    if (distance < 1) {
        return `${Math.round(distance * 1000)} m`;
    }

    return `${distance.toFixed(1)} km`;
}

function normalizePlace(place, userLocation) {
    const latitude = Number(
        place?.latitude ??
        place?.geo?.lat
    );

    const longitude = Number(
        place?.longitude ??
        place?.geo?.lng
    );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        latitude,
        longitude
    );

    if (distance === null) {
        return null;
    }

    return {
        ...place,

        id:
            place?.place_id ??
            place?.id,

        name:
            place?.place_name ||
            place?.name ||
            "Địa điểm chưa có tên",

        address:
            place?.address ||
            place?.description ||
            "",

        categoryName:
            place?.category_name ||
            place?.category?.category_name ||
            "Địa điểm",

        latitude,
        longitude,
        distance,

        geo: {
            lat: latitude,
            lng: longitude,
        },
    };
}

function NearbyPlacesPanel() {
    const navigate = useNavigate();

    const {
        setSelectedPlace,
    } = useSearch();

    const [
        places,
        setPlaces,
    ] = useState([]);

    const [
        userLocation,
        setUserLocation,
    ] = useState(null);

    const [
        isGettingLocation,
        setIsGettingLocation,
    ] = useState(false);

    const [
        isLoadingPlaces,
        setIsLoadingPlaces,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    useEffect(() => {
        async function loadPlaces() {
            try {
                setIsLoadingPlaces(true);

                const data = await getPlaces();

                setPlaces(
                    normalizeApiList(data)
                );
            } catch (error) {
                console.error(
                    "Load nearby places error:",
                    error
                );

                setErrorMessage(
                    "Không thể tải danh sách địa điểm."
                );
            } finally {
                setIsLoadingPlaces(false);
            }
        }

        loadPlaces();
    }, []);

    const nearbyPlaces = useMemo(() => {
        if (!userLocation) {
            return [];
        }

        return places
            .map((place) =>
                normalizePlace(
                    place,
                    userLocation
                )
            )
            .filter(Boolean)
            .sort(
                (firstPlace, secondPlace) =>
                    firstPlace.distance -
                    secondPlace.distance
            )
            .slice(0, MAX_RESULTS);
    }, [
        places,
        userLocation,
    ]);

    function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            setErrorMessage(
                "Trình duyệt không hỗ trợ định vị."
            );

            return;
        }

        setErrorMessage("");
        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat:
                        position.coords.latitude,

                    lng:
                        position.coords.longitude,
                });

                setIsGettingLocation(false);
            },

            (error) => {
                console.error(
                    "Geolocation error:",
                    error
                );

                let message =
                    "Không thể lấy vị trí hiện tại.";

                if (error.code === 1) {
                    message =
                        "Bạn chưa cho phép truy cập vị trí.";
                }

                if (error.code === 2) {
                    message =
                        "Không xác định được vị trí hiện tại.";
                }

                if (error.code === 3) {
                    message =
                        "Yêu cầu lấy vị trí đã hết thời gian.";
                }

                setErrorMessage(message);
                setIsGettingLocation(false);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }

    function handleViewPlace(place) {
        setSelectedPlace({
            id: place.id,

            name: place.name,

            addressLevel1:
                place.address ||
                place.categoryName,

            geo: {
                lat: place.latitude,
                lng: place.longitude,
            },

            place_id:
                place.place_id ||
                place.id,

            place_name:
                place.name,

            category:
                place.category,

            category_id:
                place.category_id,

            category_name:
                place.categoryName,
        });

        navigate("/map");
    }

    return (
        <aside className="nearby-places-panel">
            <div className="nearby-places-panel__header">
                <div>
                    <h2>
                        Địa điểm gần bạn
                    </h2>

                    <p>
                        Khám phá những địa điểm ở gần vị trí hiện tại.
                    </p>
                </div>

                <MapPin size={22} />
            </div>

            {!userLocation && (
                <div className="nearby-places-panel__permission">
                    <div className="nearby-places-panel__permission-icon">
                        <LocateFixed size={28} />
                    </div>

                    <p>
                        Cho phép truy cập vị trí để tìm các địa điểm gần bạn.
                    </p>

                    <button
                        type="button"
                        className="nearby-places-panel__location-button"
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                    >
                        {isGettingLocation ? (
                            <>
                                <RefreshCw
                                    size={17}
                                    className="nearby-places-panel__loading-icon"
                                />

                                <span>
                                    Đang xác định...
                                </span>
                            </>
                        ) : (
                            <>
                                <LocateFixed size={17} />

                                <span>
                                    Tìm địa điểm gần tôi
                                </span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="nearby-places-panel__error">
                    {errorMessage}
                </div>
            )}

            {userLocation && (
                <div className="nearby-places-panel__results">
                    {isLoadingPlaces ? (
                        <div className="nearby-places-panel__status">
                            Đang tải địa điểm...
                        </div>
                    ) : nearbyPlaces.length > 0 ? (
                        nearbyPlaces.map((place) => (
                            <button
                                type="button"
                                key={
                                    place.id ||
                                    `${place.latitude}-${place.longitude}`
                                }
                                className="nearby-place-card"
                                onClick={() =>
                                    handleViewPlace(place)
                                }
                            >
                                <div className="nearby-place-card__icon">
                                    {getCategoryIcon(place)}
                                </div>

                                <div className="nearby-place-card__content">
                                    <strong>
                                        {place.name}
                                    </strong>

                                    <span className="nearby-place-card__category">
                                        {place.categoryName}
                                    </span>

                                    {place.address && (
                                        <span className="nearby-place-card__address">
                                            {place.address}
                                        </span>
                                    )}
                                </div>

                                <div className="nearby-place-card__distance">
                                    <Navigation size={14} />

                                    <span>
                                        {formatDistance(
                                            place.distance
                                        )}
                                    </span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="nearby-places-panel__status">
                            Chưa tìm thấy địa điểm có tọa độ gần khu vực này.
                        </div>
                    )}

                    <button
                        type="button"
                        className="nearby-places-panel__refresh-button"
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                    >
                        <RefreshCw
                            size={15}
                            className={
                                isGettingLocation
                                    ? "nearby-places-panel__loading-icon"
                                    : ""
                            }
                        />

                        <span>
                            Cập nhật vị trí
                        </span>
                    </button>
                </div>
            )}
        </aside>
    );
}

export default NearbyPlacesPanel;