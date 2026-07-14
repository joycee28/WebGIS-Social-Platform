import { useCallback, useMemo, useState } from "react";
import CreatePostModalContext from "./createPostModalContext";

function CreatePostModalProvider({ children }) {
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");

    const [geo, setGeo] = useState(null);

    const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [isManualLocationInputOpen, setIsManualLocationInputOpen] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const openCreatePostModal = useCallback(() => {
        setIsCreatePostModalOpen(true);
    }, []);

    const closeCreatePostModal = useCallback(() => {
        setIsCreatePostModalOpen(false);
        setIsLocationMenuOpen(false);
        setIsManualLocationInputOpen(false);
        setIsGettingLocation(false);
    }, []);

    const resetCreatePostForm = useCallback(() => {
        setPostTitle("");
        setPostContent("");
        setGeo(null);
        setIsLocationMenuOpen(false);
        setIsLocationPickerOpen(false);
        setIsManualLocationInputOpen(false);
        setIsGettingLocation(false);
    }, []);

    const value = useMemo(
        () => ({
            isCreatePostModalOpen,
            setIsCreatePostModalOpen,

            openCreatePostModal,
            closeCreatePostModal,
            resetCreatePostForm,

            postTitle,
            setPostTitle,

            postContent,
            setPostContent,

            geo,
            setGeo,

            isLocationMenuOpen,
            setIsLocationMenuOpen,

            isLocationPickerOpen,
            setIsLocationPickerOpen,

            isManualLocationInputOpen,
            setIsManualLocationInputOpen,

            isGettingLocation,
            setIsGettingLocation,
        }),
        [
            isCreatePostModalOpen,
            openCreatePostModal,
            closeCreatePostModal,
            resetCreatePostForm,
            postTitle,
            postContent,
            geo,
            isLocationMenuOpen,
            isLocationPickerOpen,
            isManualLocationInputOpen,
            isGettingLocation,
        ]
    );

    return (
        <CreatePostModalContext.Provider value={value}>
            {children}
        </CreatePostModalContext.Provider>
    );
}

export default CreatePostModalProvider;