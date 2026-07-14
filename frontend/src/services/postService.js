import apiFetch from "../lib/api";

function getAccessToken() {
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (
        !token ||
        token === "null" ||
        token === "undefined" ||
        token.trim() === ""
    ) {
        return null;
    }

    return token;
}

function clearInvalidTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("access");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("refresh_token");
}

function getAuthHeaders() {
    const token = getAccessToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function getPosts() {
    const token = getAccessToken();

    if (!token) {
        return apiFetch("/posts/", {
            method: "GET",
        });
    }

    try {
        return await apiFetch("/posts/", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        if (error.status === 401) {
            clearInvalidTokens();

            return apiFetch("/posts/", {
                method: "GET",
            });
        }

        throw error;
    }
}

export async function getPostById(postId) {
    const token = getAccessToken();

    return apiFetch(`/posts/${postId}/`, {
        method: "GET",
        headers: token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {},
    });
}

export async function createPost(postData) {
    const token = getAccessToken();

    if (!token) {
        const error = new Error(
            "Bạn chưa đăng nhập. Vui lòng đăng nhập để tạo bài viết."
        );
        error.isAuthError = true;
        throw error;
    }

    const formData = new FormData();

    formData.append(
        "title",
        postData.title || "Bài viết WebGIS"
    );

    formData.append(
        "content",
        postData.content || ""
    );

    if (postData.category_id) {
        formData.append(
            "category_id",
            postData.category_id
        );
    }

    if (
        postData.latitude !== undefined &&
        postData.latitude !== null &&
        postData.latitude !== ""
    ) {
        formData.append(
            "latitude",
            postData.latitude
        );
    }

    if (
        postData.longitude !== undefined &&
        postData.longitude !== null &&
        postData.longitude !== ""
    ) {
        formData.append(
            "longitude",
            postData.longitude
        );
    }

    const locationName =
        postData.location_name ||
        postData.locationName ||
        postData.place?.name ||
        postData.geo?.locationName ||
        "";

    if (locationName) {
        formData.append(
            "location_name",
            locationName
        );
    }

    const placeValue =
        postData.place_id ??
        postData.place ??
        null;

    if (
        placeValue !== null &&
        placeValue !== undefined &&
        placeValue !== ""
    ) {
        if (typeof placeValue === "object") {
            const databasePlaceId =
                placeValue.place_id ??
                placeValue.id ??
                null;

            formData.append(
                "place",
                databasePlaceId !== null
                    ? databasePlaceId
                    : JSON.stringify(placeValue)
            );
        } else {
            formData.append(
                "place",
                placeValue
            );
        }
    }

    if (Array.isArray(postData.images)) {
        postData.images.forEach((file) => {
            if (file instanceof File) {
                formData.append(
                    "images",
                    file,
                    file.name
                );
            }
        });
    }

    try {
        return await apiFetch("/posts/", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
    } catch (error) {
        if (error.status === 401) {
            clearInvalidTokens();
            throw new Error(
                "❌ Token hết hạn. Vui lòng đăng nhập lại."
            );
        }

        if (error.status === 403) {
            throw new Error(
                "❌ Bạn không có quyền tạo bài viết."
            );
        }

        if (error.status === 400) {
            const detail =
                error.data?.detail ||
                error.data?.place?.[0] ||
                error.data?.content?.[0] ||
                error.data?.location_name?.[0] ||
                "Dữ liệu bài viết không hợp lệ";

            throw new Error(`❌ ${detail}`);
        }

        if (error.status >= 500) {
            throw new Error(
                "❌ Lỗi server. Vui lòng thử lại sau."
            );
        }

        throw error;
    }
}

export async function updatePostById(
    postId,
    updatedData
) {
    const token = getAccessToken();

    if (!token) {
        throw new Error(
            "Bạn chưa đăng nhập. Vui lòng đăng nhập để chỉnh sửa bài viết."
        );
    }

    const payload = {};

    if (
        Object.prototype.hasOwnProperty.call(
            updatedData,
            "title"
        )
    ) {
        payload.title =
            updatedData.title;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updatedData,
            "content"
        )
    ) {
        payload.content =
            updatedData.content;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updatedData,
            "category_id"
        )
    ) {
        payload.category_id =
            updatedData.category_id;
    }

    try {
        return await apiFetch(
            `/posts/${postId}/`,
            {
                method: "PATCH",
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
                body: payload,
            }
        );
    } catch (error) {
        if (error.status === 401) {
            clearInvalidTokens();

            throw new Error(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            );
        }

        if (error.status === 403) {
            throw new Error(
                "Bạn chỉ được chỉnh sửa bài viết của chính mình."
            );
        }

        if (error.status === 404) {
            throw new Error(
                "Không tìm thấy bài viết cần chỉnh sửa."
            );
        }

        if (error.status === 400) {
            const detail =
                error.data?.detail ||
                error.data?.title?.[0] ||
                error.data?.content?.[0] ||
                error.data?.category_id?.[0] ||
                "Dữ liệu chỉnh sửa không hợp lệ.";

            throw new Error(detail);
        }

        throw error;
    }
}

export async function toggleLikePost(postId) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để thả tim.");
    }

    return apiFetch(`/posts/${postId}/like/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function likePost(postId) {
    return toggleLikePost(postId);
}

export async function unlikePost(postId) {
    return toggleLikePost(postId);
}

export async function deletePostById(postId) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xóa bài viết.");
    }

    return apiFetch(`/posts/${postId}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function repostPost(postId) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để chia sẻ.");
    }

    return apiFetch(`/posts/${postId}/repost/`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
}

export async function unrepostPost(postId) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để bỏ chia sẻ.");
    }

    return apiFetch(`/posts/${postId}/repost/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
}

export async function addComment(postId, commentBody) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để bình luận.");
    }

    return apiFetch(`/posts/${postId}/comments/`, {
        method: "POST",
        body: {
            content: commentBody,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}