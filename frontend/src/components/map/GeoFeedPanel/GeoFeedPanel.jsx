import "./GeoFeedPanel.css";

import { X } from "lucide-react";

import {
    useEffect,
    useMemo,
    useRef,
} from "react";

import PostCard from "../../feed/PostCard/PostCard";

import useGeoFeed from "../../../context/useGeoFeed";
import useMapContext from "../../../context/useMap";
import usePosts from "../../../context/usePosts";

function getPostId(post) {
    return post?.post_id || post?.id || null;
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
        Number.isNaN(numberLat) ||
        Number.isNaN(numberLng)
    ) {
        return null;
    }

    return {
        lat: numberLat,
        lng: numberLng,
    };
}

function isInteractiveElement(target) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(
        target.closest(
            [
                "button",
                "a",
                "input",
                "textarea",
                "select",
                "label",
                "[role='button']",
                ".post-card__actions",
                ".post-card__more-wrapper",
                ".post-card__menu",
                ".post-card__location",
            ].join(",")
        )
    );
}

function GeoFeedPanel() {
    const { posts } = usePosts();

    const {
        isGeoFeedOpen,
        setIsGeoFeedOpen,
        selectedLocation,
        setSelectedPost,
        selectedPost,
        postsInView,
        searchAreaPosts,
        feedSource,
        setFeedSource,
    } = useGeoFeed();

    const {
        map,
    } = useMapContext();

    const panelTitle =
        feedSource === "place"
            ? `Bài viết quanh: ${selectedLocation}`
            : feedSource === "search"
                ? `Kết quả tìm kiếm: ${selectedLocation}`
                : feedSource === "marker"
                    ? `Khu vực: ${selectedLocation}`
                    : feedSource === "nearby"
                        ? "Bài viết gần bạn"
                        : "Bài viết trong vùng bản đồ";

    /*
    |--------------------------------------------------------------------------
    | Danh sách nguồn
    |--------------------------------------------------------------------------
    |
    | searchAreaPosts/postsInView chỉ dùng để biết bài nào thuộc khu vực.
    | Dữ liệu hiển thị thật sẽ luôn lấy từ posts mới nhất trong PostProvider.
    |
    */
    const sourcePosts =
        feedSource === "search" ||
        feedSource === "marker" ||
        feedSource === "place"
            ? searchAreaPosts
            : postsInView;

    /*
    |--------------------------------------------------------------------------
    | Đồng bộ bài viết mới nhất
    |--------------------------------------------------------------------------
    |
    | Khi like hoặc comment thay đổi trong PostProvider, phần panel bản đồ
    | cũng nhận object mới nhất và render lại ngay lập tức.
    |
    */
    const displayPosts = useMemo(() => {
        if (!Array.isArray(sourcePosts)) {
            return [];
        }

        return sourcePosts
            .map((sourcePost) => {
                const sourcePostId = getPostId(sourcePost);

                const latestPost = posts.find((post) => {
                    return String(getPostId(post)) === String(sourcePostId);
                });

                return latestPost || sourcePost;
            })
            .filter(Boolean);
    }, [
        sourcePosts,
        posts,
    ]);

    const postCount = displayPosts.length;

    const postRefs = useRef({});

    /*
    |--------------------------------------------------------------------------
    | Đồng bộ selectedPost với bài mới nhất
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!selectedPost) {
            return;
        }

        const selectedPostId = getPostId(selectedPost);

        const latestSelectedPost = posts.find((post) => {
            return String(getPostId(post)) === String(selectedPostId);
        });

        if (!latestSelectedPost) {
            return;
        }

        const selectedLikes = Number(
            selectedPost.likes_count ??
            selectedPost.likes ??
            0
        );

        const latestLikes = Number(
            latestSelectedPost.likes_count ??
            latestSelectedPost.likes ??
            0
        );

        const selectedComments = Number(
            selectedPost.comments_count ??
            selectedPost.comments ??
            0
        );

        const latestComments = Number(
            latestSelectedPost.comments_count ??
            latestSelectedPost.comments ??
            0
        );

        const selectedLiked = Boolean(
            selectedPost.isLiked ??
            selectedPost.is_liked ??
            selectedPost.liked ??
            false
        );

        const latestLiked = Boolean(
            latestSelectedPost.isLiked ??
            latestSelectedPost.is_liked ??
            latestSelectedPost.liked ??
            false
        );

        if (
            selectedLikes !== latestLikes ||
            selectedComments !== latestComments ||
            selectedLiked !== latestLiked
        ) {
            setSelectedPost(latestSelectedPost);
        }
    }, [
        posts,
        selectedPost,
        setSelectedPost,
    ]);

    useEffect(() => {
        if (!selectedPost) {
            return;
        }

        const selectedPostId = getPostId(selectedPost);

        const element =
            postRefs.current[selectedPostId];

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [selectedPost]);

    function handleSelectPost(post) {
        setSelectedPost(post);

        const coord = getPostLatLng(post);

        if (
            map &&
            coord
        ) {
            map.flyTo(
                [
                    coord.lat,
                    coord.lng,
                ],
                16,
                {
                    animate: true,
                    duration: 1,
                }
            );
        }
    }

    function handlePostClick(event, post) {
        if (isInteractiveElement(event.target)) {
            return;
        }

        handleSelectPost(post);
    }

    function handleClosePanel() {
        setIsGeoFeedOpen(false);
        setSelectedPost(null);
        setFeedSource("viewport");
    }

    return (
        <aside
            className={
                isGeoFeedOpen
                    ? "geo-feed-panel geo-feed-panel--open"
                    : "geo-feed-panel"
            }
        >
            <div className="geo-feed-panel__header">
                <div>
                    <h2>
                        {panelTitle}
                    </h2>

                    <p className="geo-feed-panel__count">
                        {postCount} bài viết
                    </p>
                </div>

                <button
                    type="button"
                    className="geo-feed-panel__close-button"
                    onClick={handleClosePanel}
                    aria-label="Đóng danh sách bài viết"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="geo-feed-panel__content">
                {displayPosts.length > 0 ? (
                    displayPosts.map((post) => {
                        const postId = getPostId(post);

                        const selectedPostId = selectedPost
                            ? getPostId(selectedPost)
                            : null;

                        const isSelected =
                            String(selectedPostId) === String(postId);

                        return (
                            <div
                                key={`geo-feed-post-${postId}`}
                                ref={(element) => {
                                    if (element) {
                                        postRefs.current[postId] = element;
                                    } else {
                                        delete postRefs.current[postId];
                                    }
                                }}
                                className={
                                    isSelected
                                        ? "geo-feed-panel__post geo-feed-panel__post--selected"
                                        : "geo-feed-panel__post"
                                }
                                onClick={(event) => {
                                    handlePostClick(event, post);
                                }}
                            >
                                <PostCard post={post} />
                            </div>
                        );
                    })
                ) : (
                    <div className="geo-feed-panel__empty">
                        <h3>
                            Chưa có bài viết
                        </h3>

                        <p>
                            Khu vực này chưa có bài viết. Bạn có thể đăng bài mới
                            và gắn vị trí tại đây.
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default GeoFeedPanel;