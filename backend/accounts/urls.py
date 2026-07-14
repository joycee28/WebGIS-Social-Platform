from django.urls import path

from .views import (
    register_user,
    login_user,
    me_profile,
    update_profile_legacy,
    public_profile,
    upload_avatar,
)

urlpatterns = [
    path("auth/register/", register_user, name="register_api"),
    path("auth/login/", login_user, name="login_api"),

    path("me/", me_profile, name="me-profile"),
    path("user/profile/update/", update_profile_legacy, name="profile-update-legacy"),
    path("user/profile/avatar/", upload_avatar, name="profile-avatar-upload"),

    path("users/<str:username>/", public_profile, name="public-profile"),
]