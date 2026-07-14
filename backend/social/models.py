from django.conf import settings
from django.db import models
from places.models import Place


class Post(models.Model):
    post_id = models.AutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='posts'
    )

    place = models.ForeignKey(
        Place,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        db_column='place_id',
        related_name='posts'
    )

    title = models.CharField(max_length=255)
    content = models.TextField()

    category_id = models.CharField(max_length=50, blank=True, null=True)

    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    # Lưu tên địa điểm bằng chữ để reload lại không bị mất
    location_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'posts'

    def __str__(self):
        return self.title


class PostImage(models.Model):
    image_id = models.AutoField(primary_key=True)

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        db_column='post_id',
        related_name='images'
    )

    image_url = models.TextField()
    caption = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'post_images'

    def __str__(self):
        return self.image_url


class PostLike(models.Model):
    like_id = models.AutoField(primary_key=True)

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        db_column='post_id',
        related_name='likes'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='post_likes'
    )

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'post_likes'
        unique_together = ('post', 'user')

    def __str__(self):
        return f'{self.user.username} liked {self.post.title}'


class PostComment(models.Model):
    comment_id = models.AutoField(primary_key=True)

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        db_column='post_id',
        related_name='comments'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='post_comments'
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        db_column="parent_id",
        related_name="replies"
    )

    comment = models.TextField()
    status = models.CharField(max_length=30, default='active')

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'post_comments'

    def __str__(self):
        return f'{self.user.username}: {self.comment[:30]}'


class PostCommentLike(models.Model):
    comment_like_id = models.AutoField(primary_key=True)

    comment = models.ForeignKey(
        PostComment,
        on_delete=models.CASCADE,
        db_column="comment_id",
        related_name="likes"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="comment_likes"
    )

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = "post_comment_likes"
        unique_together = ("comment", "user")

    def __str__(self):
        return f"{self.user.username} liked comment {self.comment.comment_id}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("post_like", "Post Like"),
        ("post_comment", "Post Comment"),
        ("post_share", "Post Share"),
        ("comment_like", "Comment Like"),
        ("comment_reply", "Comment Reply"),
    )

    notification_id = models.AutoField(primary_key=True)

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="recipient_id",
        related_name="notifications"
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="actor_id",
        related_name="sent_notifications"
    )

    type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        db_column="post_id",
        related_name="notifications"
    )

    comment = models.ForeignKey(
        PostComment,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        db_column="comment_id",
        related_name="notifications"
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = "notifications"

    def __str__(self):
        return f"{self.actor.username} -> {self.recipient.username}: {self.type}"