import "./PostDetailPage.css";

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    ArrowLeft,
} from "lucide-react";

import PostCard from "../../components/feed/PostCard/PostCard";
import { getPostById } from "../../services/postService";
import usePosts from "../../context/usePosts";

function getPostId(post) {
    return (
        post?.post_id ??
        post?.id ??
        null
    );
}

function PostDetailPage() {
    const {
        postId,
    } = useParams();

    const navigate =
        useNavigate();

    const {
        updatePost,
    } = usePosts();

    const [
        post,
        setPost,
    ] = useState(null);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadPostDetail() {
            try {
                setIsLoading(true);
                setErrorMessage("");

                const data =
                    await getPostById(postId);

                if (!isMounted) {
                    return;
                }

                setPost(data);

                const loadedPostId =
                    getPostId(data) ??
                    postId;

                if (
                    typeof updatePost ===
                    "function"
                ) {
                    updatePost(
                        loadedPostId,
                        data
                    );
                }
            } catch (error) {
                console.error(
                    "Load post detail error:",
                    error
                );

                if (isMounted) {
                    setErrorMessage(
                        "Không thể tải bài viết này."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadPostDetail();

        return () => {
            isMounted = false;
        };
    }, [postId]);

    function handlePostUpdated(
        updatedPost
    ) {
        if (!updatedPost) {
            return;
        }

        setPost(
            (
                currentPost
            ) => ({
                ...currentPost,
                ...updatedPost,
            })
        );

        const updatedPostId =
            getPostId(updatedPost) ??
            postId;

        if (
            typeof updatePost ===
            "function"
        ) {
            updatePost(
                updatedPostId,
                updatedPost
            );
        }
    }

    if (isLoading) {
        return (
            <main className="post-detail-page">
                <div className="post-detail-page__state">
                    Đang tải bài viết...
                </div>
            </main>
        );
    }

    if (errorMessage) {
        return (
            <main className="post-detail-page">
                <div className="post-detail-page__state post-detail-page__state--error">
                    {errorMessage}
                </div>
            </main>
        );
    }

    return (
        <main className="post-detail-page">
            <button
                type="button"
                className="post-detail-page__back"
                onClick={() =>
                    navigate(-1)
                }
            >
                <ArrowLeft size={18} />

                <span>
                    Quay lại
                </span>
            </button>

            {post ? (
                <PostCard
                    post={post}
                    onPostUpdated={
                        handlePostUpdated
                    }
                />
            ) : (
                <div className="post-detail-page__state">
                    Không tìm thấy bài viết.
                </div>
            )}
        </main>
    );
}

export default PostDetailPage;

