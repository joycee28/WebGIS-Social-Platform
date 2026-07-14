import {
    useCallback,
    useState,
} from "react";

import CommentContext from "./CommentContext";
import apiFetch from "../lib/api";
import usePosts from "./usePosts";

function getAccessToken() {
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (
        !token ||
        token === "null" ||
        token === "undefined" ||
        token.trim() === ""
    ) {
        return null;
    }

    return token;
}

function sameId(firstId, secondId) {
    if (
        firstId === null ||
        firstId === undefined ||
        secondId === null ||
        secondId === undefined
    ) {
        return false;
    }

    return String(firstId) === String(secondId);
}

function getCommentId(comment) {
    return (
        comment?.comment_id ??
        comment?.id ??
        null
    );
}

function getParentId(comment) {
    const parent =
        comment?.parent_id ??
        comment?.parent ??
        null;

    if (
        parent &&
        typeof parent === "object"
    ) {
        return (
            parent.comment_id ??
            parent.id ??
            null
        );
    }

    return parent;
}

function getErrorMessage(error, fallback) {
    const data = error?.data;

    if (typeof data?.detail === "string") {
        return data.detail;
    }

    if (
        Array.isArray(data?.content) &&
        data.content.length > 0
    ) {
        return String(data.content[0]);
    }

    if (
        Array.isArray(data?.comment) &&
        data.comment.length > 0
    ) {
        return String(data.comment[0]);
    }

    if (
        Array.isArray(data?.parent) &&
        data.parent.length > 0
    ) {
        return String(data.parent[0]);
    }

    if (
        typeof error?.message === "string" &&
        !error.message.startsWith("API Error:")
    ) {
        return error.message;
    }

    return fallback;
}

function normalizeComment(comment) {
    if (!comment) {
        return null;
    }

    const commentId =
        getCommentId(comment);

    if (
        commentId === null ||
        commentId === undefined
    ) {
        return null;
    }

    const liked = Boolean(
        comment.isLiked ??
        comment.is_liked ??
        comment.liked ??
        false
    );

    const likesCount = Math.max(
        0,
        Number(
            comment.likes_count ??
            comment.likes ??
            0
        ) || 0
    );

    const replies = Array.isArray(
        comment.replies
    )
        ? comment.replies
              .map(normalizeComment)
              .filter(Boolean)
        : [];

    return {
        ...comment,

        id: commentId,
        comment_id: commentId,

        parent_id:
            getParentId(comment),

        content:
            comment.content ??
            comment.comment ??
            "",

        author:
            comment.author ||
            comment.username ||
            comment.user?.username ||
            "Ẩn danh",

        username:
            comment.username ||
            comment.author ||
            comment.user?.username ||
            "Ẩn danh",

        avatar_url:
            comment.avatar_url ||
            comment.user?.avatar_url ||
            "",

        created_at:
            comment.created_at ||
            null,

        created_at_ms:
            comment.created_at_ms ||
            null,

        timestamp:
            comment.timestamp ||
            comment.created_at ||
            "Vừa xong",

        likes_count: likesCount,
        likes: likesCount,

        isLiked: liked,
        is_liked: liked,
        liked,

        replies,
    };
}

function addReplyToTree(
    comments,
    parentId,
    reply
) {
    return comments.map((comment) => {
        const commentId =
            getCommentId(comment);

        if (
            sameId(
                commentId,
                parentId
            )
        ) {
            return {
                ...comment,

                replies: [
                    ...(comment.replies || []),
                    reply,
                ],
            };
        }

        return {
            ...comment,

            replies: addReplyToTree(
                comment.replies || [],
                parentId,
                reply
            ),
        };
    });
}

function updateCommentInTree(
    comments,
    commentId,
    updater
) {
    return comments.map((comment) => {
        const currentId =
            getCommentId(comment);

        if (
            sameId(
                currentId,
                commentId
            )
        ) {
            return updater(comment);
        }

        return {
            ...comment,

            replies: updateCommentInTree(
                comment.replies || [],
                commentId,
                updater
            ),
        };
    });
}

function CommentProvider({ children }) {
    const [
        commentsByPost,
        setCommentsByPost,
    ] = useState({});

    const [
        loadingCommentsByPost,
        setLoadingCommentsByPost,
    ] = useState({});

    const postsContext = usePosts();

    const incrementCommentCount =
        postsContext?.incrementCommentCount;

    const loadComments = useCallback(
        async (postId) => {
            if (
                postId === null ||
                postId === undefined
            ) {
                return [];
            }

            setLoadingCommentsByPost(
                (previousState) => ({
                    ...previousState,
                    [postId]: true,
                })
            );

            try {
                let data;

                try {
                    data = await apiFetch(
                        `/posts/${postId}/comments/`,
                        {
                            method: "GET",
                        }
                    );
                } catch (error) {
                    if (error.status !== 401) {
                        throw error;
                    }

                    data = await apiFetch(
                        `/posts/${postId}/comments/`,
                        {
                            method: "GET",
                            auth: false,
                        }
                    );
                }

                const rawComments =
                    Array.isArray(data)
                        ? data
                        : data?.results || [];

                const normalizedComments =
                    rawComments
                        .map(normalizeComment)
                        .filter(Boolean);

                setCommentsByPost(
                    (previousState) => ({
                        ...previousState,

                        [postId]:
                            normalizedComments,
                    })
                );

                return normalizedComments;
            } catch (error) {
                console.error(
                    "Load comments error:",
                    error
                );

                setCommentsByPost(
                    (previousState) => ({
                        ...previousState,
                        [postId]: [],
                    })
                );

                return [];
            } finally {
                setLoadingCommentsByPost(
                    (previousState) => ({
                        ...previousState,
                        [postId]: false,
                    })
                );
            }
        },
        []
    );

    const addComment = useCallback(
        async (
            postId,
            content,
            parentId = null
        ) => {
            const cleanContent =
                String(content || "").trim();

            if (
                postId === null ||
                postId === undefined ||
                !cleanContent
            ) {
                return null;
            }

            if (!getAccessToken()) {
                throw new Error(
                    "Bạn cần đăng nhập để bình luận."
                );
            }

            const requestBody = {
                content: cleanContent,
            };

            if (
                parentId !== null &&
                parentId !== undefined
            ) {
                requestBody.parent =
                    parentId;
            }

            try {
                const createdComment =
                    await apiFetch(
                        `/posts/${postId}/comments/`,
                        {
                            method: "POST",
                            body: requestBody,
                        }
                    );

                const normalizedComment =
                    normalizeComment(
                        createdComment
                    );

                if (!normalizedComment) {
                    throw new Error(
                        "Backend không trả dữ liệu bình luận hợp lệ."
                    );
                }

                setCommentsByPost(
                    (previousState) => {
                        const currentComments =
                            previousState[
                                postId
                            ] || [];

                        if (
                            parentId !== null &&
                            parentId !== undefined
                        ) {
                            return {
                                ...previousState,

                                [postId]:
                                    addReplyToTree(
                                        currentComments,
                                        parentId,
                                        normalizedComment
                                    ),
                            };
                        }

                        return {
                            ...previousState,

                            [postId]: [
                                ...currentComments,
                                normalizedComment,
                            ],
                        };
                    }
                );

                if (
                    typeof incrementCommentCount ===
                    "function"
                ) {
                    incrementCommentCount(
                        postId,
                        1
                    );
                }

                return normalizedComment;
            } catch (error) {
                console.error(
                    "Add comment error:",
                    error
                );

                throw new Error(
                    getErrorMessage(
                        error,
                        "Không thể thêm bình luận."
                    )
                );
            }
        },
        [incrementCommentCount]
    );

    const toggleCommentLike =
        useCallback(
            async (
                postId,
                commentId
            ) => {
                if (
                    postId === null ||
                    postId === undefined ||
                    commentId === null ||
                    commentId === undefined
                ) {
                    return null;
                }

                if (!getAccessToken()) {
                    throw new Error(
                        "Bạn cần đăng nhập để thích bình luận."
                    );
                }

                let previousComments = [];

                setCommentsByPost(
                    (previousState) => {
                        previousComments =
                            previousState[
                                postId
                            ] || [];

                        return {
                            ...previousState,

                            [postId]:
                                updateCommentInTree(
                                    previousComments,
                                    commentId,
                                    (comment) => {
                                        const currentLiked =
                                            Boolean(
                                                comment.isLiked ??
                                                comment.is_liked ??
                                                comment.liked ??
                                                false
                                            );

                                        const currentCount =
                                            Math.max(
                                                0,
                                                Number(
                                                    comment.likes_count ??
                                                    comment.likes ??
                                                    0
                                                ) || 0
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
                                            ...comment,

                                            isLiked:
                                                nextLiked,

                                            is_liked:
                                                nextLiked,

                                            liked:
                                                nextLiked,

                                            likes_count:
                                                nextCount,

                                            likes:
                                                nextCount,
                                        };
                                    }
                                ),
                        };
                    }
                );

                try {
                    const data =
                        await apiFetch(
                            `/comments/${commentId}/like/`,
                            {
                                method:
                                    "POST",
                            }
                        );

                    setCommentsByPost(
                        (previousState) => ({
                            ...previousState,

                            [postId]:
                                updateCommentInTree(
                                    previousState[
                                        postId
                                    ] || [],

                                    commentId,

                                    (comment) => {
                                        const serverLiked =
                                            Boolean(
                                                data?.liked ??
                                                data?.isLiked ??
                                                data?.is_liked ??
                                                comment.isLiked ??
                                                false
                                            );

                                        const serverCount =
                                            Math.max(
                                                0,
                                                Number(
                                                    data?.likes_count ??
                                                    data?.likes ??
                                                    comment.likes_count ??
                                                    0
                                                ) || 0
                                            );

                                        return {
                                            ...comment,

                                            isLiked:
                                                serverLiked,

                                            is_liked:
                                                serverLiked,

                                            liked:
                                                serverLiked,

                                            likes_count:
                                                serverCount,

                                            likes:
                                                serverCount,
                                        };
                                    }
                                ),
                        })
                    );

                    return data;
                } catch (error) {
                    console.error(
                        "Toggle comment like error:",
                        error
                    );

                    setCommentsByPost(
                        (previousState) => ({
                            ...previousState,

                            [postId]:
                                previousComments,
                        })
                    );

                    throw new Error(
                        getErrorMessage(
                            error,
                            "Không thể cập nhật trạng thái thích bình luận."
                        )
                    );
                }
            },
            []
        );

    return (
        <CommentContext.Provider
            value={{
                commentsByPost,
                loadingCommentsByPost,

                loadComments,
                addComment,
                toggleCommentLike,
            }}
        >
            {children}
        </CommentContext.Provider>
    );
}

export default CommentProvider;
