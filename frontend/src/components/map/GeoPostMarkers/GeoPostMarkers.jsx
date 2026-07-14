import {
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from "react-leaflet";

import {
    useMemo,
    useState,
} from "react";

import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

import useGeoFeed from "../../../context/useGeoFeed";
import usePosts from "../../../context/usePosts";
import findNearbyPosts from "../../../lib/findNearbyPosts";

import "./GeoPostMarkers.css";

/*
|--------------------------------------------------------------------------
| Cấu hình mức zoom
|--------------------------------------------------------------------------
*/

const PLACE_MIN_ZOOM = 12;
const INDIVIDUAL_MARKER_ZOOM = 14;
const FULL_ICON_ZOOM = 16;

const CATEGORY_STYLES = {
    1: { emoji: "🏛️" },
    2: { emoji: "🖼️" },
    3: { emoji: "🎡" },
    4: { emoji: "🌳" },
    5: { emoji: "🍲" },
    6: { emoji: "🏢" },
    7: { emoji: "🕌" },
    8: { emoji: "🛍️" },
    9: { emoji: "☕" },
    10: { emoji: "📌" },
};

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function getPostId(post) {
    return (
        post?.post_id ??
        post?.id ??
        null
    );
}

function getLinkedPlaceId(post) {
    const place = post?.place;

    if (
        place === null ||
        place === undefined ||
        place === ""
    ) {
        return null;
    }

    if (typeof place === "object") {
        return (
            place?.place_id ??
            place?.id ??
            null
        );
    }

    return place;
}

function getPostCategoryId(post) {
    return (
        post?.category_id ??
        post?.category ??
        post?.place?.category_id ??
        post?.place?.category ??
        null
    );
}

function getPlaceCategoryId(place) {
    return (
        place?.category_id ??
        place?.category?.category_id ??
        place?.category ??
        null
    );
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

function getPostLocationName(post) {
    return (
        post?.place?.name ||
        post?.geo?.locationName ||
        post?.locationName ||
        post?.location_name ||
        "Vị trí bài viết"
    );
}

function getZoomMode(zoom) {
    if (zoom < PLACE_MIN_ZOOM) {
        return "far";
    }

    if (zoom < INDIVIDUAL_MARKER_ZOOM) {
        return "medium";
    }

    if (zoom < FULL_ICON_ZOOM) {
        return "near";
    }

    return "detail";
}

/*
|--------------------------------------------------------------------------
| Cache icon
|--------------------------------------------------------------------------
|
| Tránh tạo lại icon Leaflet cho từng marker sau mỗi lần render.
|
*/

const iconCache = new Map();

function getCachedIcon(key, creator) {
    if (iconCache.has(key)) {
        return iconCache.get(key);
    }

    const icon = creator();

    iconCache.set(key, icon);

    return icon;
}

/*
|--------------------------------------------------------------------------
| Icon địa điểm
|--------------------------------------------------------------------------
*/

function createPlaceIcon(
    categoryId,
    zoomMode
) {
    const normalizedCategoryId =
        Number(categoryId) || 10;

    const style =
        CATEGORY_STYLES[normalizedCategoryId] ||
        CATEGORY_STYLES[10];

    const cacheKey =
        `place-${normalizedCategoryId}-${zoomMode}`;

    return getCachedIcon(
        cacheKey,
        () => {
            const size =
                zoomMode === "detail"
                    ? 38
                    : zoomMode === "near"
                        ? 32
                        : 28;

            return L.divIcon({
                className:
                    "geo-place-marker-clean-icon",

                html: `
                    <div
                        class="
                            geo-place-marker
                            geo-place-marker--${zoomMode}
                        "
                    >
                        ${style.emoji}
                    </div>
                `,

                iconSize: [
                    size,
                    size,
                ],

                iconAnchor: [
                    size / 2,
                    size / 2,
                ],

                popupAnchor: [
                    0,
                    -(size / 2),
                ],
            });
        }
    );
}

/*
|--------------------------------------------------------------------------
| Icon bài viết
|--------------------------------------------------------------------------
*/

function createPostIcon(
    categoryId,
    isActive,
    zoomMode
) {
    if (isActive) {
        return getCachedIcon(
            "active-post-icon",
            () =>
                L.divIcon({
                    className:
                        "geo-post-marker-icon",

                    html: `
                        <div class="
                            geo-post-marker
                            geo-post-marker--active
                        ">
                            <div class="geo-post-marker__pulse"></div>
                            <div class="geo-post-marker__dot"></div>
                        </div>
                    `,

                    iconSize: [34, 34],
                    iconAnchor: [17, 34],
                    popupAnchor: [0, -30],
                })
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Zoom xa: chỉ dùng một chấm nhỏ
    |--------------------------------------------------------------------------
    */

    if (zoomMode === "far") {
        return getCachedIcon(
            "post-far-dot",
            () =>
                L.divIcon({
                    className:
                        "geo-post-far-icon",

                    html: `
                        <div class="geo-post-far-dot"></div>
                    `,

                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                })
        );
    }

    const normalizedCategoryId =
        Number(categoryId) || 10;

    const style =
        CATEGORY_STYLES[normalizedCategoryId] ||
        CATEGORY_STYLES[10];

    const cacheKey =
        `post-${normalizedCategoryId}-${zoomMode}`;

    return getCachedIcon(
        cacheKey,
        () => {
            const size =
                zoomMode === "detail"
                    ? 40
                    : zoomMode === "near"
                        ? 34
                        : 28;

            return L.divIcon({
                className:
                    "geo-post-category-icon",

                html: `
                    <div
                        class="
                            geo-post-category-icon__inner
                            geo-post-category-icon__inner--${zoomMode}
                        "
                    >
                        ${style.emoji}
                    </div>
                `,

                iconSize: [
                    size,
                    size,
                ],

                iconAnchor: [
                    size / 2,
                    size,
                ],

                popupAnchor: [
                    0,
                    -(size - 4),
                ],
            });
        }
    );
}

/*
|--------------------------------------------------------------------------
| Icon cụm bài viết
|--------------------------------------------------------------------------
*/

function createPostClusterIcon(cluster) {
    const count =
        cluster.getChildCount();

    return L.divIcon({
        className:
            "geo-cluster-wrapper",

        html: `
            <div class="
                geo-cluster
                geo-cluster--posts
            ">
                <strong>${count}</strong>
                <span>bài viết</span>
            </div>
        `,

        iconSize: [56, 56],
        iconAnchor: [28, 28],
    });
}

/*
|--------------------------------------------------------------------------
| Icon cụm địa điểm
|--------------------------------------------------------------------------
*/

function createPlaceClusterIcon(cluster) {
    const count =
        cluster.getChildCount();

    return L.divIcon({
        className:
            "geo-cluster-wrapper",

        html: `
            <div class="
                geo-cluster
                geo-cluster--places
            ">
                <strong>${count}</strong>
                <span>địa điểm</span>
            </div>
        `,

        iconSize: [54, 54],
        iconAnchor: [27, 27],
    });
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function GeoPostMarkers({
    selectedCategory,
    places = [],
}) {
    const map = useMap();

    const [
        currentZoom,
        setCurrentZoom,
    ] = useState(() =>
        map.getZoom()
    );

    /*
    |--------------------------------------------------------------------------
    | Chỉ cập nhật state khi người dùng zoom xong
    |--------------------------------------------------------------------------
    |
    | Không cập nhật liên tục trong lúc animation để tránh giật marker.
    |
    */

    useMapEvents({
        zoomend(event) {
            setCurrentZoom(
                event.target.getZoom()
            );
        },
    });

    const { posts } = usePosts();

    const {
        selectedPost,
        setSelectedPost,
        setSelectedLocation,
        setIsGeoFeedOpen,
        setHoveredPost,
        mapBounds,
        setSearchAreaPosts,
        setFeedSource,
    } = useGeoFeed();

    const zoomMode =
        getZoomMode(currentZoom);

    const shouldShowPlaces =
        currentZoom >= PLACE_MIN_ZOOM;

    /*
    |--------------------------------------------------------------------------
    | Lọc bài viết theo danh mục
    |--------------------------------------------------------------------------
    */

    const categoryFilteredPosts =
        useMemo(() => {
            if (!selectedCategory) {
                return posts;
            }

            return posts.filter(
                (post) => {
                    const postCategoryId =
                        getPostCategoryId(post);

                    return (
                        String(postCategoryId) ===
                        String(selectedCategory)
                    );
                }
            );
        }, [
            posts,
            selectedCategory,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Chỉ lấy bài viết nằm trong vùng bản đồ
    |--------------------------------------------------------------------------
    */

    const visiblePosts =
        useMemo(() => {
            if (!mapBounds) {
                return categoryFilteredPosts;
            }

            return categoryFilteredPosts.filter(
                (post) => {
                    const coord =
                        getPostLatLng(post);

                    if (!coord) {
                        return false;
                    }

                    return mapBounds.contains([
                        coord.lat,
                        coord.lng,
                    ]);
                }
            );
        }, [
            categoryFilteredPosts,
            mapBounds,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Lọc địa điểm theo danh mục
    |--------------------------------------------------------------------------
    */

    const filteredPlaces =
        useMemo(() => {
            if (!selectedCategory) {
                return places;
            }

            return places.filter(
                (place) => {
                    const placeCategoryId =
                        getPlaceCategoryId(place);

                    return (
                        String(placeCategoryId) ===
                        String(selectedCategory)
                    );
                }
            );
        }, [
            places,
            selectedCategory,
        ]);

    const selectedPostId =
        selectedPost
            ? getPostId(selectedPost)
            : null;

    const postClusterRadius =
        zoomMode === "far"
            ? 80
            : 55;

    /*
    |--------------------------------------------------------------------------
    | Loại bỏ marker bài viết bị trùng với marker địa điểm chính thức
    |--------------------------------------------------------------------------
    |
    | Bài viết có place_id trỏ tới một Place đang hiển thị sẽ không tạo
    | thêm marker riêng. Bài chưa liên kết Place vẫn giữ marker bài viết.
    |
    */

    const displayedPlaceIds =
        useMemo(() => {
            return new Set(
                filteredPlaces
                    .map((place) => {
                        return (
                            place?.place_id ??
                            place?.id ??
                            null
                        );
                    })
                    .filter((placeId) => {
                        return (
                            placeId !== null &&
                            placeId !== undefined
                        );
                    })
                    .map(String)
            );
        }, [
            filteredPlaces,
        ]);

    const postMarkers =
        useMemo(() => {
            return visiblePosts.filter(
                (post) => {
                    const linkedPlaceId =
                        getLinkedPlaceId(post);

                    if (
                        linkedPlaceId === null ||
                        linkedPlaceId === undefined
                    ) {
                        return true;
                    }

                    return !displayedPlaceIds.has(
                        String(linkedPlaceId)
                    );
                }
            );
        }, [
            visiblePosts,
            displayedPlaceIds,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            {/*
            |--------------------------------------------------------------------------
            | Địa điểm
            |--------------------------------------------------------------------------
            |
            | Không hiển thị khi zoom quá xa.
            | Render trước để marker bài viết có ưu tiên hiển thị phía trên.
            |
            */}

            {shouldShowPlaces && (
                <MarkerClusterGroup
                    key={
                        `places-${zoomMode}-${selectedCategory || "all"}`
                    }

                    iconCreateFunction={
                        createPlaceClusterIcon
                    }

                    disableClusteringAtZoom={
                        INDIVIDUAL_MARKER_ZOOM
                    }

                    maxClusterRadius={50}

                    spiderfyOnMaxZoom={true}

                    spiderfyDistanceMultiplier={1.4}

                    showCoverageOnHover={false}

                    zoomToBoundsOnClick={true}

                    removeOutsideVisibleBounds={true}

                    chunkedLoading={true}
                >
                    {filteredPlaces.map(
                        (place) => {
                            const lat =
                                Number(
                                    place.latitude
                                );

                            const lng =
                                Number(
                                    place.longitude
                                );

                            if (
                                !Number.isFinite(lat) ||
                                !Number.isFinite(lng)
                            ) {
                                return null;
                            }

                            const placeId =
                                place.place_id ??
                                place.id;

                            const categoryId =
                                getPlaceCategoryId(
                                    place
                                );

                            return (
                                <Marker
                                    key={
                                        `place-${placeId}`
                                    }

                                    position={[
                                        lat,
                                        lng,
                                    ]}

                                    icon={
                                        createPlaceIcon(
                                            categoryId,
                                            zoomMode
                                        )
                                    }

                                    zIndexOffset={100}

                                    eventHandlers={{
                                        mouseover:
                                            (event) => {
                                                event.target
                                                    .openPopup();
                                            },

                                        mouseout:
                                            (event) => {
                                                event.target
                                                    .closePopup();
                                            },

                                        click:
                                            (event) => {
                                                event.target
                                                    .closePopup();

                                                const linkedPosts =
                                                    posts.filter(
                                                        (post) => {
                                                            const linkedPlaceId =
                                                                getLinkedPlaceId(
                                                                    post
                                                                );

                                                            return (
                                                                linkedPlaceId !== null &&
                                                                linkedPlaceId !== undefined &&
                                                                String(
                                                                    linkedPlaceId
                                                                ) ===
                                                                    String(
                                                                        placeId
                                                                    )
                                                            );
                                                        }
                                                    );

                                                const nearbyPosts =
                                                    findNearbyPosts(
                                                        posts,
                                                        lat,
                                                        lng,
                                                        0.02
                                                    );

                                                const combinedPosts = [
                                                    ...linkedPosts,

                                                    ...nearbyPosts.filter(
                                                        (nearbyPost) => {
                                                            const nearbyPostId =
                                                                getPostId(
                                                                    nearbyPost
                                                                );

                                                            return !linkedPosts.some(
                                                                (linkedPost) => {
                                                                    return (
                                                                        String(
                                                                            getPostId(
                                                                                linkedPost
                                                                            )
                                                                        ) ===
                                                                        String(
                                                                            nearbyPostId
                                                                        )
                                                                    );
                                                                }
                                                            );
                                                        }
                                                    ),
                                                ];

                                                const relatedPosts =
                                                    selectedCategory
                                                        ? combinedPosts.filter(
                                                              (post) => {
                                                                  const postCategoryId =
                                                                      getPostCategoryId(
                                                                          post
                                                                      );

                                                                  return (
                                                                      String(
                                                                          postCategoryId
                                                                      ) ===
                                                                      String(
                                                                          selectedCategory
                                                                      )
                                                                  );
                                                              }
                                                          )
                                                        : combinedPosts;

                                                setSearchAreaPosts(
                                                    relatedPosts
                                                );

                                                setSelectedPost(
                                                    relatedPosts[0] ||
                                                        null
                                                );

                                                setFeedSource(
                                                    "place"
                                                );

                                                setSelectedLocation(
                                                    place.place_name ||
                                                        place.name ||
                                                        "Địa điểm"
                                                );

                                                setIsGeoFeedOpen(
                                                    true
                                                );
                                            },
                                    }}
                                >
                                    <Popup
                                        closeButton={false}
                                        autoPan={false}
                                        closeOnClick={false}
                                        className="clean-hover-popup"
                                    >
                                        <div className="geo-place-popup">
                                            <h4>
                                                {place.place_name ||
                                                    place.name ||
                                                    "Địa điểm"}
                                            </h4>

                                            <p>
                                                {place.description ||
                                                    "Địa điểm từ hệ thống. Click để xem bài viết quanh khu vực này."}
                                            </p>

                                            <div className="geo-place-popup__hint">
                                                Click để xem bài viết quanh đây
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        }
                    )}
                </MarkerClusterGroup>
            )}

            {/*
            |--------------------------------------------------------------------------
            | Bài viết
            |--------------------------------------------------------------------------
            */}

            <MarkerClusterGroup
                key={
                    `posts-${zoomMode}-${selectedCategory || "all"}`
                }

                iconCreateFunction={
                    createPostClusterIcon
                }

                disableClusteringAtZoom={
                    INDIVIDUAL_MARKER_ZOOM
                }

                maxClusterRadius={
                    postClusterRadius
                }

                spiderfyOnMaxZoom={true}

                spiderfyDistanceMultiplier={1.5}

                showCoverageOnHover={false}

                zoomToBoundsOnClick={true}

                removeOutsideVisibleBounds={true}

                chunkedLoading={true}
            >
                {postMarkers.map(
                    (post) => {
                        const coord =
                            getPostLatLng(post);

                        if (!coord) {
                            return null;
                        }

                        const postId =
                            getPostId(post);

                        const isActive =
                            selectedPostId !== null &&
                            String(
                                selectedPostId
                            ) ===
                                String(postId);

                        return (
                            <Marker
                                key={
                                    `post-${postId}`
                                }

                                icon={
                                    createPostIcon(
                                        getPostCategoryId(
                                            post
                                        ),
                                        isActive,
                                        zoomMode
                                    )
                                }

                                position={[
                                    coord.lat,
                                    coord.lng,
                                ]}

                                zIndexOffset={
                                    isActive
                                        ? 2000
                                        : 300
                                }

                                eventHandlers={{
                                    mouseover:
                                        () => {
                                            setHoveredPost(
                                                post
                                            );
                                        },

                                    mouseout:
                                        () => {
                                            setHoveredPost(
                                                null
                                            );
                                        },

                                    click:
                                        () => {
                                            setHoveredPost(
                                                null
                                            );

                                            const nearbyPosts =
                                                findNearbyPosts(
                                                    categoryFilteredPosts,
                                                    coord.lat,
                                                    coord.lng,
                                                    0.02
                                                );

                                            setSearchAreaPosts(
                                                nearbyPosts
                                            );

                                            setFeedSource(
                                                "marker"
                                            );

                                            setSelectedPost(
                                                post
                                            );

                                            setSelectedLocation(
                                                getPostLocationName(
                                                    post
                                                )
                                            );

                                            setIsGeoFeedOpen(
                                                true
                                            );
                                        },
                                }}
                            />
                        );
                    }
                )}
            </MarkerClusterGroup>
        </>
    );
}

export default GeoPostMarkers;