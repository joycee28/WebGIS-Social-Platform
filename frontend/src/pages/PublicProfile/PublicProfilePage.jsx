import "./PublicProfilePage.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    FileText,
    Heart,
    MessageCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PostCard from "../../components/feed/PostCard/PostCard";

import {
    getPublicProfile,
    getUserPosts,
} from "../../services/userService";

function getInitial(name) {
    if (!name) {
        return "?";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}

function getPostId(post) {
    return (
        post?.post_id ??
        post?.id ??
        null
    );
}

function PublicProfilePage() {
    const {
        username,
    } = useParams();

    const navigate =
        useNavigate();

    const auth =
        useAuth();

    const user =
        auth?.user || null;

    const isAuthLoading =
        Boolean(auth?.isLoading);

    const [
        profile,
        setProfile,
    ] = useState(null);

    const [
        posts,
        setPosts,
    ] = useState([]);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const profileUsername =
        useMemo(() => {
            if (username === "me") {
                return (
                    user?.username ||
                    null
                );
            }

            return username;
        }, [
            username,
            user,
        ]);

    useEffect(() => {
        if (
            username !== "me" ||
            isAuthLoading
        ) {
            return;
        }

        if (user?.username) {
            navigate(
                `/u/${user.username}`,
                {
                    replace: true,
                }
            );

            return;
        }

        navigate(
            "/profile",
            {
                replace: true,
                state: {
                    authMode: "login",
                    from: "/u/me",
                },
            }
        );
    }, [
        username,
        user?.username,
        isAuthLoading,
        navigate,
    ]);

    useEffect(() => {
        async function loadPublicProfile() {
            if (username === "me") {
                if (isAuthLoading) {
                    setIsLoading(true);
                }

                return;
            }

            if (!profileUsername) {
                setErrorMessage(
                    "Không tìm thấy người dùng."
                );

                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setErrorMessage("");

                const [
                    profileData,
                    postsData,
                ] = await Promise.all([
                    getPublicProfile(
                        profileUsername
                    ),
                    getUserPosts(
                        profileUsername
                    ),
                ]);

                setProfile(profileData);

                const normalizedPosts =
                    Array.isArray(postsData)
                        ? postsData
                        : postsData?.results ||
                          [];

                setPosts(
                    normalizedPosts
                );
            } catch (error) {
                console.error(
                    "Load public profile error:",
                    error
                );

                if (
                    error?.status ===
                    404
                ) {
                    setErrorMessage(
                        "Không tìm thấy trang cá nhân này."
                    );
                } else {
                    setErrorMessage(
                        "Không thể tải trang cá nhân. Vui lòng thử lại."
                    );
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadPublicProfile();
    }, [
        profileUsername,
        username,
        isAuthLoading,
    ]);

    const displayName =
        profile?.full_name ||
        profile?.username ||
        "Người dùng";

    const avatarUrl =
        profile?.avatar_url;

    const isOwnProfile =
        Boolean(
            user?.username &&
            profile?.username &&
            user.username.toLowerCase() ===
                profile.username.toLowerCase()
        );

    const postsCount =
        posts.length;

    const totalLikes =
        posts.reduce(
            (
                total,
                post
            ) => {
                return (
                    total +
                    Number(
                        post?.likes_count ??
                        post?.likes ??
                        0
                    )
                );
            },
            0
        );

    const totalComments =
        posts.reduce(
            (
                total,
                post
            ) => {
                return (
                    total +
                    Number(
                        post?.comments_count ??
                        post?.comments ??
                        0
                    )
                );
            },
            0
        );

    function handleRemovePostFromProfile(
        postId
    ) {
        setPosts(
            (
                previousPosts
            ) =>
                previousPosts.filter(
                    (
                        currentPost
                    ) => {
                        const currentPostId =
                            getPostId(
                                currentPost
                            );

                        return (
                            String(
                                currentPostId
                            ) !==
                            String(
                                postId
                            )
                        );
                    }
                )
        );
    }

    function handlePostUpdated(
        updatedPost
    ) {
        const updatedPostId =
            getPostId(
                updatedPost
            );

        if (
            updatedPostId ===
                null ||
            updatedPostId ===
                undefined
        ) {
            return;
        }

        setPosts(
            (
                previousPosts
            ) =>
                previousPosts.map(
                    (
                        currentPost
                    ) => {
                        const currentPostId =
                            getPostId(
                                currentPost
                            );

                        if (
                            String(
                                currentPostId
                            ) !==
                            String(
                                updatedPostId
                            )
                        ) {
                            return currentPost;
                        }

                        return {
                            ...currentPost,
                            ...updatedPost,
                        };
                    }
                )
        );
    }

    if (isLoading) {
        return (
            <main className="public-profile">
                <div className="public-profile__state">
                    Đang tải trang cá nhân...
                </div>
            </main>
        );
    }

    if (errorMessage) {
        return (
            <main className="public-profile">
                <div className="public-profile__state public-profile__state--error">
                    <p>
                        {errorMessage}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Quay về trang chủ
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="public-profile">
            <section className="public-profile__header-card">
                <div className="public-profile__info">
                    <div className="public-profile__avatar">
                        {avatarUrl ? (
                            <img
                                src={
                                    avatarUrl
                                }
                                alt={
                                    displayName
                                }
                            />
                        ) : (
                            <span>
                                {getInitial(
                                    displayName
                                )}
                            </span>
                        )}
                    </div>

                    <div className="public-profile__meta">
                        <div className="public-profile__name-row">
                            <div>
                                <h1>
                                    {displayName}
                                </h1>

                                <p>
                                    @
                                    {
                                        profile?.username
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="public-profile__stats">
                    <div className="public-profile__stat">
                        <FileText
                            size={18}
                        />

                        <strong>
                            {postsCount}
                        </strong>

                        <span>
                            Bài viết
                        </span>
                    </div>

                    <div className="public-profile__stat">
                        <Heart
                            size={18}
                        />

                        <strong>
                            {totalLikes}
                        </strong>

                        <span>
                            Lượt thích
                        </span>
                    </div>

                    <div className="public-profile__stat">
                        <MessageCircle
                            size={18}
                        />

                        <strong>
                            {totalComments}
                        </strong>

                        <span>
                            Bình luận
                        </span>
                    </div>
                </div>
            </section>

            <section className="public-profile__posts">
                <div className="public-profile__section-title">
                    <h2>
                        Bài viết của{" "}
                        {displayName}
                    </h2>

                    <span>
                        {postsCount} bài viết
                    </span>
                </div>

                {posts.length ===
                0 ? (
                    <div className="public-profile__empty">
                        Người dùng này chưa có bài viết nào.
                    </div>
                ) : (
                    posts.map(
                        (
                            post
                        ) => (
                            <PostCard
                                key={
                                    getPostId(
                                        post
                                    )
                                }
                                post={
                                    post
                                }
                                allowOwnerDelete={
                                    isOwnProfile
                                }
                                allowOwnerEdit={
                                    isOwnProfile
                                }
                                onPostUpdated={
                                    handlePostUpdated
                                }
                                onPostDeleted={
                                    handleRemovePostFromProfile
                                }
                                onPostHidden={
                                    handleRemovePostFromProfile
                                }
                            />
                        )
                    )
                )}
            </section>
        </main>
    );
}

export default PublicProfilePage;
