from django.conf import settings
from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100)
    category_code = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = True
        db_table = "categories"

    def __str__(self):
        return self.category_name


class Place(models.Model):
    place_id = models.AutoField(primary_key=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        db_column="category_id",
        related_name="places",
    )

    place_name = models.CharField(max_length=255)
    address = models.TextField()

    latitude = models.FloatField()
    longitude = models.FloatField()

    view_count = models.IntegerField(default=0)
    save_count = models.IntegerField(default=0)

    opening_time = models.TimeField(blank=True, null=True)
    closing_time = models.TimeField(blank=True, null=True)

    ticket_price = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=30, default="open")

    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)

    phone = models.CharField(max_length=30, blank=True, null=True)
    website = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = "places"

    def __str__(self):
        return self.place_name


class Review(models.Model):
    review_id = models.AutoField(primary_key=True)

    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        db_column="place_id",
        related_name="reviews",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="reviews",
    )

    rating = models.IntegerField()
    status = models.CharField(max_length=30, default="active")
    comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = "reviews"

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.place.place_name} - "
            f"{self.rating}"
        )


class SavedPlace(models.Model):
    saved_id = models.AutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="user_id",
    )

    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        db_column="place_id",
        related_name="saved_by_users",
    )

    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "saved_places"
        managed = True
        unique_together = ("user", "place")

    def __str__(self):
        return f"{self.user.username} saved {self.place.place_name}"
