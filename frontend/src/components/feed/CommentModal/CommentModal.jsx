import "./CommentModal.css";

import { useEffect, useMemo, useState } from "react";
import {
    X,
    MessageCircle,
    SendHorizontal,
    MapPin,
} from "lucide-react";

import useCommentModal from "../../../context/useCommentModal";
import useComments from "../../../context/useComments";
import CommentItem from "../CommentItem/CommentItem";

function formatPostTime(createdAt) {
    if (!createdAt) return "Vừa xong";

    return new Date(createdAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function getInitial(name) {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
}

function countAllComments(comments) {
    if (!Array.isArray(comments)) {
        return 0;
    }

    return comments.reduce((total, comment) => {
        const replies = Array.isArray(comment.replies)
            ? comment.replies
            : [];

        return total + 1 + countAllComments(replies);
    }, 0);
}

function CommentModal() {
    const commentContext = useCommentModal();
    const commentsContext = useComments();

    const {
        isCommentModalOpen = false,
        selectedPost = null,
        closeCommentModal = () => {},
    } = commentContext || {};

    const {
        commentsByPost = {},
        loadingCommentsByPost = {},
        loadComments = () => {},
        addComment = async () => {},
    } = commentsContext || {};

    const [commentInput, setCommentInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const postId = selectedPost?.post_id || selectedPost?.id || null;

    const authorName =
        selectedPost?.username ||
        selectedPost?.user?.username ||
        selectedPost?.author ||
        "Ẩn danh";

    const postTitle = selectedPost?.title || "";
    const postContent = selectedPost?.content || "";

    const postTime = formatPostTime(selectedPost?.created_at);

    const postImageUrl = useMemo(() => {
        const imageUrl =
            selectedPost?.images?.[0]?.image_url ||
            selectedPost?.image_url ||
            selectedPost?.image ||
            null;

        if (!imageUrl || imageUrl === "null") {
            return null;
        }

        return imageUrl;
    }, [selectedPost]);

    const lat = selectedPost?.latitude;
    const lng = selectedPost?.longitude;

    const hasLocation =
        lat !== null &&
        lat !== undefined &&
        lng !== null &&
        lng !== undefined;

    const locationText =
        selectedPost?.place?.name ||
        selectedPost?.geo?.locationName ||
        selectedPost?.locationName ||
        (hasLocation
            ? `Tọa độ: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
            : null);

    const comments = useMemo(() => {
        if (!postId) {
            return [];
        }

        return commentsByPost[postId] || [];
    }, [commentsByPost, postId]);

    const totalCommentsCount = useMemo(() => {
        return countAllComments(comments);
    }, [comments]);

    const isLoadingComments = postId
        ? Boolean(loadingCommentsByPost[postId])
        : false;

    useEffect(() => {
        if (!isCommentModalOpen || !postId) {
            return;
        }

        loadComments(postId);
    }, [isCommentModalOpen, postId, loadComments]);

    if (!isCommentModalOpen || !selectedPost) {
        return null;
    }

    async function handleAddComment() {
        const cleanComment = commentInput.trim();

        if (!cleanComment || !postId || isSubmitting) {
            return;
        }

        try {
            setIsSubmitting(true);

            await addComment(postId, cleanComment);

            setCommentInput("");
        } catch (error) {
            console.error("Lỗi thêm bình luận:", error);
            alert("❌ Không thể thêm bình luận. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleAddComment();
        }
    }

    function handleClose() {
        setCommentInput("");
        closeCommentModal();
    }

    return (
        <div className="comment-modal">
            <div
                className="comment-modal__overlay"
                onClick={handleClose}
            />

            <section className="comment-modal__container">
                <header className="comment-modal__header">
                    <div className="comment-modal__title">
                        <MessageCircle size={22} />
                        <h2>Bình luận</h2>
                    </div>

                    <button
                        type="button"
                        className="comment-modal__close-button"
                        onClick={handleClose}
                    >
                        <X size={22} />
                    </button>
                </header>

                <div className="comment-modal__body">
                    <article className="comment-modal__post-card">
                        <div className="comment-modal__post-author">
                            <div className="comment-modal__post-avatar">
                                {getInitial(authorName)}
                            </div>

                            <div>
                                <h3 className="comment-modal__post-author-name">
                                    {authorName}
                                </h3>

                                <p className="comment-modal__post-time">
                                    {postTime}
                                </p>
                            </div>
                        </div>

                        <div className="comment-modal__post-content">
                            {postTitle && (
                                <h4 className="comment-modal__post-title">
                                    {postTitle}
                                </h4>
                            )}

                            {postContent && (
                                <p className="comment-modal__post-text">
                                    {postContent}
                                </p>
                            )}
                        </div>

                        {locationText && (
                            <div className="comment-modal__post-location">
                                <MapPin size={16} />
                                <span>{locationText}</span>
                            </div>
                        )}

                        {postImageUrl && (
                            <div className="comment-modal__post-image-wrapper">
                                <img
                                    src={postImageUrl}
                                    alt="Ảnh bài viết"
                                    className="comment-modal__post-image"
                                />
                            </div>
                        )}
                    </article>

                    <div className="comment-modal__divider" />

                    <section className="comment-modal__comment-section">
                        <div className="comment-modal__comment-section-header">
                            <h3>Tất cả bình luận</h3>
                            <span>{totalCommentsCount}</span>
                        </div>

                        <div className="comment-modal__comments">
                            {isLoadingComments && comments.length === 0 && (
                                <p className="comment-modal__empty">
                                    Đang tải bình luận...
                                </p>
                            )}

                            {!isLoadingComments && comments.length === 0 && (
                                <p className="comment-modal__empty">
                                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận.
                                </p>
                            )}

                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id || comment.comment_id}
                                    postId={postId}
                                    comment={comment}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <footer className="comment-modal__footer">
                    <div className="comment-modal__input-avatar">
                        B
                    </div>

                    <div className="comment-modal__input-box">
                        <input
                            type="text"
                            placeholder="Viết bình luận..."
                            className="comment-modal__input"
                            value={commentInput}
                            onChange={(event) => setCommentInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSubmitting}
                        />

                        <button
                            type="button"
                            className="comment-modal__submit-button"
                            onClick={handleAddComment}
                            disabled={isSubmitting || !commentInput.trim()}
                        >
                            <SendHorizontal size={18} />
                        </button>
                    </div>
                </footer>
            </section>
        </div>
    );
}

export default CommentModal;