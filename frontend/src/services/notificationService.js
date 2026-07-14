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

function getAuthHeaders() {
    const token = getAccessToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function getNotifications() {
    return apiFetch("/notifications/", {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

export async function getUnreadNotificationCount() {
    return apiFetch("/notifications/unread-count/", {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

export async function markNotificationAsRead(notificationId) {
    return apiFetch(`/notifications/${notificationId}/read/`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
}

export async function markAllNotificationsAsRead() {
    return apiFetch("/notifications/read-all/", {
        method: "POST",
        headers: getAuthHeaders(),
    });
}

export async function sharePost(postId) {
    return apiFetch(`/posts/${postId}/share/`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
}