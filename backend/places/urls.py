from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    PlaceSuggestionCreateView,
    PlaceViewSet,
    ReviewListCreateView,
    SavedPlaceDeleteView,
    SavedPlaceListCreateView,
    place_detail,
)


router = DefaultRouter()

router.register(
    r"categories",
    CategoryViewSet,
    basename="category",
)

router.register(
    r"places",
    PlaceViewSet,
    basename="place",
)


urlpatterns = [
    path(
        "places/suggest/",
        PlaceSuggestionCreateView.as_view(),
        name="place-suggestion-create",
    ),
    path(
        "places/<int:pk>/",
        place_detail,
        name="place-detail",
    ),
    path(
        "saved-places/",
        SavedPlaceListCreateView.as_view(),
        name="saved-places",
    ),
    path(
        "saved-places/<int:place_id>/",
        SavedPlaceDeleteView.as_view(),
        name="delete-saved-place",
    ),
    path(
        "reviews/place/<int:place_id>/",
        ReviewListCreateView.as_view(),
        name="place-reviews",
    ),
    path(
        "",
        include(router.urls),
    ),
]
