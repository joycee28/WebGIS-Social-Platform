from django.contrib import admin
from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('profile_id', 'user', 'full_name', 'phone', 'role', 'status')
    search_fields = ('full_name', 'phone', 'user__username')
    list_filter = ('role', 'status')