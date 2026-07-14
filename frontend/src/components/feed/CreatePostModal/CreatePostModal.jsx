import "./CreatePostModal.css";

import { useEffect, useState } from "react";
import Composer from "../Composer/Composer";
import { X } from "lucide-react";

import usePosts from "../../../context/usePosts";
import useCreatePostModal from "../../../context/useCreatePostModal";
import { getCategories } from "../../../services/placeService";

function CreatePostModal() {
    const {
        isCreatePostModalOpen,
        closeCreatePostModal,
    } = useCreatePostModal();

    const { createPost } = usePosts();

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await getCategories();

                const normalizedCategories = Array.isArray(data)
                    ? data
                    : data?.results || [];

                setCategories(normalizedCategories);
            } catch (error) {
                console.error("Load categories error:", error);
                setCategories([]);
            }
        }

        if (isCreatePostModalOpen) {
            loadCategories();
        }
    }, [isCreatePostModalOpen]);

    if (!isCreatePostModalOpen) {
        return null;
    }

    return (
        <div
            className="create-post-modal__overlay"
            onClick={closeCreatePostModal}
        >
            <div
                className="create-post-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="create-post-modal__header">
                    <h2>Tạo bài viết</h2>

                    <button
                        type="button"
                        onClick={closeCreatePostModal}
                    >
                        <X size={20} />
                    </button>
                </div>

                <Composer
                    categories={categories}
                    onSubmit={async (postData) => {
                        await createPost(postData);
                        closeCreatePostModal();
                    }}
                />
            </div>
        </div>
    );
}

export default CreatePostModal;