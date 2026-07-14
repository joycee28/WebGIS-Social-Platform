from django.contrib import admin

from .models import Category, Place, Review, SavedPlace


@admin.action(
    description="Duyệt địa điểm đã chọn"
)
def approve_places(modeladmin, request, queryset):
    queryset.update(status="open")


@admin.action(
    description="Chuyển địa điểm về trạng thái chờ duyệt"
)
def mark_places_pending(modeladmin, request, queryset):
    queryset.update(status="close")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "category_id",
        "category_name",
        "category_code",
    )

    search_fields = (
        "category_name",
        "category_code",
    )

    ordering = (
        "category_id",
    )


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = (
        "place_id",
        "place_name",
        "category",
        "display_review_status",
        "latitude",
        "longitude",
        "created_at",
    )

    search_fields = (
        "place_name",
        "address",
        "description",
    )

    list_filter = (
        "status",
        "category",
    )

    ordering = (
        "-place_id",
    )

    actions = (
        approve_places,
        mark_places_pending,
    )

    @admin.display(
        description="Trạng thái duyệt",
        ordering="status",
    )
    def display_review_status(self, obj):
        if obj.status == "open":
            return "Đã duyệt"

        return "Chờ duyệt"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "review_id",
        "place",
        "user",
        "rating",
        "status",
        "created_at",
    )

    search_fields = (
        "place__place_name",
        "user__username",
        "comment",
    )

    list_filter = (
        "rating",
        "status",
    )

    ordering = (
        "-review_id",
    )


@admin.register(SavedPlace)
class SavedPlaceAdmin(admin.ModelAdmin):
    list_display = (
        "saved_id",
        "user",
        "place",
        "created_at",
    )

    search_fields = (
        "user__username",
        "place__place_name",
    )

    list_filter = (
        "created_at",
    )

    ordering = (
        "-saved_id",
    )
