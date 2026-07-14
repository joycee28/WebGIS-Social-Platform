import {
    useState,
} from "react";

import CommentModalContext
from "./commentModalContext";

/* Comment Modal Provider */

function CommentModalProvider({
    children,
}) {

    /* Modal State */

    const [
        isCommentModalOpen,

        setIsCommentModalOpen,
    ] = useState(false);

    /* Selected Post */

    const [
        selectedPost,

        setSelectedPost,
    ] = useState(null);

    /* Open Comment Modal */

    function openCommentModal(post) {

        setSelectedPost(post);

        setIsCommentModalOpen(true);
    }

    /* Close Comment Modal */

    function closeCommentModal() {

        setIsCommentModalOpen(false);

        setSelectedPost(null);
    }

    /* Provider */

    return (

        <CommentModalContext.Provider
            value={{
                isCommentModalOpen,

                selectedPost,

                openCommentModal,

                closeCommentModal,
            }}
        >

            {children}

        </CommentModalContext.Provider>
    );
}

export default CommentModalProvider;