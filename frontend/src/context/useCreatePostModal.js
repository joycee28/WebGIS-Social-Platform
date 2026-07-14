import { useContext } from "react";
import CreatePostModalContext from "./createPostModalContext";

function useCreatePostModal() {
    const context = useContext(CreatePostModalContext);

    if (!context) {
        throw new Error(
            "useCreatePostModal phải được dùng bên trong CreatePostModalProvider"
        );
    }

    return context;
}

export default useCreatePostModal;