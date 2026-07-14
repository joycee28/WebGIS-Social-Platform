from datetime import timezone as datetime_timezone
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from places.models import Category, Place

from .models import Notification, Post, PostComment, PostImage


IMAGE_EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
}

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".heif",
}

MAX_IMAGE_SIZE = 15 * 1024 * 1024


def normalize_media_url(value):
    if not value:
        return value

    text = str(value)

    if text.startswith("/media/"):
        return text

    prefixes = [
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://127.0.0.1:8000",
        "https://localhost:8000",
    ]

    for prefix in prefixes:
        if text.startswith(f"{prefix}/media/"):
            return text.replace(prefix, "", 1)

    return text


def get_upload_extension(upload_file):
    extension = Path(upload_file.name or "").suffix.lower()

    if extension:
        return extension

    content_type = (upload_file.content_type or "").lower()
    return IMAGE_EXTENSION_BY_MIME.get(content_type, "")


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = [
            "image_id",
            "post",
            "image_url",
            "caption",
            "created_at",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["image_url"] = normalize_media_url(
            representation.get("image_url")
        )
        return representation


class PostSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(
        read_only=True,
        default_timezone=datetime_timezone.utc,
    )

    id = serializers.IntegerField(
        source="post_id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    avatar_url = serializers.SerializerMethodField()

    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    isLiked = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    category_name = serializers.SerializerMethodField()
    category_code = serializers.SerializerMethodField()

    images = PostImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "post_id",
            "username",
            "avatar_url",
            "place",
            "category_id",
            "category_name",
            "category_code",
            "title",
            "content",
            "latitude",
            "longitude",
            "location_name",
            "created_at",
            "likes_count",
            "comments_count",
            "isLiked",
            "is_liked",
            "images",
        ]

        read_only_fields = [
            "id",
            "post_id",
            "username",
            "avatar_url",
            "created_at",
            "likes_count",
            "comments_count",
            "isLiked",
            "is_liked",
            "category_name",
            "category_code",
            "images",
        ]

    def get_avatar_url(self, obj):
        try:
            profile = getattr(obj.user, "profile", None)

            if profile and profile.avatar_url:
                return normalize_media_url(profile.avatar_url)
        except Exception:
            pass

        return (
            "https://api.dicebear.com/7.x/identicon/svg"
            f"?seed={obj.user.username}"
        )

    def get_likes_count(self, obj):
        try:
            return obj.likes.count()
        except AttributeError:
            return 0

    def get_comments_count(self, obj):
        try:
            return obj.comments.count()
        except AttributeError:
            return 0

    def get_isLiked(self, obj):
        request = self.context.get("request")

        if not request:
            return False

        user = request.user

        if not user or not user.is_authenticated:
            return False

        return obj.likes.filter(user=user).exists()

    def get_is_liked(self, obj):
        return self.get_isLiked(obj)

    def get_category_name(self, obj):
        if not obj.category_id:
            return None

        category = Category.objects.filter(
            category_id=obj.category_id
        ).first()

        if not category:
            return None

        return category.category_name

    def get_category_code(self, obj):
        if not obj.category_id:
            return None

        category = Category.objects.filter(
            category_id=obj.category_id
        ).first()

        if not category:
            return None

        return category.category_code

    def to_internal_value(self, data):
        internal_data = (
            data.copy()
            if hasattr(data, "copy")
            else dict(data)
        )

        if "place" in internal_data:
            value = internal_data["place"]

            import json

            if isinstance(value, str) and value.startswith("{"):
                try:
                    value = json.loads(value)
                except Exception:
                    pass

            if isinstance(value, dict):
                place_name = (
                    value.get("name")
                    or value.get("place_name")
                )

                if (
                    place_name
                    and not internal_data.get("location_name")
                ):
                    internal_data["location_name"] = place_name

                if place_name:
                    place_obj = Place.objects.filter(
                        place_name__iexact=place_name
                    ).first()

                    internal_data["place"] = (
                        place_obj.pk
                        if place_obj
                        else None
                    )
                else:
                    internal_data["place"] = None

            elif value in ("", "null", None):
                internal_data["place"] = None

        return super().to_internal_value(internal_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation["avatar_url"] = normalize_media_url(
            representation.get("avatar_url")
        )

        if instance.place:
            place_name = getattr(
                instance.place,
                "place_name",
                str(instance.place),
            )

            representation["place"] = {
                "place_id": getattr(
                    instance.place,
                    "place_id",
                    None,
                ),
                "name": place_name,
                "category": getattr(
                    instance.place,
                    "category_id",
                    None,
                ),
                "category_id": getattr(
                    instance.place,
                    "category_id",
                    None,
                ),
                "category_name": (
                    instance.place.category.category_name
                    if getattr(instance.place, "category", None)
                    else None
                ),
            }

            if not representation.get("location_name"):
                representation["location_name"] = place_name
        else:
            representation["place"] = None

        return representation

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")

        upload_files = []

        if request and request.FILES:
            upload_files = request.FILES.getlist("images")

        for upload_file in upload_files:
            extension = get_upload_extension(upload_file)
            content_type = (
                upload_file.content_type or ""
            ).lower()

            is_supported_extension = (
                extension in ALLOWED_IMAGE_EXTENSIONS
            )

            is_supported_content_type = (
                content_type.startswith("image/")
                or not content_type
            )

            if (
                not is_supported_extension
                or not is_supported_content_type
            ):
                raise serializers.ValidationError({
                    "images": (
                        "Chỉ hỗ trợ ảnh JPG, JPEG, PNG, "
                        "WEBP, GIF, HEIC hoặc HEIF."
                    )
                })

            if upload_file.size > MAX_IMAGE_SIZE:
                raise serializers.ValidationError({
                    "images": (
                        "Dung lượng mỗi ảnh không được vượt quá 15 MB."
                    )
                })

        if not validated_data.get("created_at"):
            validated_data["created_at"] = timezone.now()

        post = Post.objects.create(**validated_data)
        saved_file_names = []

        try:
            for upload_file in upload_files:
                extension = get_upload_extension(upload_file)
                safe_file_name = (
                    f"posts/{uuid4().hex}{extension}"
                )

                stored_file_name = default_storage.save(
                    safe_file_name,
                    upload_file,
                )

                saved_file_names.append(stored_file_name)

                media_prefix = settings.MEDIA_URL.rstrip("/")
                image_url = (
                    f"{media_prefix}/"
                    f"{stored_file_name.lstrip('/')}"
                )

                PostImage.objects.create(
                    post=post,
                    image_url=image_url,
                    created_at=timezone.now(),
                )

            return post

        except serializers.ValidationError:
            raise

        except Exception as error:
            for stored_file_name in saved_file_names:
                try:
                    default_storage.delete(stored_file_name)
                except Exception:
                    pass

            raise serializers.ValidationError({
                "images": (
                    "Không thể lưu ảnh lên hệ thống. "
                    "Vui lòng chọn ảnh khác hoặc thử lại."
                )
            }) from error


class PostCommentSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(
        read_only=True,
        default_timezone=datetime_timezone.utc,
    )

    id = serializers.IntegerField(
        source="comment_id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    author = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    parent = serializers.PrimaryKeyRelatedField(
        queryset=PostComment.objects.all(),
        required=False,
        allow_null=True,
    )

    parent_id = serializers.IntegerField(
        source="parent.comment_id",
        read_only=True,
    )

    content = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    likes_count = serializers.SerializerMethodField()
    isLiked = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    replies = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = [
            "id",
            "comment_id",
            "username",
            "author",
            "parent",
            "parent_id",
            "comment",
            "content",
            "status",
            "created_at",
            "timestamp",
            "likes_count",
            "isLiked",
            "is_liked",
            "replies",
        ]

        read_only_fields = [
            "id",
            "comment_id",
            "username",
            "author",
            "parent_id",
            "status",
            "created_at",
            "timestamp",
            "likes_count",
            "isLiked",
            "is_liked",
            "replies",
        ]

    def to_internal_value(self, data):
        internal_data = (
            data.copy()
            if hasattr(data, "copy")
            else dict(data)
        )

        if (
            "content" in internal_data
            and "comment" not in internal_data
        ):
            internal_data["comment"] = internal_data.get(
                "content"
            )

        return super().to_internal_value(internal_data)

    def get_content(self, obj):
        return obj.comment or ""

    def get_timestamp(self, obj):
        if not obj.created_at:
            return "Vừa xong"

        created_at = obj.created_at

        if timezone.is_naive(created_at):
            created_at = timezone.make_aware(
                created_at,
                datetime_timezone.utc,
            )

        return timezone.localtime(created_at).strftime(
            "%d/%m/%Y %H:%M"
        )

    def get_likes_count(self, obj):
        try:
            return obj.likes.count()
        except Exception:
            return 0

    def get_isLiked(self, obj):
        request = self.context.get("request")

        if not request:
            return False

        user = request.user

        if not user or not user.is_authenticated:
            return False

        try:
            return obj.likes.filter(user=user).exists()
        except Exception:
            return False

    def get_is_liked(self, obj):
        return self.get_isLiked(obj)

    def get_replies(self, obj):
        replies = obj.replies.filter(
            status="active"
        ).order_by("created_at")

        return PostCommentSerializer(
            replies,
            many=True,
            context=self.context,
        ).data


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(
        source="actor.username",
        read_only=True,
    )

    recipient_username = serializers.CharField(
        source="recipient.username",
        read_only=True,
    )

    post_title = serializers.CharField(
        source="post.title",
        read_only=True,
    )

    post_id = serializers.IntegerField(
        source="post.post_id",
        read_only=True,
    )

    comment_id = serializers.IntegerField(
        source="comment.comment_id",
        read_only=True,
    )

    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "actor_username",
            "recipient_username",
            "type",
            "post_id",
            "post_title",
            "comment_id",
            "is_read",
            "created_at",
            "message",
        ]

    def get_message(self, obj):
        actor = obj.actor.username

        if obj.type == "post_like":
            return f"{actor} đã thả tim bài viết của bạn"

        if obj.type == "post_comment":
            return f"{actor} đã bình luận về bài viết của bạn"

        if obj.type == "post_share":
            return f"{actor} đã chia sẻ bài viết của bạn"

        if obj.type == "comment_like":
            return f"{actor} đã thả tim bình luận của bạn"

        if obj.type == "comment_reply":
            return f"{actor} đã trả lời bình luận của bạn"

        return f"{actor} đã tương tác với bạn"
