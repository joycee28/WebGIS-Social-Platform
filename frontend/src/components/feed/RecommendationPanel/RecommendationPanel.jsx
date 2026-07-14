import "./RecommendationPanel.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Compass,
    LoaderCircle,
    MapPin,
    Sparkles,
    Tag,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import usePosts from "../../../context/usePosts";
import { useAuth } from "../../../context/AuthContext";

const RECOMMENDATION_LIMIT = 4;
const MAX_POSTS_PER_AUTHOR = 2;
const MAX_PREFERENCE_CATEGORIES = 3;

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function clamp(value, min, max) {
    return Math.min(
        max,
        Math.max(min, value)
    );
}

function getPostId(post) {
    return (
        post?.post_id ??
        post?.id ??
        null
    );
}

function getPostAuthor(post) {
    return (
        post?.username ||
        post?.user?.username ||
        post?.author ||
        ""
    );
}

function getAuthorBucket(post) {
    const author =
        normalizeText(
            getPostAuthor(post)
        );

    if (author) {
        return author;
    }

    return `unknown-${getPostId(post)}`;
}

function getCategoryKey(post) {
    const category =
        post?.category_id ??
        post?.place?.category_id ??
        post?.category_code ??
        post?.place?.category_code ??
        post?.category_name ??
        post?.place?.category_name ??
        null;

    if (
        category === null ||
        category === undefined ||
        category === ""
    ) {
        return null;
    }

    return normalizeText(category);
}

function getCategoryLabel(post) {
    return (
        post?.category_name ||
        post?.place?.category_name ||
        post?.category_code ||
        post?.place?.category_code ||
        post?.category_id ||
        post?.place?.category_id ||
        "Danh mục khác"
    );
}

function getPostCoordinates(post) {
    const latitude = Number(
        post?.geo?.lat ??
        post?.latitude
    );

    const longitude = Number(
        post?.geo?.lng ??
        post?.longitude
    );

    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
    ) {
        return null;
    }

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return null;
    }

    return {
        latitude,
        longitude,
    };
}

function toRadians(degree) {
    return (
        degree *
        Math.PI /
        180
    );
}

function calculateDistanceKm(
    firstLatitude,
    firstLongitude,
    secondLatitude,
    secondLongitude
) {
    const earthRadiusKm = 6371;

    const latitudeDifference = toRadians(
        secondLatitude - firstLatitude
    );

    const longitudeDifference = toRadians(
        secondLongitude - firstLongitude
    );

    const firstLatitudeRadians =
        toRadians(firstLatitude);

    const secondLatitudeRadians =
        toRadians(secondLatitude);

    const haversineValue =
        Math.sin(
            latitudeDifference / 2
        ) ** 2 +
        Math.cos(
            firstLatitudeRadians
        ) *
            Math.cos(
                secondLatitudeRadians
            ) *
            Math.sin(
                longitudeDifference / 2
            ) ** 2;

    const safeValue = clamp(
        haversineValue,
        0,
        1
    );

    const centralAngle =
        2 *
        Math.atan2(
            Math.sqrt(safeValue),
            Math.sqrt(1 - safeValue)
        );

    return earthRadiusKm * centralAngle;
}


function getPostDistance(
    post,
    userLocation
) {
    if (!userLocation) {
        return null;
    }

    const coordinates =
        getPostCoordinates(post);

    if (!coordinates) {
        return null;
    }

    return calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        coordinates.latitude,
        coordinates.longitude
    );
}

function formatDistance(distanceKm) {
    if (
        distanceKm === null ||
        distanceKm === undefined
    ) {
        return null;
    }

    if (distanceKm < 1) {
        return `${Math.max(
            1,
            Math.round(
                distanceKm * 1000
            )
        )} m`;
    }

    return `${distanceKm.toFixed(1)} km`;
}

function getPostPreview(post) {
    const value =
        post?.content ||
        post?.title ||
        "Bài viết WebGIS";

    const cleanValue =
        String(value).trim();

    if (cleanValue.length <= 70) {
        return cleanValue;
    }

    return `${cleanValue.slice(
        0,
        70
    )}...`;
}

function getPostAgeInDays(post) {
    const createdAt =
        post?.created_at ||
        post?.timestamp;

    if (!createdAt) {
        return 3650;
    }

    const createdTime =
        new Date(createdAt).getTime();

    if (Number.isNaN(createdTime)) {
        return 3650;
    }

    const ageInMilliseconds =
        Math.max(
            0,
            Date.now() -
            createdTime
        );

    return (
        ageInMilliseconds /
        (1000 * 60 * 60 * 24)
    );
}

function calculateDistanceScore(
    distanceKm
) {
    if (
        distanceKm === null ||
        distanceKm === undefined
    ) {
        return 0;
    }

    return clamp(
        100 /
        (
            1 +
            distanceKm / 5
        ),
        0,
        100
    );
}

function calculateFreshnessScore(
    ageInDays
) {
    return clamp(
        100 /
        (
            1 +
            ageInDays / 3
        ),
        0,
        100
    );
}

function calculateEngagementScore(post) {
    const likesCount =
        Math.max(
            0,
            Number(
                post?.likes_count ??
                post?.likes ??
                0
            ) || 0
        );

    const commentsCount =
        Math.max(
            0,
            Number(
                post?.comments_count ??
                post?.comments ??
                0
            ) || 0
        );

    const logarithmicScore =
        Math.log1p(
            likesCount
        ) * 4 +
        Math.log1p(
            commentsCount
        ) * 6;

    return clamp(
        logarithmicScore * 4,
        0,
        100
    );
}

function RecommendationPanel() {
    const navigate =
        useNavigate();

    const {
        posts = [],
    } = usePosts();

    const {
        user,
    } = useAuth();

    const [
        userLocation,
        setUserLocation,
    ] = useState(null);

    const [
        isGettingLocation,
        setIsGettingLocation,
    ] = useState(false);

    const [
        locationDenied,
        setLocationDenied,
    ] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationDenied(true);
            return;
        }

        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,
                });

                setLocationDenied(false);
                setIsGettingLocation(false);
            },

            () => {
                setUserLocation(null);
                setLocationDenied(true);
                setIsGettingLocation(false);
            },

            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 300000,
            }
        );
    }, []);

    const categoryPreferences =
        useMemo(() => {
            const currentUsername =
                normalizeText(
                    user?.username
                );

            if (!currentUsername) {
                return [];
            }

            const categoryCounts =
                new Map();

            posts.forEach((post) => {
                const postAuthor =
                    normalizeText(
                        getPostAuthor(post)
                    );

                if (
                    postAuthor !==
                    currentUsername
                ) {
                    return;
                }

                const categoryKey =
                    getCategoryKey(post);

                if (!categoryKey) {
                    return;
                }

                categoryCounts.set(
                    categoryKey,
                    (
                        categoryCounts.get(
                            categoryKey
                        ) || 0
                    ) + 1
                );
            });

            const totalPosts =
                Array.from(
                    categoryCounts.values()
                ).reduce(
                    (
                        total,
                        count
                    ) =>
                        total + count,
                    0
                );

            if (totalPosts === 0) {
                return [];
            }

            return Array.from(
                categoryCounts.entries()
            )
                .map(
                    ([
                        key,
                        count,
                    ]) => ({
                        key,
                        count,
                        weight:
                            count /
                            totalPosts,
                    })
                )
                .sort(
                    (
                        firstCategory,
                        secondCategory
                    ) =>
                        secondCategory.weight -
                        firstCategory.weight
                )
                .slice(
                    0,
                    MAX_PREFERENCE_CATEGORIES
                );
        }, [
            posts,
            user?.username,
        ]);

    const preferenceMap =
        useMemo(() => {
            return new Map(
                categoryPreferences.map(
                    (preference) => [
                        preference.key,
                        preference,
                    ]
                )
            );
        }, [
            categoryPreferences,
        ]);

    const scoredPosts =
        useMemo(() => {
            const currentUsername =
                normalizeText(
                    user?.username
                );

            return posts
                .filter((post) => {
                    const postId =
                        getPostId(post);

                    if (
                        postId === null ||
                        postId === undefined
                    ) {
                        return false;
                    }

                    const postAuthor =
                        normalizeText(
                            getPostAuthor(post)
                        );

                    return !(
                        currentUsername &&
                        postAuthor ===
                            currentUsername
                    );
                })
                .map((post) => {
                    const categoryKey =
                        getCategoryKey(post);

                    const preference =
                        categoryKey
                            ? preferenceMap.get(
                                  categoryKey
                              )
                            : null;

                    const categoryWeight =
                        preference?.weight ||
                        0;

                    const categoryScore =
                        categoryPreferences.length >
                        0
                            ? categoryWeight *
                              100
                            : 40;

                    const distanceKm =
                        getPostDistance(
                            post,
                            userLocation
                        );

                    const distanceScore =
                        calculateDistanceScore(
                            distanceKm
                        );

                    const freshnessScore =
                        calculateFreshnessScore(
                            getPostAgeInDays(
                                post
                            )
                        );

                    const engagementScore =
                        calculateEngagementScore(
                            post
                        );

                    const totalScore =
                        categoryScore *
                            0.4 +
                        distanceScore *
                            0.25 +
                        freshnessScore *
                            0.2 +
                        engagementScore *
                            0.15;

                    const explorationScore =
                        distanceScore *
                            0.35 +
                        freshnessScore *
                            0.4 +
                        engagementScore *
                            0.25;

                    return {
                        post,
                        categoryKey,
                        categoryWeight,
                        distanceKm,
                        totalScore,
                        explorationScore,

                        isPreferred:
                            categoryWeight >
                            0,
                    };
                });
        }, [
            posts,
            user?.username,
            userLocation,
            preferenceMap,
            categoryPreferences.length,
        ]);

    const recommendedPosts =
        useMemo(() => {
            const selectedItems = [];
            const selectedPostIds =
                new Set();

            const authorCounts =
                new Map();

            function canAddItem(item) {
                const postId =
                    String(
                        getPostId(
                            item.post
                        )
                    );

                if (
                    selectedPostIds.has(
                        postId
                    )
                ) {
                    return false;
                }

                const authorBucket =
                    getAuthorBucket(
                        item.post
                    );

                const authorCount =
                    authorCounts.get(
                        authorBucket
                    ) || 0;

                return (
                    authorCount <
                    MAX_POSTS_PER_AUTHOR
                );
            }

            function addItem(
                item,
                isExploration = false
            ) {
                if (!canAddItem(item)) {
                    return false;
                }

                const postId =
                    String(
                        getPostId(
                            item.post
                        )
                    );

                const authorBucket =
                    getAuthorBucket(
                        item.post
                    );

                selectedPostIds.add(
                    postId
                );

                authorCounts.set(
                    authorBucket,
                    (
                        authorCounts.get(
                            authorBucket
                        ) || 0
                    ) + 1
                );

                selectedItems.push({
                    ...item,
                    isExploration,
                });

                return true;
            }

            const preferredItems =
                scoredPosts
                    .filter(
                        (item) =>
                            item.isPreferred
                    )
                    .sort(
                        (
                            firstItem,
                            secondItem
                        ) =>
                            secondItem.totalScore -
                            firstItem.totalScore
                    );

            const explorationItems =
                scoredPosts
                    .filter(
                        (item) =>
                            !item.isPreferred
                    )
                    .sort(
                        (
                            firstItem,
                            secondItem
                        ) =>
                            secondItem.explorationScore -
                            firstItem.explorationScore
                    );

            const preferredLimit =
                explorationItems.length > 0
                    ? RECOMMENDATION_LIMIT -
                      1
                    : RECOMMENDATION_LIMIT;

            for (
                const item
                of preferredItems
            ) {
                if (
                    selectedItems.length >=
                    preferredLimit
                ) {
                    break;
                }

                addItem(item);
            }

            for (
                const item
                of explorationItems
            ) {
                if (
                    addItem(
                        item,
                        true
                    )
                ) {
                    break;
                }
            }

            const remainingItems =
                [...scoredPosts].sort(
                    (
                        firstItem,
                        secondItem
                    ) =>
                        secondItem.totalScore -
                        firstItem.totalScore
                );

            for (
                const item
                of remainingItems
            ) {
                if (
                    selectedItems.length >=
                    RECOMMENDATION_LIMIT
                ) {
                    break;
                }

                addItem(item);
            }

            return selectedItems;
        }, [
            scoredPosts,
        ]);

    function handleOpenPost(post) {
        const postId =
            getPostId(post);

        if (
            postId === null ||
            postId === undefined
        ) {
            return;
        }

        navigate(
            `/posts/${postId}`
        );
    }

    return (
        <aside className="recommendation-panel">
            <div className="recommendation-panel__header">
                <div className="recommendation-panel__header-icon">
                    <Sparkles size={18} />
                </div>

                <h2>
                    Gợi ý cho bạn
                </h2>
            </div>

            {isGettingLocation && (
                <div className="recommendation-panel__location-state">
                    <LoaderCircle
                        size={15}
                        className="recommendation-panel__spinner"
                    />

                    <span>
                        Đang xác định vị trí
                    </span>
                </div>
            )}

            {!isGettingLocation &&
                userLocation && (
                    <div className="recommendation-panel__location-state">
                        <Compass size={15} />

                        <span>
                            Ưu tiên bài viết gần bạn
                        </span>
                    </div>
                )}

            {!isGettingLocation &&
                locationDenied && (
                    <div className="recommendation-panel__location-state">
                        <MapPin size={15} />

                        <span>
                            Gợi ý dành riêng cho bạn
                        </span>
                    </div>
                )}

            <div className="recommendation-panel__list">
                {recommendedPosts.length > 0 ? (
                    recommendedPosts.map(
                        ({
                            post,
                            distanceKm,
                            isExploration,
                        }) => {
                            const postId =
                                getPostId(post);

                            const categoryLabel =
                                getCategoryLabel(
                                    post
                                );

                            const locationName =
                                post?.location_name ||
                                post?.locationName ||
                                post?.place?.name ||
                                post?.geo?.locationName ||
                                "";

                            return (
                                <button
                                    type="button"
                                    key={postId}
                                    className={
                                        isExploration
                                            ? "recommendation-panel__post recommendation-panel__post--exploration"
                                            : "recommendation-panel__post"
                                    }
                                    onClick={() =>
                                        handleOpenPost(
                                            post
                                        )
                                    }
                                >
                                    <div className="recommendation-panel__post-top">
                                        <strong>
                                            {getPostAuthor(
                                                post
                                            ) ||
                                                "Ẩn danh"}
                                        </strong>

                                        {formatDistance(
                                            distanceKm
                                        ) && (
                                            <span className="recommendation-panel__distance">
                                                <MapPin
                                                    size={12}
                                                />

                                                {formatDistance(
                                                    distanceKm
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {isExploration && (
                                        <span className="recommendation-panel__explore-badge">
                                            <Compass
                                                size={12}
                                            />

                                            Khám phá mới
                                        </span>
                                    )}

                                    <p className="recommendation-panel__preview">
                                        {getPostPreview(
                                            post
                                        )}
                                    </p>

                                    <div className="recommendation-panel__meta">
                                        <span>
                                            <Tag size={13} />

                                            {categoryLabel}
                                        </span>

                                        {locationName && (
                                            <span>
                                                <MapPin
                                                    size={13}
                                                />

                                                {locationName}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        }
                    )
                ) : (
                    <div className="recommendation-panel__empty">
                        <Sparkles size={23} />

                        <p>
                            Chưa có bài viết phù hợp.
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default RecommendationPanel;
