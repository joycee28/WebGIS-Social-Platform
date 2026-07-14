from django.conf import settings
from django.db import models


class Profile(models.Model):
    profile_id = models.AutoField(primary_key=True)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='profile'
    )

    full_name = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)

    role = models.CharField(max_length=30, default='user')
    status = models.CharField(max_length=30, default='active')

    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'profiles'

    def __str__(self):
        return self.full_name or self.user.username