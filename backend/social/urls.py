from django.urls import path
from . import views

urlpatterns = [
    # ==========================================
    # 📝 BÀI VIẾT (POST)
    # ==========================================
    path('posts/', views.PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:post_id>/', views.PostDetailView.as_view(), name='post-detail'),
    path('my-posts/', views.MyPostListView.as_view(), name='my-posts'),
    path('users/<str:username>/posts/', views.UserPostListView.as_view(), name='user-posts'),

    # ==========================================
    # 💬 BÌNH LUẬN (COMMENT)
    # ==========================================
    path('posts/<int:post_id>/comments/', views.PostCommentListCreateView.as_view(), name='post-comment-list-create'),
    path('comments/<int:comment_id>/', views.PostCommentDetailView.as_view(), name='post-comment-detail'),
    path('comments/<int:comment_id>/like/', views.PostCommentLikeToggleView.as_view(), name='comment-like-toggle'),

    # ==========================================
    # ❤️ THÍCH (LIKE)
    # ==========================================
    path('posts/<int:post_id>/like/', views.PostLikeToggleView.as_view(), name='post-like-toggle'),

    # ==========================================
    # 🔁 CHIA SẺ (SHARE)
    # ==========================================
    path('posts/<int:post_id>/share/', views.PostShareView.as_view(), name='post-share'),

    # ==========================================
    # 🖼️ HÌNH ẢNH (IMAGE)
    # ==========================================
    path('posts/<int:post_id>/images/', views.PostImageListCreateView.as_view(), name='post-image-list-create'),

    # ==========================================
    # 🔔 THÔNG BÁO (NOTIFICATION)
    # ==========================================
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread-count/', views.NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('notifications/<int:notification_id>/read/', views.NotificationMarkReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', views.NotificationMarkAllReadView.as_view(), name='notification-read-all'),
]