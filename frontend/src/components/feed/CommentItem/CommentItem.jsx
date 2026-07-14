import "./CommentItem.css";

import { useState } from "react";

import useComments from "../../../context/useComments";
import formatRelativeTime from "../../../lib/formatRelativeTime";

function getInitial(name) {
    if (!name) {
        return "?";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}

function CommentItem({
    comment,
    postId,
    depth = 0,
}) {
    const {
        addComment,
        toggleCommentLike,
    } = useComments();

    const [isReplying, setIsReplying] = useState(false);
    const [replyInput, setReplyInput] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    if (!comment || depth > 10) {
        return null;
    }

    const commentId =
        comment?.id ??
        comment?.comment_id ??
        null;

    const authorName =
        comment?.author ||
        comment?.username ||
        comment?.user?.username ||
        "Ẩn danh";

    const content =
        comment?.content ||
        comment?.comment ||
        "";

    const rawTime =
        comment?.created_at_ms ??
        comment?.created_at ??
        null;

    const time = rawTime
        ? formatRelativeTime(rawTime)
        : comment?.timestamp || "Vừa xong";

    const replies =
        Array.isArray(comment?.replies)
            ? comment.replies
            : [];

    const isLiked = Boolean(
        comment?.isLiked ??
        comment?.is_liked ??
        comment?.liked ??
        false
    );

    const likesCount = Number(
        comment?.likes_count ??
        comment?.likes ??
        0
    );

    async function handleSubmitReply() {
        const cleanReply = replyInput.trim();

        if (
            !cleanReply ||
            isSubmittingReply ||
            !commentId
        ) {
            return;
        }

        try {
            setIsSubmittingReply(true);

            await addComment(
                postId,
                cleanReply,
                commentId
            );

            setReplyInput("");
            setIsReplying(false);
        } catch (error) {
            console.error(
                "Lỗi trả lời bình luận:",
                error
            );

            alert(
                "❌ Không thể trả lời bình luận."
            );
        } finally {
            setIsSubmittingReply(false);
        }
    }

    function handleReplyKeyDown(event) {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            handleSubmitReply();
        }
    }

    async function handleToggleLike() {
        if (
            !commentId ||
            typeof toggleCommentLike !== "function"
        ) {
            return;
        }

        try {
            await toggleCommentLike(
                postId,
                commentId
            );
        } catch (error) {
            console.error(
                "Lỗi thích bình luận:",
                error
            );
        }
    }

    return (
        <div
            className={
                depth > 0
                    ? "comment-item comment-item--reply"
                    : "comment-item"
            }
            style={{
                marginLeft:
                    depth > 0
                        ? `${Math.min(depth, 4) * 22}px`
                        : 0,
            }}
        >
            <div className="comment-item__avatar">
                {getInitial(authorName)}
            </div>

            <div className="comment-item__body">
                <div className="comment-item__bubble">
                    <h4 className="comment-item__author">
                        {authorName}
                    </h4>

                    <p className="comment-item__content">
                        {content}
                    </p>
                </div>

                <div className="comment-item__meta">
                    <span className="comment-item__timestamp">
                        {time}
                    </span>

                    <button
                        type="button"
                        className={
                            isLiked
                                ? "comment-item__action-button comment-item__action-button--liked"
                                : "comment-item__action-button"
                        }
                        onClick={handleToggleLike}
                    >
                        Thích
                    </button>

                    {likesCount > 0 && (
                        <span className="comment-item__like-count">
                            ❤️ {likesCount}
                        </span>
                    )}

                    <button
                        type="button"
                        className="comment-item__action-button"
                        onClick={() =>
                            setIsReplying(
                                (previousValue) =>
                                    !previousValue
                            )
                        }
                    >
                        Trả lời
                    </button>
                </div>

                {isReplying && (
                    <div className="comment-item__reply-box">
                        <input
                            type="text"
                            className="comment-item__reply-input"
                            placeholder={`Trả lời ${authorName}...`}
                            value={replyInput}
                            onChange={(event) =>
                                setReplyInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={handleReplyKeyDown}
                            disabled={isSubmittingReply}
                            autoFocus
                        />

                        <button
                            type="button"
                            className="comment-item__reply-submit"
                            onClick={handleSubmitReply}
                            disabled={
                                isSubmittingReply ||
                                !replyInput.trim()
                            }
                        >
                            {isSubmittingReply
                                ? "Đang gửi..."
                                : "Gửi"}
                        </button>
                    </div>
                )}

                {replies.length > 0 && (
                    <div className="comment-item__replies">
                        {replies.map((reply) => (
                            <CommentItem
                                key={
                                    reply?.id ??
                                    reply?.comment_id
                                }
                                postId={postId}
                                comment={reply}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommentItem;
