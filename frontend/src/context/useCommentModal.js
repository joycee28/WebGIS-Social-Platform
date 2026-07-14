import {
    useContext,
} from "react";

import CommentModalContext
from "./commentModalContext";

/* Use Comment Modal */

function useCommentModal() {

    return useContext(
        CommentModalContext
    );
}

export default useCommentModal;