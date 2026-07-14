import apiFetch from "../lib/api";

function getAccessToken() {
    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        null
    );
}

function authHeaders() {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getPublicProfile(username) {
    return apiFetch(`/users/${encodeURIComponent(username)}/`, {
        method: "GET",
        headers: authHeaders(),
    });
}

export async function getUserPosts(username) {
    return apiFetch(`/users/${encodeURIComponent(username)}/posts/`, {
        method: "GET",
        headers: authHeaders(),
    });
}

export async function getMyPosts() {
    return apiFetch("/my-posts/", {
        method: "GET",
        headers: authHeaders(),
    });
}
