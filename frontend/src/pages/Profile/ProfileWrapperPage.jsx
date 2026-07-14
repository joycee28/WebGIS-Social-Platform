import React, {
    useRef,
    useState,
} from "react";

import { useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const DEFAULT_AVATAR =
    "https://api.dicebear.com/7.x/identicon/svg?seed=WebGIS";

export default function ProfileWrapperPage() {
    const location = useLocation();

    const {
        user,
        login,
        logout,
        updateProfile,
        updateAvatar,
    } = useAuth();

    const avatarInputRef = useRef(null);

    const [authMode, setAuthMode] = useState(
        location.state?.authMode === "login"
            ? "login"
            : "register"
    );
    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || "",
        phone: user?.phone || "",
        avatar_url: user?.avatar_url || "",
        role: user?.role || "",
        status: user?.status || "",
    });

    React.useEffect(() => {
        if (user) {
            setProfileData({
                full_name: user.full_name || "",
                phone: user.phone || "",
                avatar_url: user.avatar_url || "",
                role: user.role || "",
                status: user.status || "",
            });
        }
    }, [user]);

    React.useEffect(() => {
        if (user) {
            return;
        }

        const requestedMode =
            location.state?.authMode;

        if (
            requestedMode === "login" ||
            requestedMode === "register"
        ) {
            setAuthMode(requestedMode);
        }
    }, [
        user,
        location.state,
    ]);

    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        setMessage({
            type: "",
            text: "",
        });

        const res = await login(username, password);

        if (!res.success) {
            setMessage({
                type: "error",
                text: res.message,
            });
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        setMessage({
            type: "",
            text: "",
        });

        if (password !== confirmPassword) {
            setMessage({
                type: "error",
                text: "❌ Mật khẩu nhập lại không trùng khớp",
            });
            return;
        }

        try {
            const response = await fetch("/api/auth/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                    email,
                    full_name: fullName,
                    phone,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: "Đăng ký thành công. Bạn có thể chuyển sang đăng nhập.",
                });

                setConfirmPassword("");
                setAuthMode("login");
            } else {
                setMessage({
                    type: "error",
                    text: data.detail || "Đăng ký thất bại, vui lòng thử lại!",
                });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "Không thể kết nối server.",
            });
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn đúng file ảnh.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Ảnh không được vượt quá 5MB.");
            event.target.value = "";
            return;
        }

        setIsUploadingAvatar(true);

        const res = await updateAvatar(file);

        setIsUploadingAvatar(false);

        if (res.success) {
            setProfileData((prev) => ({
                ...prev,
                avatar_url: res.user.avatar_url,
            }));

            alert("Đã cập nhật ảnh đại diện!");
        } else {
            alert(res.message);
        }

        event.target.value = "";
    };

    const handleSaveProfile = async () => {
        const res = await updateProfile({
            full_name: profileData.full_name,
            phone: profileData.phone,
        });

        if (res.success) {
            setIsEditing(false);
            alert("Đã cập nhật thay đổi!");
        } else {
            alert(res.message);
        }
    };

    if (!user) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "calc(100vh - 100px)",
                    width: "100%",
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "520px",
                        padding: "35px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        backgroundColor: "#fff",
                        boxShadow:
                            "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            borderBottom: "2px solid #f1f5f9",
                            marginBottom: "25px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode("register");
                                setMessage({
                                    type: "",
                                    text: "",
                                });
                            }}
                            style={{
                                flex: 1,
                                padding: "12px",
                                border: "none",
                                background: "none",
                                fontSize: "16px",
                                fontWeight: "700",
                                color: authMode === "register" ? "#1877f2" : "#64748b",
                                borderBottom:
                                    authMode === "register"
                                        ? "3px solid #1877f2"
                                        : "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Đăng ký
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode("login");
                                setMessage({
                                    type: "",
                                    text: "",
                                });
                            }}
                            style={{
                                flex: 1,
                                padding: "12px",
                                border: "none",
                                background: "none",
                                fontSize: "16px",
                                fontWeight: "700",
                                color: authMode === "login" ? "#1877f2" : "#64748b",
                                borderBottom:
                                    authMode === "login"
                                        ? "3px solid #1877f2"
                                        : "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Đăng nhập
                        </button>
                    </div>

                    {message.text && (
                        <div
                            style={{
                                color:
                                    message.type === "error"
                                        ? "#df2e38"
                                        : "#22c55e",
                                backgroundColor:
                                    message.type === "error"
                                        ? "#fef2f2"
                                        : "#f0fdf4",
                                padding: "12px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                textAlign: "center",
                                fontWeight: "500",
                                marginBottom: "20px",
                                border:
                                    message.type === "error"
                                        ? "1px solid #fee2e2"
                                        : "1px solid #dcfce7",
                            }}
                        >
                            {message.text}
                        </div>
                    )}

                    {authMode === "register" ? (
                        <form
                            onSubmit={handleRegisterSubmit}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            <div>
                                <label style={labelStyle}>Tên tài khoản *</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: phuothu01..."
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input
                                    type="email"
                                    placeholder="Nhập email của bạn..."
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Mật khẩu *</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Tối thiểu 6 ký tự..."
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        required
                                        style={{
                                            ...inputStyle,
                                            paddingRight: "45px",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        style={eyeButtonStyle}
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Nhập lại mật khẩu *</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Xác nhận lại mật khẩu..."
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        required
                                        style={{
                                            ...inputStyle,
                                            paddingRight: "45px",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword((prev) => !prev)
                                        }
                                        style={eyeButtonStyle}
                                    >
                                        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Họ và tên</label>
                                <input
                                    type="text"
                                    placeholder="Nhập họ tên đầy đủ..."
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Số điện thoại</label>
                                <input
                                    type="text"
                                    placeholder="Nhập số điện thoại của bạn..."
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    padding: "12px",
                                    backgroundColor: "#28a745",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    marginTop: "10px",
                                }}
                            >
                                Tạo tài khoản mới
                            </button>
                        </form>
                    ) : (
                        <form
                            onSubmit={handleLoginSubmit}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            <div>
                                <label style={labelStyle}>Tên đăng nhập</label>
                                <input
                                    type="text"
                                    placeholder="Nhập tên tài khoản..."
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Mật khẩu</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu..."
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        required
                                        style={{
                                            ...inputStyle,
                                            paddingRight: "45px",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        style={eyeButtonStyle}
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    padding: "12px",
                                    backgroundColor: "#1877f2",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    marginTop: "10px",
                                }}
                            >
                                Xác nhận đăng nhập
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                padding: "30px",
                maxWidth: "650px",
                margin: "20px auto",
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e0e0e0",
            }}
        >
            <h2
                style={{
                    marginBottom: "20px",
                    color: "#333",
                    fontWeight: "700",
                }}
            >
                Hồ sơ cá nhân
            </h2>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "25px",
                    paddingBottom: "20px",
                    borderBottom: "1px solid #f0f0f0",
                    marginBottom: "25px",
                }}
            >
                <div style={{ position: "relative" }}>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                    />

                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        style={{
                            width: "96px",
                            height: "96px",
                            borderRadius: "50%",
                            border: "3px solid #1877f2",
                            padding: 0,
                            overflow: "hidden",
                            cursor: "pointer",
                            position: "relative",
                            background: "#f1f5f9",
                        }}
                        title="Bấm để đổi ảnh đại diện"
                    >
                        <img
                            src={
                                profileData.avatar_url ||
                                user.avatar_url ||
                                DEFAULT_AVATAR
                            }
                            alt="Avatar"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />

                        <span
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                padding: "5px 0",
                                background: "rgba(0,0,0,0.55)",
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: "700",
                            }}
                        >
                            {isUploadingAvatar ? "Đang tải..." : "📷 Đổi ảnh"}
                        </span>
                    </button>
                </div>

                <div>
                    <h3
                        style={{
                            margin: "0 0 6px 0",
                            fontSize: "22px",
                        }}
                    >
                        {user.username}
                    </h3>

                    <p
                        style={{
                            margin: 0,
                            color: "#666",
                            fontSize: "14px",
                        }}
                    >
                        📧 {user.email || "Chưa có email"}
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    marginBottom: "30px",
                }}
            >
                <div>
                    <label style={profileLabelStyle}>Họ và tên đầy đủ</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={profileData.full_name}
                            onChange={(event) =>
                                setProfileData({
                                    ...profileData,
                                    full_name: event.target.value,
                                })
                            }
                            style={profileInputStyle}
                        />
                    ) : (
                        <p style={profileViewStyle}>
                            {user.full_name || "Trống"}
                        </p>
                    )}
                </div>

                <div>
                    <label style={profileLabelStyle}>Số điện thoại</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={profileData.phone}
                            onChange={(event) =>
                                setProfileData({
                                    ...profileData,
                                    phone: event.target.value,
                                })
                            }
                            style={profileInputStyle}
                        />
                    ) : (
                        <p style={profileViewStyle}>
                            {user.phone || "Trống"}
                        </p>
                    )}
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <label style={profileLabelStyle}>Vai trò (Role)</label>
                        <p
                            style={{
                                margin: 0,
                                padding: "10px",
                                backgroundColor: "#e3f2fd",
                                borderRadius: "6px",
                                color: "#0d47a1",
                                fontWeight: "500",
                            }}
                        >
                            {user.role || "user"}
                        </p>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={profileLabelStyle}>Trạng thái (Status)</label>
                        <p
                            style={{
                                margin: 0,
                                padding: "10px",
                                backgroundColor: "#e8f5e9",
                                borderRadius: "6px",
                                color: "#1b5e20",
                                fontWeight: "500",
                            }}
                        >
                            {user.status || "active"}
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    borderTop: "1px solid #f0f0f0",
                    paddingTop: "20px",
                }}
            >
                {isEditing ? (
                    <>
                        <button
                            type="button"
                            onClick={handleSaveProfile}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#28a745",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
                        >
                            Lưu
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setProfileData({
                                    full_name: user.full_name || "",
                                    phone: user.phone || "",
                                    avatar_url: user.avatar_url || "",
                                    role: user.role || "",
                                    status: user.status || "",
                                });
                            }}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#6c757d",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
                        >
                            Hủy bỏ
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#1877f2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                        }}
                    >
                        Chỉnh sửa hồ sơ
                    </button>
                )}

                <button
                    type="button"
                    onClick={logout}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        marginLeft: "auto",
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    display: "block",
    marginBottom: "6px",
    color: "#334155",
};

const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
};

const eyeButtonStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    color: "#64748b",
    padding: 0,
};

const profileLabelStyle = {
    display: "block",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#555",
};

const profileInputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
};

const profileViewStyle = {
    margin: 0,
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
};