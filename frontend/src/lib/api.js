const RAW_API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "/api";

const API_BASE_URL =
    RAW_API_BASE_URL.replace(/\/+$/, "");

let refreshPromise = null;

function buildApiUrl(endpoint) {
    const normalizedEndpoint =
        String(endpoint || "");

    if (
        normalizedEndpoint.startsWith("http://") ||
        normalizedEndpoint.startsWith("https://")
    ) {
        return normalizedEndpoint;
    }

    return `${API_BASE_URL}${
        normalizedEndpoint.startsWith("/")
            ? normalizedEndpoint
            : `/${normalizedEndpoint}`
    }`;
}

function getStoredAccessToken() {
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

function getStoredRefreshToken() {
    const token =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refresh");

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

function clearAuthStorage() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("token");
    localStorage.removeItem("user_info");
}

function notifySessionExpired() {
    window.dispatchEvent(
        new CustomEvent(
            "auth:session-expired"
        )
    );
}

async function readResponseData(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        return response
            .json()
            .catch(() => null);
    }

    return response
        .text()
        .catch(() => null);
}

function createApiError(
    response,
    data
) {
    const detail =
        data?.detail ||
        data?.message ||
        (
            typeof data === "string"
                ? data
                : null
        );

    const error = new Error(
        detail ||
        `API Error: ${response.status}`
    );

    error.status = response.status;
    error.data = data;
    error.response = response;

    return error;
}

function isAuthenticationEndpoint(
    endpoint
) {
    const value =
        String(endpoint || "");

    return (
        value.includes("/auth/login/") ||
        value.includes("/auth/register/") ||
        value.includes("/token/refresh/")
    );
}

async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken =
        getStoredRefreshToken();

    if (!refreshToken) {
        throw new Error(
            "Không có refresh token."
        );
    }

    refreshPromise = (
        async () => {
            const response = await fetch(
                buildApiUrl(
                    "/token/refresh/"
                ),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        refresh:
                            refreshToken,
                    }),
                }
            );

            const data =
                await readResponseData(
                    response
                );

            if (
                !response.ok ||
                !data?.access
            ) {
                throw createApiError(
                    response,
                    data
                );
            }

            localStorage.setItem(
                "access_token",
                data.access
            );

            if (data.refresh) {
                localStorage.setItem(
                    "refresh_token",
                    data.refresh
                );
            }

            return data.access;
        }
    )();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

async function apiFetch(
    endpoint,
    options = {}
) {
    const {
        auth = true,
        retry = true,
        headers: customHeaders = {},
        body: originalBody,
        ...fetchOptions
    } = options;

    const headers =
        new Headers(customHeaders);

    const isFormData =
        originalBody instanceof FormData;

    let body = originalBody;

    if (auth) {
        const accessToken =
            getStoredAccessToken();

        if (
            accessToken &&
            !headers.has(
                "Authorization"
            )
        ) {
            headers.set(
                "Authorization",
                `Bearer ${accessToken}`
            );
        }
    }

    if (
        body !== undefined &&
        body !== null &&
        !isFormData &&
        typeof body === "object" &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer) &&
        !(body instanceof URLSearchParams)
    ) {
        body = JSON.stringify(body);

        if (
            !headers.has(
                "Content-Type"
            )
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );
        }
    }

    const response = await fetch(
        buildApiUrl(endpoint),
        {
            ...fetchOptions,
            headers,
            body,
        }
    );

    if (
        response.status === 401 &&
        auth &&
        retry &&
        !isAuthenticationEndpoint(
            endpoint
        )
    ) {
        try {
            const newAccessToken =
                await refreshAccessToken();

            headers.set(
                "Authorization",
                `Bearer ${newAccessToken}`
            );

            return apiFetch(
                endpoint,
                {
                    ...options,

                    retry: false,

                    headers:
                        Object.fromEntries(
                            headers.entries()
                        ),
                }
            );
        } catch (refreshError) {
            console.error(
                "Refresh token error:",
                refreshError
            );

            clearAuthStorage();
            notifySessionExpired();
        }
    }

    const data =
        await readResponseData(
            response
        );

    if (!response.ok) {
        throw createApiError(
            response,
            data
        );
    }

    return data;
}

export {
    API_BASE_URL,
    buildApiUrl,
    getStoredAccessToken,
    getStoredRefreshToken,
    clearAuthStorage,
    refreshAccessToken,
};

export default apiFetch;
