from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile


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
            return text.replace(prefix, "")

    return text


def get_default_avatar(username):
    return f"https://api.dicebear.com/7.x/identicon/svg?seed={username}"


def get_or_create_profile(user):
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={
            "full_name": "",
            "phone": "",
            "avatar_url": get_default_avatar(user.username),
            "role": "user",
            "status": "active",
            "created_at": timezone.now(),
            "updated_at": timezone.now(),
        }
    )

    return profile


def build_private_user_data(user):
    profile = get_or_create_profile(user)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": profile.full_name or "",
        "phone": profile.phone or "",
        "avatar_url": normalize_media_url(profile.avatar_url) or get_default_avatar(user.username),
        "role": profile.role or "user",
        "status": profile.status or "active",
    }


def build_public_user_data(user):
    profile = get_or_create_profile(user)

    return {
        "id": user.id,
        "username": user.username,
        "full_name": profile.full_name or "",
        "avatar_url": normalize_media_url(profile.avatar_url) or get_default_avatar(user.username),
        "status": profile.status or "active",
        "posts_count": user.posts.count(),
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data

    username = data.get("username", "").strip()
    password = data.get("password", "")
    email = data.get("email", "").strip()
    full_name = data.get("full_name", "")
    phone = data.get("phone", "")

    if not username or not password or not email:
        return Response(
            {
                "detail": "Vui lòng điền đầy đủ các trường bắt buộc (*)"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {
                "detail": f'❌ Tài khoản "{username}" đã có người sử dụng! Vui lòng chọn tên khác.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {
                "detail": "❌ Địa chỉ Email này đã được đăng ký tài khoản khác!"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            Profile.objects.create(
                user=user,
                full_name=full_name,
                phone=phone,
                avatar_url=get_default_avatar(username),
                role="user",
                status="active",
                created_at=timezone.now(),
                updated_at=timezone.now(),
            )

        return Response(
            {
                "success": True,
                "message": "🎉 Đăng ký tài khoản thành công!"
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as error:
        return Response(
            {
                "detail": f"Lỗi lưu dữ liệu PostgreSQL: {str(error)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    user = authenticate(
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {
                "detail": "❌ Tài khoản chưa đăng ký hoặc sai mật khẩu! Vui lòng kiểm tra lại."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": build_private_user_data(user),
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET", "PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def me_profile(request):
    user = request.user
    profile = get_or_create_profile(user)

    if request.method == "GET":
        return Response(
            build_private_user_data(user),
            status=status.HTTP_200_OK
        )

    data = request.data

    profile.full_name = data.get("full_name", profile.full_name)
    profile.phone = data.get("phone", profile.phone)

    if "avatar_url" in data:
        profile.avatar_url = normalize_media_url(
            data.get("avatar_url", profile.avatar_url)
        )

    profile.updated_at = timezone.now()
    profile.save()

    if "email" in data:
        email = data.get("email", "").strip()

        if email and User.objects.filter(email__iexact=email).exclude(id=user.id).exists():
            return Response(
                {
                    "detail": "Email này đã được tài khoản khác sử dụng."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user.email = email
        user.save()

    return Response(
        {
            "success": True,
            "user": build_private_user_data(user),
        },
        status=status.HTTP_200_OK
    )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile_legacy(request):
    return me_profile(request)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    user = request.user

    avatar = request.FILES.get("avatar")

    if not avatar:
        return Response(
            {
                "detail": "Vui lòng chọn ảnh đại diện."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not avatar.content_type.startswith("image/"):
        return Response(
            {
                "detail": "File tải lên phải là ảnh."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if avatar.size > 5 * 1024 * 1024:
        return Response(
            {
                "detail": "Ảnh không được vượt quá 5MB."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    profile = get_or_create_profile(user)

    extension = avatar.name.split(".")[-1].lower()
    safe_file_name = f"avatars/user_{user.id}_{int(timezone.now().timestamp())}.{extension}"

    file_name = default_storage.save(
        safe_file_name,
        ContentFile(avatar.read())
    )

    avatar_url = f"{settings.MEDIA_URL}{file_name}"

    profile.avatar_url = avatar_url
    profile.updated_at = timezone.now()
    profile.save()

    return Response(
        {
            "success": True,
            "user": build_private_user_data(user),
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_profile(request, username):
    try:
        user = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        return Response(
            {
                "detail": "Không tìm thấy người dùng."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        build_public_user_data(user),
        status=status.HTTP_200_OK
    )