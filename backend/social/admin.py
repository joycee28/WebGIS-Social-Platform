from django.contrib import admin

from .models import (
    Post,
    PostImage,
    PostLike,
    PostComment,
    PostCommentLike,
    Notification,
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "post_id",
        "user",
        "title",
        "place",
        "category_id",
        "location_name",
        "created_at",
    )

    search_fields = (
        "title",
        "content",
        "user__username",
        "location_name",
        "place__place_name",
    )

    list_filter = (
        "category_id",
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "post_id",
        "created_at",
    )


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = (
        "image_id",
        "post",
        "image_url",
        "created_at",
    )

    search_fields = (
        "post__title",
        "image_url",
        "caption",
    )

    ordering = (
        "-created_at",
    )


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = (
        "like_id",
        "post",
        "user",
        "created_at",
    )

    search_fields = (
        "post__title",
        "user__username",
    )

    ordering = (
        "-created_at",
    )


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = (
        "comment_id",
        "post",
        "user",
        "parent",
        "status",
        "created_at",
    )

    search_fields = (
        "comment",
        "post__title",
        "user__username",
    )

    list_filter = (
        "status",
        "created_at",
    )

    ordering = (
        "-created_at",
    )


@admin.register(PostCommentLike)
class PostCommentLikeAdmin(admin.ModelAdmin):
    list_display = (
        "comment_like_id",
        "comment",
        "user",
        "created_at",
    )

    search_fields = (
        "comment__comment",
        "user__username",
    )

    ordering = (
        "-created_at",
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "notification_id",
        "recipient",
        "actor",
        "type",
        "post",
        "comment",
        "is_read",
        "created_at",
    )

    search_fields = (
        "recipient__username",
        "actor__username",
        "post__title",
    )

    list_filter = (
        "type",
        "is_read",
        "created_at",
    )

    ordering = (
        "-created_at",
    )