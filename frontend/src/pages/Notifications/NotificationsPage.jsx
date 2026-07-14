import "./NotificationsPage.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    CheckCheck,
    Heart,
    MessageCircle,
    Share2,
    ThumbsUp,
} from "lucide-react";

import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../../services/notificationService";

function getNotificationIcon(type) {
    if (type === "post_like") {
        return <Heart size={20} />;
    }

    if (type === "post_comment") {
        return <MessageCircle size={20} />;
    }

    if (type === "post_share") {
        return <Share2 size={20} />;
    }

    if (type === "comment_like") {
        return <ThumbsUp size={20} />;
    }

    return <Bell size={20} />;
}

function formatTime(value) {
    if (!value) {
        return "Vừa xong";
    }

    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function notifyNotificationCountChanged() {
    window.dispatchEvent(new Event("notifications-updated"));
}

function NotificationsPage() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    async function loadNotifications() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await getNotifications();

            const normalizedData = Array.isArray(data)
                ? data
                : data?.results || [];

            setNotifications(normalizedData);
        } catch (error) {
            console.error("Load notifications error:", error);
            setErrorMessage("Không thể tải thông báo. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, []);

    const unreadCount = useMemo(() => {
        return notifications.filter(
            notification => !notification.is_read
        ).length;
    }, [notifications]);

    async function handleNotificationClick(notification) {
        try {
            if (!notification.is_read) {
                await markNotificationAsRead(notification.notification_id);

                setNotifications(prevNotifications =>
                    prevNotifications.map(item =>
                        item.notification_id === notification.notification_id
                            ? {
                                  ...item,
                                  is_read: true,
                              }
                            : item
                    )
                );

                notifyNotificationCountChanged();
            }

            if (notification.post_id) {
                navigate(`/posts/${notification.post_id}`);
            }
        } catch (error) {
            console.error("Notification click error:", error);

            if (notification.post_id) {
                navigate(`/posts/${notification.post_id}`);
            }
        }
    }

    async function handleMarkAllRead() {
        try {
            await markAllNotificationsAsRead();

            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({
                    ...notification,
                    is_read: true,
                }))
            );

            notifyNotificationCountChanged();
        } catch (error) {
            console.error("Mark all notifications read error:", error);
        }
    }

    if (isLoading) {
        return (
            <main className="notifications-page">
                <div className="notifications-page__state">
                    Đang tải thông báo...
                </div>
            </main>
        );
    }

    return (
        <main className="notifications-page">
            <section className="notifications-page__header">
                <div>
                    <h1>Thông báo</h1>
                    <p>
                        {unreadCount > 0
                            ? `Bạn có ${unreadCount} thông báo chưa đọc`
                            : "Bạn đã đọc hết thông báo"}
                    </p>
                </div>

                {notifications.length > 0 && (
                    <button
                        type="button"
                        className="notifications-page__read-all"
                        onClick={handleMarkAllRead}
                    >
                        <CheckCheck size={18} />
                        <span>Đánh dấu tất cả đã đọc</span>
                    </button>
                )}
            </section>

            {errorMessage && (
                <div className="notifications-page__state notifications-page__state--error">
                    {errorMessage}
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="notifications-page__empty">
                    <Bell size={32} />
                    <h2>Chưa có thông báo</h2>
                    <p>
                        Chưa có thông báo nào mới.
                    </p>
                </div>
            ) : (
                <section className="notifications-page__list">
                    {notifications.map(notification => (
                        <button
                            type="button"
                            key={notification.notification_id}
                            className={
                                notification.is_read
                                    ? "notification-item"
                                    : "notification-item notification-item--unread"
                            }
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-item__icon">
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="notification-item__content">
                                <div className="notification-item__top">
                                    <p>{notification.message}</p>

                                    {!notification.is_read && (
                                        <span className="notification-item__dot" />
                                    )}
                                </div>

                                {notification.post_title && (
                                    <span className="notification-item__post">
                                        Bài viết: {notification.post_title}
                                    </span>
                                )}

                                <span className="notification-item__time">
                                    {formatTime(notification.created_at)}
                                </span>
                            </div>
                        </button>
                    ))}
                </section>
            )}
        </main>
    );
}

export default NotificationsPage;