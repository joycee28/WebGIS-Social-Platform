import "./PostCard.css";

import { useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    Heart,
    MessageCircle,
    Share2,
    MapPin,
    MoreHorizontal,
    Tag,
    Trash2,
    EyeOff,
    Pencil,
    X,
} from "lucide-react";

import useCommentModal from "../../../context/useCommentModal";
import usePosts from "../../../context/usePosts";
import useMap from "../../../context/useMap";
import { sharePost } from "../../../services/notificationService";
import { useAuth } from "../../../context/AuthContext";

import normalizeMediaUrl from "../../../lib/normalizeMediaUrl";
import formatRelativeTime from "../../../lib/formatRelativeTime";

const FEELING_META = {
    "😊 Hài lòng": {
        tone: "satisfied",
    },
    "😐 Bình thường": {
        tone: "normal",
    },
    "😞 Không hài lòng": {
        tone: "dissatisfied",
    },
};

const FEELING_OPTIONS =
    Object.keys(FEELING_META);


function isCoordinateText(value) {
    if (!value) {
        return false;
    }

    const text = String(value).toLowerCase();

    return (
        text.includes("tọa độ") ||
        text.includes("toa do") ||
        /\d+\.\d+,\s*\d+\.\d+/.test(text)
    );
}


function isGenericLocationText(value) {
    if (!value) {
        return false;
    }

    const text = String(value).toLowerCase();

    return (
        text.includes("vị trí đã ghim") ||
        text.includes("vi tri da ghim") ||
        text.includes("vị trí bài viết") ||
        text.includes("vi tri bai viet")
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


function PostCard({
    post,
    onPostUpdated,
    onPostDeleted,
    onPostHidden,
    allowOwnerEdit = false,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuth();

    const [
        isMenuOpen,
        setIsMenuOpen,
    ] = useState(false);

    const [
        isEditModalOpen,
        setIsEditModalOpen,
    ] = useState(false);

    const [
        editTitle,
        setEditTitle,
    ] = useState("");

    const [
        editContent,
        setEditContent,
    ] = useState("");

    const [
        isSavingEdit,
        setIsSavingEdit,
    ] = useState(false);

    const [
        editError,
        setEditError,
    ] = useState("");

    const { setPendingPost } = useMap();

    const {
        openCommentModal,
    } = useCommentModal();

    const {
        toggleLike,
        editPost,
        deletePost,
        hidePost,
    } = usePosts();

    const postId =
        post?.post_id ??
        post?.id;

    const authorName =
        post?.username ||
        post?.user?.username ||
        post?.author ||
        "Ẩn danh";

    const avatarUrl = normalizeMediaUrl(
        post?.avatar_url ||
        post?.user_avatar ||
        post?.author_avatar ||
        post?.user?.avatar_url ||
        ""
    );

    const isOwner = Boolean(
        user?.username &&
        authorName &&
        user.username.toLowerCase() ===
            authorName.toLowerCase()
    );


    const isHomePage =
        location.pathname === "/" ||
        location.pathname === "/home";

    const canHidePost =
        isHomePage &&
        !isOwner;

    const canEditPost =
        isOwner &&
        allowOwnerEdit;

    const canOpenMenu =
        isOwner ||
        canHidePost;

    const postTitle =
        post?.title || "";

    const feelingMeta =
        FEELING_META[postTitle] || null;


    const postTime = formatRelativeTime(
        post?.created_at ||
        post?.timestamp
    );

    const displayImageUrl = normalizeMediaUrl(
        post?.images?.[0]?.image_url &&
        post.images[0].image_url !== "null"
            ? post.images[0].image_url
            : post?.image || ""
    );

    const coord = getPostLatLng(post);
    const hasLocation = Boolean(coord);

    const isLiked = Boolean(
        post?.isLiked ??
        post?.is_liked ??
        post?.liked ??
        false
    );

    const likesCount = Number(
        post?.likes_count ??
        post?.likes ??
        0
    );

    const commentsCount = Number(
        post?.comments_count ??
        post?.comments ??
        0
    );

    const rawLocationText =
        post?.location_name ||
        post?.locationName ||
        post?.place?.name ||
        post?.geo?.locationName ||
        "";

    const locationText =
        rawLocationText &&
        !isCoordinateText(rawLocationText) &&
        !isGenericLocationText(rawLocationText)
            ? rawLocationText
            : hasLocation
                ? "Vị trí đã chọn"
                : "Không xác định";


    const rawPostTime =
        post?.created_at_ms ??
        post?.created_at ??
        post?.timestamp;

    const categoryText =
        post?.feeling ||
        post?.category_name ||
        post?.place?.category_name ||
        (post?.category_id
            ? "Danh mục: " + post.category_id
            : "");

    function handleViewOnMap() {
        if (!coord && !post?.geo) {
            return;
        }

        if (coord) {
            setPendingPost({
                ...post,

                geo: {
                    lat: coord.lat,
                    lng: coord.lng,

                    locationName:
                        locationText ||
                        "Vị trí bài viết",
                },
            });
        } else {
            setPendingPost(post);
        }

        navigate("/map");
    }

    async function handleToggleLike() {
    if (!postId || typeof toggleLike !== "function") {
        return;
    }

    try {
        const response = await toggleLike(postId);

        const nextLiked = Boolean(
            response?.liked ??
            response?.isLiked ??
            response?.is_liked ??
            !isLiked
        );

        const nextLikesCount = Number(
            response?.likes_count ??
            response?.likes ??
            (
                nextLiked
                    ? likesCount + 1
                    : Math.max(0, likesCount - 1)
            )
        );

        if (typeof onPostUpdated === "function") {
            onPostUpdated({
                ...post,

                isLiked: nextLiked,
                is_liked: nextLiked,
                liked: nextLiked,

                likes_count: nextLikesCount,
                likes: nextLikesCount,
            });
        }
    } catch (error) {
        console.error(
            "Không thể cập nhật lượt thích:",
            error
        );
    }
}

    async function handleShare() {
        const shareUrl =
            `${window.location.origin}/posts/${postId}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title:
                        postTitle ||
                        "Bài viết WebGIS",

                    text:
                        post?.content ||
                        "Xem bài viết này trên WebGIS",

                    url: shareUrl,
                });
            } else {
                await navigator.clipboard.writeText(
                    shareUrl
                );

                alert(
                    "Đã sao chép liên kết bài viết."
                );
            }

            await sharePost(postId);
        } catch (error) {
            if (error?.name === "AbortError") {
                return;
            }

            console.error(
                "Lỗi chia sẻ:",
                error
            );
        }
    }



    function handleOpenEdit() {
        setEditTitle(
            postTitle
        );

        setEditContent(
            post?.content || ""
        );

        setEditError("");
        setIsMenuOpen(false);
        setIsEditModalOpen(true);
    }

    function handleCloseEdit() {
        if (isSavingEdit) {
            return;
        }

        setIsEditModalOpen(false);
        setEditError("");
    }

    async function handleSaveEdit() {
        if (
            typeof editPost !== "function"
        ) {
            setEditError(
                "Chức năng chỉnh sửa chưa sẵn sàng."
            );

            return;
        }

        const normalizedContent =
            editContent.trim();

        if (
            !normalizedContent &&
            !displayImageUrl
        ) {
            setEditError(
                "Bài viết cần có nội dung hoặc ảnh."
            );

            return;
        }

        try {
            setIsSavingEdit(true);
            setEditError("");

            const updatedPost =
                await editPost(
                    postId,
                    {
                        title:
                            editTitle ||
                            postTitle ||
                            "😐 Bình thường",

                        content:
                            normalizedContent,
                    }
                );

            if (
                typeof onPostUpdated ===
                "function"
            ) {
                onPostUpdated(
                    updatedPost
                );
            }

            setIsEditModalOpen(false);
        } catch (error) {
            setEditError(
                error?.message ||
                "Không thể lưu thay đổi."
            );
        } finally {
            setIsSavingEdit(false);
        }
    }


    async function handleDeletePost() {
        const confirmed = window.confirm(
            "Bạn có chắc muốn xóa bài viết này không?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deletePost(postId);

            if (
                typeof onPostDeleted ===
                "function"
            ) {
                onPostDeleted(
                    postId
                );
            }

            setIsMenuOpen(false);

            if (
                location.pathname.startsWith(
                    "/posts/"
                )
            ) {
                navigate("/");
            }
        } catch (error) {
            console.error(
                "Delete post error:",
                error
            );
        }
    }



    function handleHidePost() {
        const confirmed = window.confirm(
            "Bạn có muốn ẩn bài viết này khỏi Trang chủ không?"
        );

        if (!confirmed) {
            return;
        }

        if (typeof hidePost !== "function") {
            console.error(
                "Không tìm thấy hàm hidePost trong PostProvider."
            );

            return;
        }

        hidePost(postId);

        if (
            typeof onPostHidden ===
            "function"
        ) {
            onPostHidden(
                postId
            );
        }

        setIsMenuOpen(false);
    }

    return (
        <article className="post-card">
            <header className="post-card__header">
                <div className="post-card__author-section">
                    <div className="post-card__avatar">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={authorName}
                                className="post-card__avatar-img"
                            />
                        ) : (
                            <div className="post-card__avatar-placeholder" />
                        )}
                    </div>

                    <div className="post-card__meta">
                        <div className="post-card__author-row">
                            <h3 className="post-card__author">
                                {authorName}
                            </h3>

                            {categoryText && (
                                <div className="post-card__feeling">
                                    <Tag size={14} />

                                    <span>
                                        {categoryText}
                                    </span>
                                </div>
                            )}
                        </div>

                        <span className="post-card__timestamp">
                            {postTime}
                        </span>
                    </div>
                </div>

                <div className="post-card__more-wrapper">
                    <button
                        type="button"
                        className="post-card__more-button"
                        onClick={() =>
                            setIsMenuOpen(
                                (previousValue) =>
                                    !previousValue
                            )
                        }
                        aria-label="Mở menu bài viết"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {isMenuOpen && canOpenMenu && (
                        <div className="post-card__menu">
                            {canHidePost && (
                                <button
                                    type="button"
                                    className="post-card__menu-item"
                                    onClick={handleHidePost}
                                >
                                    <EyeOff size={16} />

                                    <span>
                                        Ẩn bài viết
                                    </span>
                                </button>
                            )}

                            {canEditPost && (
                                <button
                                    type="button"
                                    className="post-card__menu-item"
                                    onClick={handleOpenEdit}
                                >
                                    <Pencil size={16} />

                                    <span>
                                        Chỉnh sửa bài viết
                                    </span>
                                </button>
                            )}

                            {isOwner && (
                                <button
                                    type="button"
                                    className="post-card__menu-item post-card__menu-item--danger"
                                    onClick={handleDeletePost}
                                >
                                    <Trash2 size={16} />

                                    <span>
                                        Xóa bài viết
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="post-card__content">
                <div className="post-card__text">
                    {postTitle && (
                        feelingMeta ? (
                            <div
                                className={`post-card__feeling-status post-card__feeling-status--${feelingMeta.tone}`}
                            >
                                {postTitle}
                            </div>
                        ) : (
                            <strong className="post-card__legacy-title">
                                {postTitle}
                            </strong>
                        )
                    )}

                    <p
                        style={{
                            margin: 0,
                        }}
                    >
                        {post?.content}
                    </p>
                </div>
            </div>

            {displayImageUrl && (
                <div className="post-card__image-wrapper">
                    <img
                        src={displayImageUrl}
                        alt="Post"
                        className="post-card__image"
                    />
                </div>
            )}

            <div className="post-card__location">
                <MapPin size={16} />

                <button
                    type="button"
                    className="post-card__location-button"
                    onClick={handleViewOnMap}
                    disabled={!hasLocation}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        font: "inherit",
                        color: "inherit",

                        cursor:
                            hasLocation
                                ? "pointer"
                                : "default",
                    }}
                >
                    <span>
                        {locationText}
                    </span>
                </button>
            </div>

            <div className="post-card__actions">
                <button
                    type="button"
                    className={
                        isLiked
                            ? "post-card__action-button post-card__action-button--liked"
                            : "post-card__action-button"
                    }
                    onClick={handleToggleLike}
                >
                    <Heart
                        size={24}
                        fill={
                            isLiked
                                ? "currentColor"
                                : "none"
                        }
                    />

                    <span>
                        {likesCount}
                    </span>
                </button>

                <button
                    type="button"
                    className="post-card__action-button"
                    onClick={() =>
                        openCommentModal &&
                        openCommentModal(post)
                    }
                >
                    <MessageCircle size={24} />

                    <span>
                        {commentsCount}
                    </span>
                </button>

                <button
                    type="button"
                    className="post-card__action-button"
                    onClick={handleShare}
                    aria-label="Chia sẻ bài viết"
                    title="Chia sẻ bài viết"
                >
                    <Share2 size={24} />
                </button>
            </div>

            {isEditModalOpen && (
                <div
                    className="post-card__edit-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            handleCloseEdit();
                        }
                    }}
                >
                    <div
                        className="post-card__edit-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`edit-post-title-${postId}`}
                    >
                        <div className="post-card__edit-header">
                            <h3
                                id={`edit-post-title-${postId}`}
                            >
                                Chỉnh sửa bài viết
                            </h3>

                            <button
                                type="button"
                                className="post-card__edit-close"
                                onClick={handleCloseEdit}
                                disabled={isSavingEdit}
                                aria-label="Đóng cửa sổ chỉnh sửa"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="post-card__edit-body">
                            <div className="post-card__edit-field">
                                <span className="post-card__edit-label">
                                    Cảm xúc
                                </span>

                                <div className="post-card__edit-feelings">
                                    {FEELING_OPTIONS.map(
                                        (feeling) => {
                                            const meta =
                                                FEELING_META[
                                                    feeling
                                                ];

                                            const isSelected =
                                                editTitle ===
                                                feeling;

                                            return (
                                                <button
                                                    key={feeling}
                                                    type="button"
                                                    className={
                                                        isSelected
                                                            ? `post-card__edit-feeling post-card__edit-feeling--${meta.tone} post-card__edit-feeling--selected`
                                                            : `post-card__edit-feeling post-card__edit-feeling--${meta.tone}`
                                                    }
                                                    onClick={() => {
                                                        setEditTitle(
                                                            feeling
                                                        );
                                                        setEditError(
                                                            ""
                                                        );
                                                    }}
                                                    disabled={
                                                        isSavingEdit
                                                    }
                                                    aria-pressed={
                                                        isSelected
                                                    }
                                                >
                                                    {feeling}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>

                                {!FEELING_META[
                                    editTitle
                                ] &&
                                    editTitle && (
                                        <div className="post-card__edit-legacy">
                                            Tiêu đề cũ đang được giữ nguyên:{" "}
                                            <strong>
                                                {editTitle}
                                            </strong>
                                        </div>
                                    )}
                            </div>

                            <label className="post-card__edit-field">
                                <span className="post-card__edit-label">
                                    Nội dung
                                </span>

                                <textarea
                                    value={editContent}
                                    onChange={(event) => {
                                        setEditContent(
                                            event.target.value
                                        );
                                        setEditError("");
                                    }}
                                    rows={6}
                                    maxLength={5000}
                                    disabled={isSavingEdit}
                                    placeholder="Nhập nội dung bài viết..."
                                />
                            </label>

                            <div className="post-card__edit-note">
                                Ảnh và vị trí hiện tại được giữ nguyên để tránh ảnh hưởng dữ liệu bản đồ.
                            </div>

                            {editError && (
                                <div className="post-card__edit-error">
                                    {editError}
                                </div>
                            )}
                        </div>

                        <div className="post-card__edit-actions">
                            <button
                                type="button"
                                className="post-card__edit-cancel"
                                onClick={handleCloseEdit}
                                disabled={isSavingEdit}
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                className="post-card__edit-save"
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                            >
                                {isSavingEdit
                                    ? "Đang lưu..."
                                    : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}

export default PostCard;
