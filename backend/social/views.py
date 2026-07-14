from django.utils import timezone
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAuthenticatedOrReadOnly
)

from .models import (
    Post,
    PostComment,
    PostLike,
    PostImage,
    PostCommentLike,
    Notification,
)

from .serializers import (
    PostSerializer,
    PostCommentSerializer,
    PostImageSerializer,
    NotificationSerializer,
)


# ==============================================================================
# HELPER: CREATE NOTIFICATION
# ==============================================================================

def create_notification(
    recipient,
    actor,
    notification_type,
    post=None,
    comment=None,
    allow_duplicate=False
):
    if not recipient or not actor:
        return None

    # Không tự thông báo cho chính mình
    if recipient.id == actor.id:
        return None

    # Tránh tạo trùng thông báo like nhiều lần
    if not allow_duplicate:
        existing = Notification.objects.filter(
            recipient=recipient,
            actor=actor,
            type=notification_type,
            post=post,
            comment=comment,
        ).first()

        if existing:
            return existing

    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        type=notification_type,
        post=post,
        comment=comment,
        is_read=False,
        created_at=timezone.now()
    )


# ==============================================================================
# POSTS
# ==============================================================================

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by("-created_at")
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            created_at=timezone.now()
        )


class PostDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "post_id"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def update(self, request, *args, **kwargs):
        post = self.get_object()

        if post.user_id != request.user.id:
            return Response(
                {
                    "detail": (
                        "Bạn chỉ được chỉnh sửa "
                        "bài viết của chính mình."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop(
            "partial",
            False
        )

        serializer = self.get_serializer(
            post,
            data=request.data,
            partial=partial
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()

        if post.user_id != request.user.id:
            return Response(
                {
                    "detail": "Bạn chỉ được xóa bài viết của chính mình."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        deleted_post_id = post.post_id
        post.delete()

        return Response(
            {
                "success": True,
                "deleted_post_id": deleted_post_id,
                "message": "Đã xóa bài viết thành công."
            },
            status=status.HTTP_200_OK
        )


class MyPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        return Post.objects.filter(
            user=self.request.user
        ).order_by("-created_at")


class UserPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        username = self.kwargs.get("username")

        user = get_object_or_404(
            User,
            username__iexact=username
        )

        return Post.objects.filter(
            user=user
        ).order_by("-created_at")


# ==============================================================================
# COMMENTS
# ==============================================================================

class PostCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = PostCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        return PostComment.objects.filter(
            post_id=self.kwargs["post_id"],
            parent__isnull=True,
            status="active"
        ).order_by("-created_at")

    def perform_create(self, serializer):
        post = Post.objects.get(
            post_id=self.kwargs["post_id"]
        )

        parent = serializer.validated_data.get(
            "parent",
            None
        )

        if parent and parent.post_id != post.post_id:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({
                "parent": "Bình luận cha không thuộc bài viết này."
            })

        comment = serializer.save(
            user=self.request.user,
            post=post,
            created_at=timezone.now()
        )

        if parent:
            # Trả lời bình luận:
            # gửi thông báo cho người viết bình luận được trả lời.
            create_notification(
                recipient=parent.user,
                actor=self.request.user,
                notification_type="comment_reply",
                post=post,
                comment=comment,
                allow_duplicate=True
            )
        else:
            # Bình luận trực tiếp vào bài viết:
            # gửi thông báo cho chủ bài viết.
            create_notification(
                recipient=post.user,
                actor=self.request.user,
                notification_type="post_comment",
                post=post,
                comment=comment,
                allow_duplicate=True
            )


class PostCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PostComment.objects.all()
    serializer_class = PostCommentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "comment_id"


class PostCommentLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        try:
            comment = PostComment.objects.get(
                comment_id=comment_id
            )
        except PostComment.DoesNotExist:
            return Response(
                {"error": "Comment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        like = PostCommentLike.objects.filter(
            comment=comment,
            user=request.user
        ).first()

        if like:
            like.delete()
            liked = False
        else:
            PostCommentLike.objects.create(
                comment=comment,
                user=request.user,
                created_at=timezone.now()
            )
            liked = True

            create_notification(
                recipient=comment.user,
                actor=request.user,
                notification_type="comment_like",
                post=comment.post,
                comment=comment
            )

        return Response(
            {
                "liked": liked,
                "likes_count": comment.likes.count()
            }
        )


# ==============================================================================
# LIKES
# ==============================================================================

class PostLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(
                post_id=post_id
            )
        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        like = PostLike.objects.filter(
            post=post,
            user=request.user
        ).first()

        if like:
            like.delete()
            liked = False
        else:
            PostLike.objects.create(
                post=post,
                user=request.user,
                created_at=timezone.now()
            )
            liked = True

            create_notification(
                recipient=post.user,
                actor=request.user,
                notification_type="post_like",
                post=post
            )

        return Response(
            {
                "liked": liked,
                "likes_count": post.likes.count()
            }
        )


# ==============================================================================
# SHARE
# ==============================================================================

class PostShareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(
                post_id=post_id
            )
        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        create_notification(
            recipient=post.user,
            actor=request.user,
            notification_type="post_share",
            post=post,
            allow_duplicate=True
        )

        return Response({
            "success": True,
            "message": "Đã ghi nhận chia sẻ bài viết"
        })


# ==============================================================================
# IMAGES
# ==============================================================================

class PostImageListCreateView(generics.ListCreateAPIView):
    serializer_class = PostImageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return PostImage.objects.filter(
            post_id=self.kwargs["post_id"]
        )

    def perform_create(self, serializer):
        post = Post.objects.get(
            post_id=self.kwargs["post_id"]
        )

        serializer.save(
            post=post,
            created_at=timezone.now()
        )


# ==============================================================================
# NOTIFICATIONS
# ==============================================================================

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        return Response({
            "unread_count": count
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                notification_id=notification_id,
                recipient=request.user
            )
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.is_read = True
        notification.save()

        return Response({
            "success": True
        })


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)

        return Response({
            "success": True
        })