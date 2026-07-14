import apiFetch from "../lib/api";

function normalizeApiList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

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

function extractApiErrorMessage(error) {
    const data = error?.data;

    if (typeof data?.detail === "string") {
        return data.detail;
    }

    if (typeof data?.database_error === "string") {
        return data.database_error;
    }

    if (typeof data?.server_error === "string") {
        return data.server_error;
    }

    const fieldNames = [
        "place_name",
        "category",
        "address",
        "latitude",
        "longitude",
        "description",
    ];

    for (const fieldName of fieldNames) {
        const fieldError = data?.[fieldName];

        if (Array.isArray(fieldError) && fieldError.length > 0) {
            return String(fieldError[0]);
        }

        if (typeof fieldError === "string") {
            return fieldError;
        }
    }

    return (
        error?.message ||
        "Không thể gửi đề xuất địa điểm."
    );
}

export async function getPlaces() {
    try {
        const data = await apiFetch(
            "/places/?status=open",
            {
                method: "GET",
            }
        );

        return normalizeApiList(data);
    } catch (error) {
        console.error("Get places error:", error);
        return [];
    }
}

export async function getCategories() {
    try {
        const data = await apiFetch(
            "/categories/",
            {
                method: "GET",
            }
        );

        return normalizeApiList(data);
    } catch (firstError) {
        console.warn(
            "Không gọi được /categories/, thử /places/categories/...",
            firstError
        );

        try {
            const data = await apiFetch(
                "/places/categories/",
                {
                    method: "GET",
                }
            );

            return normalizeApiList(data);
        } catch (secondError) {
            console.error(
                "Get categories error:",
                secondError
            );

            return [];
        }
    }
}

export async function getPlaceById(placeId) {
    return apiFetch(
        `/places/${placeId}/`,
        {
            method: "GET",
        }
    );
}

export async function searchPlaces(keyword) {
    const normalizedKeyword =
        String(keyword || "").trim();

    if (normalizedKeyword.length < 2) {
        return [];
    }

    const data = await apiFetch(
        `/places/?status=open&search=${encodeURIComponent(
            normalizedKeyword
        )}`,
        {
            method: "GET",
        }
    );

    return normalizeApiList(data);
}

export async function suggestPlace(placeData) {
    const token = getAccessToken();

    if (!token) {
        throw new Error(
            "Bạn cần đăng nhập để đề xuất địa điểm."
        );
    }

    try {
        return await apiFetch(
            "/places/suggest/",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: {
                    place_name: placeData.place_name,
                    category: placeData.category,
                    address: placeData.address,
                    latitude: placeData.latitude,
                    longitude: placeData.longitude,
                    description: placeData.description || "",
                },
            }
        );
    } catch (error) {
        console.error(
            "Suggest place API error:",
            error
        );

        throw new Error(
            extractApiErrorMessage(error)
        );
    }
}
