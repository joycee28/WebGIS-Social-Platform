import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import apiFetch, {
    clearAuthStorage,
    getStoredAccessToken,
    getStoredRefreshToken,
} from "../lib/api";

const AuthContext = createContext({
    user: null,
    isLoading: true,

    login: async () => ({
        success: false,
    }),

    register: async () => ({
        success: false,
    }),

    logout: () => {},

    refreshUser: async () => null,

    updateProfile: async () => ({
        success: false,
    }),

    updateAvatar: async () => ({
        success: false,
    }),
});

function extractErrorMessage(error, fallbackMessage) {
    const data = error?.data;

    if (typeof data?.detail === "string") {
        return data.detail;
    }

    if (typeof data?.message === "string") {
        return data.message;
    }

    if (typeof data === "string") {
        return data;
    }

    if (
        error?.message &&
        !error.message.startsWith("API Error:")
    ) {
        return error.message;
    }

    return fallbackMessage;
}

function parseStoredUser() {
    const savedUser =
        localStorage.getItem("user_info");

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch {
        localStorage.removeItem("user_info");
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] =
        useState(true);

    const saveUser = useCallback((nextUser) => {
        if (!nextUser) {
            setUser(null);
            localStorage.removeItem("user_info");
            return;
        }

        setUser(nextUser);

        localStorage.setItem(
            "user_info",
            JSON.stringify(nextUser)
        );
    }, []);

    const logout = useCallback(() => {
        clearAuthStorage();
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const data = await apiFetch("/me/", {
                method: "GET",
            });

            const nextUser = data?.user || data;

            saveUser(nextUser);

            return nextUser;
        } catch (error) {
            console.error(
                "Load current user error:",
                error
            );

            logout();
            return null;
        }
    }, [logout, saveUser]);

    useEffect(() => {
        let isMounted = true;

        function handleSessionExpired() {
            if (isMounted) {
                setUser(null);
            }
        }

        window.addEventListener(
            "auth:session-expired",
            handleSessionExpired
        );

        async function restoreSession() {
            const accessToken =
                getStoredAccessToken();

            const refreshToken =
                getStoredRefreshToken();

            const savedUser =
                parseStoredUser();

            if (savedUser && isMounted) {
                setUser(savedUser);
            }

            if (!accessToken && !refreshToken) {
                clearAuthStorage();

                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }

                return;
            }

            try {
                const data = await apiFetch("/me/", {
                    method: "GET",
                });

                const currentUser =
                    data?.user || data;

                if (isMounted) {
                    saveUser(currentUser);
                }
            } catch (error) {
                console.error(
                    "Restore auth error:",
                    error
                );

                clearAuthStorage();

                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            isMounted = false;

            window.removeEventListener(
                "auth:session-expired",
                handleSessionExpired
            );
        };
    }, [saveUser]);

    const login = useCallback(
        async (username, password) => {
            const cleanUsername = String(
                username || ""
            ).trim();

            if (!cleanUsername) {
                return {
                    success: false,
                    message:
                        "Vui lòng nhập tên tài khoản.",
                };
            }

            if (!password) {
                return {
                    success: false,
                    message:
                        "Vui lòng nhập mật khẩu.",
                };
            }

            try {
                const data = await apiFetch(
                    "/auth/login/",
                    {
                        method: "POST",
                        auth: false,
                        retry: false,

                        body: {
                            username: cleanUsername,
                            password,
                        },
                    }
                );

                if (!data?.access) {
                    return {
                        success: false,
                        message:
                            "Backend không trả access token.",
                    };
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

                saveUser(data.user);

                return {
                    success: true,
                    user: data.user,
                };
            } catch (error) {
                return {
                    success: false,
                    message: extractErrorMessage(
                        error,
                        "Không thể đăng nhập."
                    ),
                };
            }
        },
        [saveUser]
    );

    const register = useCallback(
        async (registerData) => {
            try {
                const data = await apiFetch(
                    "/auth/register/",
                    {
                        method: "POST",
                        auth: false,
                        retry: false,
                        body: registerData,
                    }
                );

                return {
                    success: true,
                    message:
                        data?.message ||
                        "Đăng ký thành công.",
                };
            } catch (error) {
                return {
                    success: false,
                    message: extractErrorMessage(
                        error,
                        "Không thể đăng ký tài khoản."
                    ),
                };
            }
        },
        []
    );

    const updateProfile = useCallback(
        async (updatedData) => {
            if (
                !getStoredAccessToken() &&
                !getStoredRefreshToken()
            ) {
                return {
                    success: false,
                    message:
                        "Bạn chưa đăng nhập.",
                };
            }

            try {
                const data = await apiFetch(
                    "/me/",
                    {
                        method: "PATCH",
                        body: updatedData,
                    }
                );

                const nextUser =
                    data?.user || data;

                saveUser(nextUser);

                return {
                    success: true,
                    user: nextUser,
                };
            } catch (error) {
                return {
                    success: false,
                    message: extractErrorMessage(
                        error,
                        "Cập nhật hồ sơ thất bại."
                    ),
                };
            }
        },
        [saveUser]
    );

    const updateAvatar = useCallback(
        async (file) => {
            if (!file) {
                return {
                    success: false,
                    message:
                        "Vui lòng chọn ảnh đại diện.",
                };
            }

            if (
                !getStoredAccessToken() &&
                !getStoredRefreshToken()
            ) {
                return {
                    success: false,
                    message:
                        "Bạn chưa đăng nhập.",
                };
            }

            const formData = new FormData();

            formData.append("avatar", file);

            try {
                const data = await apiFetch(
                    "/user/profile/avatar/",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                const nextUser =
                    data?.user || data;

                saveUser(nextUser);

                return {
                    success: true,
                    user: nextUser,
                };
            } catch (error) {
                return {
                    success: false,
                    message: extractErrorMessage(
                        error,
                        "Cập nhật ảnh đại diện thất bại."
                    ),
                };
            }
        },
        [saveUser]
    );

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
                updateProfile,
                updateAvatar,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth phải được sử dụng bên trong AuthProvider."
        );
    }

    return context;
}

export default AuthContext;
