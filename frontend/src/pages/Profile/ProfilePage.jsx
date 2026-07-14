import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
    const { user, logout, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        phone: user?.phone || "",
        avatar_url: user?.avatar_url || "",
    });

    if (!user) {
        return <div style={{ padding: "20px", textAlign: "center" }}>Vui lòng đăng nhập để xem hồ sơ!</div>;
    }

    const handleSave = async () => {
        const res = await updateProfile(formData);
        if (res.success) {
            setIsEditing(false);
            alert("Cập nhật hồ sơ thành công!");
        }
    };

    return (
        <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                <img src={formData.avatar_url || "https://via.placeholder.com/100"} alt="Avatar" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1877f2" }} />
                <div>
                    <h2>{user.username}</h2>
                    <p style={{ color: "gray" }}>{user.email}</p>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                <label><b>Họ và tên:</b></label>
                {isEditing ? <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} /> : <p>{user.full_name || "Chưa cập nhật"}</p>}

                <label><b>Số điện thoại:</b></label>
                {isEditing ? <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} /> : <p>{user.phone || "Chưa cập nhật"}</p>}
                
                <label><b>Link ảnh đại diện:</b></label>
                {isEditing && <input type="text" value={formData.avatar_url} onChange={e => setFormData({...formData, avatar_url: e.target.value})} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
                {isEditing ? (
                    <>
                        <button onClick={handleSave} style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Lưu lại</button>
                        <button onClick={() => setIsEditing(false)} style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Hủy</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} style={{ padding: "10px 20px", backgroundColor: "#1877f2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Chỉnh sửa hồ sơ</button>
                )}
                <button onClick={logout} style={{ padding: "10px 20px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginLeft: "auto" }}>Đăng xuất</button>
            </div>
        </div>
    );
}