import "./FeedList.css";

import {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
} from "react"

import usePosts from "../../../context/usePosts";

/* Post Card */
import PostCard from "../PostCard/PostCard";

/* Loading Post Card */
import SkeletonPostCard from "../SkeletonPostCard/SkeletonPostCard";

/* Feed Constants */
const POSTS_PER_PAGE = 5;

/* Feed List */
function FeedList() {

    const {
        posts,
    } = usePosts();

    /* Pagination State */

    const [
        currentPage,

        setCurrentPage,
    ] = useState(1);

    

    const visiblePosts = useMemo(() => {

        return posts.slice(
            0,
            currentPage * POSTS_PER_PAGE
        );

    }, [
        posts,
        currentPage,
    ]);

    {/* Loading State */ }

    const [
        isLoading,

        setIsLoading,
    ] = useState(false);

    /* Has More Posts */

    const [
        hasMorePosts,

        setHasMorePosts,
    ] = useState(true);

    const prevLengthRef = useRef(posts.length);

    useEffect(() => {
        if (posts.length !== prevLengthRef.current) {
            setCurrentPage(1);
            setHasMorePosts(true);
            prevLengthRef.current = posts.length;
        }
    }, [posts.length]);


    /* Load More Posts */

    const loadMorePosts = useCallback(() => {

        /* Prevent Duplicate Loading */

        if (
            isLoading ||
            !hasMorePosts
        ) {

            return;
        }

        /* Start Loading */

        setIsLoading(true);

        /* Simulate API Delay */

        setTimeout(() => {

            const startIndex =
                currentPage
                * POSTS_PER_PAGE;

            if (
                startIndex >= posts.length
            ) {

                setHasMorePosts(false);

                setIsLoading(false);

                return;
            }

            /* Update Current Page */

            setCurrentPage(prev => prev + 1);

            /* Finish Loading */

            setIsLoading(false);

        }, 1000);
    }, [
        posts,
        currentPage,
        isLoading,
        hasMorePosts,
    ]);

    /* Infinite Scroll Detection */
    const tickingRef = useRef(false);

    useEffect(() => {

        function handleScroll() {
            if (tickingRef.current) return;

            tickingRef.current = true;

            requestAnimationFrame(() => {
                /* Scroll Position */

                const scrollTop =
                    window.scrollY;

                const windowHeight =
                    window.innerHeight;

                const documentHeight =
                    document.documentElement
                        .scrollHeight;

                /* Near Bottom */

                const isNearBottom =
                    scrollTop
                    + windowHeight
                    >= documentHeight - 300;

                /* Trigger Load */

                if (isNearBottom) {
                    loadMorePosts();
                }

                tickingRef.current = false;
            });
        }

        /* Add Scroll Listener */

        window.addEventListener(
            "scroll",
            handleScroll
        );

        /* Cleanup Listener */

        return () => {

            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };

    }, [
        loadMorePosts,
    ]);

    return (

        <section className="feed-list">

            {visiblePosts.map((post) => (

                <PostCard
                    key={post.id}

                    post={post}
                />

            ))}

            {/* Skeleton Loading State */}

            {isLoading && (

                <div className="feed-list__skeletons">

                    {[...Array(2)].map((_, index) => (

                        <SkeletonPostCard
                            key={index}
                        />

                    ))}

                </div>

            )}

            {/* End State */}

            {!hasMorePosts && (

                <div className="feed-list__end-message">

                    Bạn đã xem hết bài viết.

                </div>

            )}

        </section>
    );
}

export default FeedList;