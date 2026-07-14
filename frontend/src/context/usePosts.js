import { useContext } from "react";
import PostContext from "./PostContext";

export default function usePosts() {
    const context = useContext(PostContext);
    if (!context) {
        throw new Error("usePosts must be used within a PostProvider");
    }
    return context;
}