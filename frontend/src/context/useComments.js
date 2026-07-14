import { useContext } from "react";
import CommentContext from "./CommentContext";

function useComments() {
    const context = useContext(CommentContext);

    if (!context) {
        throw new Error("useComments phải được dùng bên trong CommentProvider");
    }

    return context;
}

export default useComments;