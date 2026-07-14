import {
    useEffect,
    useState,
} from "react";

import PostContext from "./PostContext";
import { useAuth } from "./AuthContext";
import resolvePlace from "../lib/placeEngine";

import {
    createPost as createPostApi,
    toggleLikePost,
    repostPost,
    unrepostPost,
    getPosts,
    deletePostById,
    updatePostById,
} from "../services/postService";

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function toNumber(value, fallback = null) {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
        return fallback;
    }

    return numberValue;
}

function getPostId(post) {
    return post?.post_id ?? post?.id ?? null;
}

function samePostId(firstId, secondId) {
    if (firstId === null || firstId === undefined) {
        return false;
    }

    if (secondId === null || secondId === undefined) {
        return false;
    }

    return String(firstId) === String(secondId);
}

function hasOwn(object, property) {
    return Boolean(
        object &&
        Object.prototype.hasOwnProperty.call(object, property)
    );
}

function parsePlace(place) {
    if (!place) {
        return null;
    }

    if (typeof place === "object") {
        return place;
    }

    if (typeof place === "string") {
        try {
            return JSON.parse(place);
        } catch {
            return {
                name: place,
            };
        }
    }

    return null;
}

function getPostGeo(post) {
    const lat =
        post?.geo?.lat ??
        post?.latitude;

    const lng =
        post?.geo?.lng ??
        post?.longitude;

    const numberLat = toNumber(lat);
    const numberLng = toNumber(lng);

    if (
        numberLat === null ||
        numberLng === null
    ) {
        return null;
    }

    return {
        lat: numberLat,
        lng: numberLng,
        locationName:
            post?.geo?.locationName ||
            post?.locationName ||
            post?.location_name ||
            post?.place?.name ||
            "Vị trí đã ghim trên bản đồ",
    };
}

/*
|--------------------------------------------------------------------------
| Chuẩn hóa bài viết
|--------------------------------------------------------------------------
*/

function normalizePost(rawPost) {
    const post = {
        ...rawPost,
    };

    post.place = parsePlace(post.place);

    /*
    |----------------------------------------------------------------------
    | Chuẩn hóa tên địa điểm
    |----------------------------------------------------------------------
    */

    if (!post.locationName && post.location_name) {
        post.locationName = post.location_name;
    }

    if (!post.location_name && post.locationName) {
        post.location_name = post.locationName;
    }

    const geo = getPostGeo(post);

    if (geo) {
        post.geo = geo;
    }

    if (
        !post.place?.name &&
        post.locationName
    ) {
        post.place = {
            ...(post.place || {}),
            name: post.locationName,
        };
    }

    if (
        !post.place?.name &&
        post.geo?.locationName
    ) {
        post.place = {
            ...(post.place || {}),
            name: post.geo.locationName,
        };
    }

    if (!post.locationName) {
        post.locationName =
            post.location_name ||
            post.place?.name ||
            post.geo?.locationName ||
            null;
    }

    /*
    |----------------------------------------------------------------------
    | Chuẩn hóa ảnh
    |----------------------------------------------------------------------
    */

    if (
        !post.image &&
        Array.isArray(post.images) &&
        post.images.length > 0
    ) {
        const firstImage = post.images[0];

        post.image =
            firstImage?.image_url ||
            firstImage?.url ||
            firstImage?.image ||
            "";
    }

    /*
    |----------------------------------------------------------------------
    | Chuẩn hóa trạng thái thích
    |----------------------------------------------------------------------
    */

    const liked = Boolean(
        post.isLiked ??
        post.is_liked ??
        post.liked ??
        false
    );

    const likesCount = Math.max(
        0,
        toNumber(
            post.likes_count ??
            post.likes,
            0
        )
    );

    post.isLiked = liked;
    post.is_liked = liked;
    post.liked = liked;

    post.likes = likesCount;
    post.likes_count = likesCount;

    /*
    |----------------------------------------------------------------------
    | Chuẩn hóa số bình luận
    |----------------------------------------------------------------------
    */

    const commentsCount = Math.max(
        0,
        toNumber(
            post.comments_count ??
            post.comments,
            0
        )
    );

    post.comments = commentsCount;
    post.comments_count = commentsCount;

    /*
    |----------------------------------------------------------------------
    | Chuẩn hóa số chia sẻ
    |----------------------------------------------------------------------
    */

    const sharesCount = Math.max(
        0,
        toNumber(
            post.shares_count ??
            post.shares,
            0
        )
    );

    post.shares = sharesCount;
    post.shares_count = sharesCount;

    /*
    |----------------------------------------------------------------------
    | Trạng thái đăng lại
    |----------------------------------------------------------------------
    */

    let repostedPosts = {};

    try {
        repostedPosts = JSON.parse(
            localStorage.getItem("repostedPosts") || "{}"
        );
    } catch {
        repostedPosts = {};
    }

    const postId = getPostId(post);

    post.isReposted = Boolean(
        post.isReposted ??
        repostedPosts[String(postId)] ??
        false
    );

    return post;
}

/*
|--------------------------------------------------------------------------
| PostProvider
|--------------------------------------------------------------------------
*/

function PostProvider({
    children,
}) {
    const auth = useAuth();
    const user = auth?.user || null;

    const [
        posts,
        setPosts,
    ] = useState([]);

    /*
    |--------------------------------------------------------------------------
    | Bài viết đã ẩn
    |--------------------------------------------------------------------------
    */

    function getHiddenPostStorageKey() {
        return `hiddenPosts:${user?.username || "guest"}`;
    }

    function getHiddenPostIds() {
        try {
            const data = JSON.parse(
                localStorage.getItem(
                    getHiddenPostStorageKey()
                ) || "[]"
            );

            return Array.isArray(data)
                ? data.map(String)
                : [];
        } catch {
            return [];
        }
    }

    function hidePost(postId) {
        const hiddenPostIds = getHiddenPostIds();

        const nextHiddenPostIds = Array.from(
            new Set([
                ...hiddenPostIds,
                String(postId),
            ])
        );

        localStorage.setItem(
            getHiddenPostStorageKey(),
            JSON.stringify(nextHiddenPostIds)
        );

        setPosts((previousPosts) =>
            previousPosts.filter((post) => {
                return !samePostId(
                    getPostId(post),
                    postId
                );
            })
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Tải danh sách bài viết
    |--------------------------------------------------------------------------
    */

    async function loadPosts() {
        try {
            const data = await getPosts();

            const postsData = Array.isArray(data)
                ? data
                : data?.results || [];

            const hiddenPostIds = getHiddenPostIds();

            const normalizedPosts = postsData
                .filter((post) => {
                    const postId = String(
                        getPostId(post)
                    );

                    return !hiddenPostIds.includes(postId);
                })
                .map(normalizePost);

            setPosts(normalizedPosts);
        } catch (error) {
            console.error(
                "Load posts error:",
                error
            );
        }
    }

    useEffect(() => {
        loadPosts();
    }, [user?.username]);

    /*
    |--------------------------------------------------------------------------
    | Đồng bộ avatar mới
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            !user?.username ||
            !user?.avatar_url
        ) {
            return;
        }

        setPosts((previousPosts) =>
            previousPosts.map((post) => {
                const authorName =
                    post.username ||
                    post.user?.username ||
                    post.author;

                if (
                    !authorName ||
                    authorName.toLowerCase() !==
                        user.username.toLowerCase()
                ) {
                    return post;
                }

                return {
                    ...post,
                    avatar_url: user.avatar_url,
                };
            })
        );
    }, [
        user?.username,
        user?.avatar_url,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Tạo bài viết
    |--------------------------------------------------------------------------
    */

    async function createPost(postData) {
        const lat =
            postData.latitude === null ||
            postData.latitude === undefined ||
            postData.latitude === ""
                ? null
                : toNumber(postData.latitude);

        const lng =
            postData.longitude === null ||
            postData.longitude === undefined ||
            postData.longitude === ""
                ? null
                : toNumber(postData.longitude);

        const geo =
            lat !== null &&
            lng !== null
                ? {
                      lat,
                      lng,
                      locationName:
                          postData.location_name ||
                          postData.locationName ||
                          postData.place_details?.place_name ||
                          postData.place_details?.name ||
                          postData.place?.name ||
                          "Vị trí đã ghim trên bản đồ",
                  }
                : null;

        const rawPlaceValue =
            postData.place_id ??
            postData.place ??
            null;

        const placeDetails =
            postData.place_details &&
            typeof postData.place_details === "object"
                ? postData.place_details
                : rawPlaceValue &&
                    typeof rawPlaceValue === "object"
                    ? rawPlaceValue
                    : null;

        const databasePlaceId =
            placeDetails?.place_id ??
            placeDetails?.id ??
            (
                typeof rawPlaceValue === "string" ||
                typeof rawPlaceValue === "number"
                    ? rawPlaceValue
                    : null
            );

        let place = null;

        if (databasePlaceId !== null && databasePlaceId !== "") {
            place = {
                ...(placeDetails || {}),
                id: databasePlaceId,
                place_id: databasePlaceId,
                name:
                    placeDetails?.name ||
                    placeDetails?.place_name ||
                    postData.location_name ||
                    postData.locationName ||
                    geo?.locationName ||
                    "Địa điểm đã lưu",
                address:
                    placeDetails?.address ||
                    "Địa điểm đã có trong database",
                geo:
                    placeDetails?.geo ||
                    geo,
                category_id:
                    placeDetails?.category_id ||
                    placeDetails?.category ||
                    postData.category_id ||
                    null,
                resolution: "database",
            };
        } else if (
            rawPlaceValue &&
            typeof rawPlaceValue === "object" &&
            (rawPlaceValue.name || rawPlaceValue.place_name)
        ) {
            place = rawPlaceValue;
        } else if (geo) {
            place = resolvePlace(
                geo.lat,
                geo.lng
            );
        }

        if (geo && !place) {
            place = {
                id: `geo-${Date.now()}`,
                name:
                    geo.locationName ||
                    "Vị trí đã ghim trên bản đồ",
                address:
                    "Vị trí người dùng đã ghim trên bản đồ",
                geo,
            };
        }

        const enrichedPost = {
            ...postData,

            geo,

            locationName:
                postData.locationName ||
                postData.location_name ||
                geo?.locationName ||
                null,

            location_name:
                postData.location_name ||
                postData.locationName ||
                geo?.locationName ||
                null,

            image:
                postData.image ||
                "",

            avatar_url:
                user?.avatar_url ||
                postData.avatar_url ||
                "",

            username:
                user?.username ||
                postData.username ||
                "Bạn",

            place: place
                ? {
                      id:
                          place.id ||
                          place.place_id ||
                          null,

                      place_id:
                          place.place_id ||
                          place.id ||
                          null,

                      name:
                          place.name ||
                          place.place_name ||
                          geo?.locationName ||
                          "Vị trí đã ghim trên bản đồ",

                      address:
                          place.address ||
                          "Vị trí người dùng đã ghim trên bản đồ",

                      geo:
                          place.geo ||
                          geo,

                      category_id:
                          place.category_id ||
                          place.category ||
                          postData.category_id ||
                          null,

                      category_name:
                          place.category_name ||
                          place.category?.category_name ||
                          null,

                      resolution:
                          place.resolution ||
                          "nearest",
                  }
                : null,
        };

        const apiPostData = {
            ...enrichedPost,
            place:
                databasePlaceId !== null &&
                databasePlaceId !== ""
                    ? databasePlaceId
                    : (
                          rawPlaceValue &&
                          typeof rawPlaceValue === "object"
                              ? rawPlaceValue
                              : null
                      ),
        };

        delete apiPostData.place_details;

        try {
            const createdPost =
                await createPostApi(apiPostData);

            const serverPost =
                createdPost &&
                typeof createdPost === "object"
                    ? {
                          ...createdPost,
                      }
                    : {};

            const mergedPost = {
                ...enrichedPost,
                ...serverPost,
            };

            if (
                !mergedPost.place &&
                enrichedPost.place
            ) {
                mergedPost.place =
                    enrichedPost.place;
            }

            if (
                !mergedPost.geo &&
                enrichedPost.geo
            ) {
                mergedPost.geo =
                    enrichedPost.geo;
            }

            if (
                !mergedPost.image &&
                enrichedPost.image
            ) {
                mergedPost.image =
                    enrichedPost.image;
            }

            if (
                !mergedPost.avatar_url &&
                enrichedPost.avatar_url
            ) {
                mergedPost.avatar_url =
                    enrichedPost.avatar_url;
            }

            const displayPost =
                normalizePost(mergedPost);

            setPosts((previousPosts) => [
                displayPost,
                ...previousPosts,
            ]);

            return displayPost;
        } catch (error) {
            console.error(
                "Create post API error:",
                error
            );

            const message =
                error?.data?.detail ||
                error?.message ||
                "Không thể đăng bài viết.";

            throw new Error(message);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Cập nhật một bài viết
    |--------------------------------------------------------------------------
    */

    function updatePost(postId, updatedFields) {
        setPosts((previousPosts) =>
            previousPosts.map((post) => {
                if (
                    !samePostId(
                        getPostId(post),
                        postId
                    )
                ) {
                    return post;
                }

                return normalizePost({
                    ...post,
                    ...updatedFields,
                });
            })
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Chỉnh sửa bài viết
    |--------------------------------------------------------------------------
    */

    async function editPost(
        postId,
        updatedFields
    ) {
        if (
            postId === null ||
            postId === undefined
        ) {
            throw new Error(
                "Thiếu mã bài viết cần chỉnh sửa."
            );
        }

        try {
            const response =
                await updatePostById(
                    postId,
                    updatedFields
                );

            const existingPost =
                posts.find((post) =>
                    samePostId(
                        getPostId(post),
                        postId
                    )
                ) || {};

            const editedPost =
                normalizePost({
                    ...existingPost,
                    ...(response || {}),
                });

            setPosts((previousPosts) =>
                previousPosts.map((post) => {
                    if (
                        !samePostId(
                            getPostId(post),
                            postId
                        )
                    ) {
                        return post;
                    }

                    return normalizePost({
                        ...post,
                        ...(response || {}),
                    });
                })
            );

            return editedPost;
        } catch (error) {
            console.error(
                "Edit post error:",
                error
            );

            const message =
                error?.data?.detail ||
                error?.message ||
                "Không thể chỉnh sửa bài viết.";

            throw new Error(message);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Xóa bài viết
    |--------------------------------------------------------------------------
    */

    async function deletePost(postId) {
        let originalPosts = [];

        setPosts((previousPosts) => {
            originalPosts = previousPosts;

            return previousPosts.filter(
                (post) => {
                    return !samePostId(
                        getPostId(post),
                        postId
                    );
                }
            );
        });

        try {
            await deletePostById(postId);
        } catch (error) {
            console.error(
                "Delete post error:",
                error
            );

            setPosts(originalPosts);

            const message =
                error?.data?.detail ||
                error?.message ||
                "Không thể xóa bài viết. Vui lòng thử lại.";

            alert(`❌ ${message}`);

            throw error;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Thả tim bài viết
    |--------------------------------------------------------------------------
    */

    async function toggleLike(postId) {
        if (
            postId === null ||
            postId === undefined
        ) {
            console.error(
                "Toggle like error: thiếu postId"
            );

            return;
        }

        let originalPosts = [];

        /*
        | Cập nhật giao diện ngay lập tức.
        */

        setPosts((previousPosts) => {
            originalPosts = previousPosts;

            return previousPosts.map((post) => {
                if (
                    !samePostId(
                        getPostId(post),
                        postId
                    )
                ) {
                    return post;
                }

                const currentLiked = Boolean(
                    post.isLiked ??
                    post.is_liked ??
                    post.liked ??
                    false
                );

                const currentCount = Math.max(
                    0,
                    toNumber(
                        post.likes_count ??
                        post.likes,
                        0
                    )
                );

                const nextLiked =
                    !currentLiked;

                const nextCount =
                    nextLiked
                        ? currentCount + 1
                        : Math.max(
                              0,
                              currentCount - 1
                          );

                return {
                    ...post,

                    isLiked: nextLiked,
                    is_liked: nextLiked,
                    liked: nextLiked,

                    likes: nextCount,
                    likes_count: nextCount,
                };
            });
        });

        try {
            const response =
                await toggleLikePost(postId);

            /*
            | API có thể trả:
            | { liked, likes_count }
            | hoặc { is_liked, likes }
            | hoặc { post: {...} }
            */

            const data =
                response?.post &&
                typeof response.post === "object"
                    ? response.post
                    : response || {};

            const responseHasLiked =
                hasOwn(data, "liked") ||
                hasOwn(data, "isLiked") ||
                hasOwn(data, "is_liked");

            const responseHasCount =
                hasOwn(data, "likes_count") ||
                hasOwn(data, "likes");

            /*
            | Nếu API không trả trạng thái/count thì giữ nguyên
            | trạng thái optimistic hiện tại, không ép về false/0.
            */

            if (
                responseHasLiked ||
                responseHasCount
            ) {
                setPosts((previousPosts) =>
                    previousPosts.map((post) => {
                        if (
                            !samePostId(
                                getPostId(post),
                                postId
                            )
                        ) {
                            return post;
                        }

                        const currentLiked = Boolean(
                            post.isLiked ??
                            post.is_liked ??
                            post.liked ??
                            false
                        );

                        const currentCount = Math.max(
                            0,
                            toNumber(
                                post.likes_count ??
                                post.likes,
                                0
                            )
                        );

                        const serverLiked =
                            responseHasLiked
                                ? Boolean(
                                      data.liked ??
                                      data.isLiked ??
                                      data.is_liked
                                  )
                                : currentLiked;

                        const serverLikesCount =
                            responseHasCount
                                ? Math.max(
                                      0,
                                      toNumber(
                                          data.likes_count ??
                                          data.likes,
                                          currentCount
                                      )
                                  )
                                : currentCount;

                        return {
                            ...post,

                            isLiked: serverLiked,
                            is_liked: serverLiked,
                            liked: serverLiked,

                            likes:
                                serverLikesCount,

                            likes_count:
                                serverLikesCount,
                        };
                    })
                );
            }

            return response;
        } catch (error) {
            console.error(
                "Like API error:",
                error
            );

            /*
            | API lỗi thì trả lại dữ liệu ban đầu.
            */

            setPosts(originalPosts);

            const message =
                error?.data?.detail ||
                error?.message ||
                "Lỗi cập nhật trạng thái thích.";

            alert(
                `❌ ${message} Vui lòng đăng nhập lại hoặc thử lại.`
            );

            throw error;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Đăng lại bài viết
    |--------------------------------------------------------------------------
    */

    function toggleRepost(postId) {
        let originalPosts = [];

        setPosts((previousPosts) => {
            originalPosts = previousPosts;

            return previousPosts.map((post) => {
                if (
                    !samePostId(
                        getPostId(post),
                        postId
                    )
                ) {
                    return post;
                }

                const newIsReposted =
                    !post.isReposted;

                const currentCount = Math.max(
                    0,
                    toNumber(
                        post.reposts_count ??
                        post.reposts,
                        0
                    )
                );

                const newCount =
                    newIsReposted
                        ? currentCount + 1
                        : Math.max(
                              0,
                              currentCount - 1
                          );

                let repostedPosts = {};

                try {
                    repostedPosts =
                        JSON.parse(
                            localStorage.getItem(
                                "repostedPosts"
                            ) || "{}"
                        );
                } catch {
                    repostedPosts = {};
                }

                const id = String(
                    getPostId(post)
                );

                if (newIsReposted) {
                    repostedPosts[id] = true;
                } else {
                    delete repostedPosts[id];
                }

                localStorage.setItem(
                    "repostedPosts",
                    JSON.stringify(
                        repostedPosts
                    )
                );

                return {
                    ...post,
                    isReposted:
                        newIsReposted,
                    reposts:
                        newCount,
                    reposts_count:
                        newCount,
                };
            });
        });

        (async () => {
            try {
                const target =
                    originalPosts.find(
                        (post) =>
                            samePostId(
                                getPostId(post),
                                postId
                            )
                    );

                if (!target?.isReposted) {
                    await repostPost(postId);
                } else {
                    await unrepostPost(postId);
                }
            } catch (error) {
                console.error(
                    "Repost API error:",
                    error
                );

                setPosts(originalPosts);

                alert(
                    "❌ Lỗi cập nhật trạng thái chia sẻ. Vui lòng thử lại."
                );
            }
        })();
    }

    /*
    |--------------------------------------------------------------------------
    | Tăng số bình luận
    |--------------------------------------------------------------------------
    |
    | Hàm này phải được gọi sau khi backend tạo bình luận thành công.
    |
    */

    function incrementCommentCount(
        postId,
        amount = 1
    ) {
        setPosts((previousPosts) =>
            previousPosts.map((post) => {
                if (
                    !samePostId(
                        getPostId(post),
                        postId
                    )
                ) {
                    return post;
                }

                const currentCount = Math.max(
                    0,
                    toNumber(
                        post.comments_count ??
                        post.comments,
                        0
                    )
                );

                const nextCount = Math.max(
                    0,
                    currentCount +
                        toNumber(amount, 1)
                );

                return {
                    ...post,
                    comments:
                        nextCount,
                    comments_count:
                        nextCount,
                };
            })
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Đặt chính xác số bình luận
    |--------------------------------------------------------------------------
    |
    | Có thể dùng khi API trả về comments_count mới.
    |
    */

    function setCommentCount(
        postId,
        nextCount
    ) {
        const normalizedCount = Math.max(
            0,
            toNumber(nextCount, 0)
        );

        updatePost(postId, {
            comments:
                normalizedCount,
            comments_count:
                normalizedCount,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Provider
    |--------------------------------------------------------------------------
    */

    return (
        <PostContext.Provider
            value={{
                posts,

                createPost,
                updatePost,
                editPost,
                deletePost,
                hidePost,

                toggleLike,
                toggleRepost,

                incrementCommentCount,
                setCommentCount,

                refreshPosts:
                    loadPosts,
            }}
        >
            {children}
        </PostContext.Provider>
    );
}

export default PostProvider;