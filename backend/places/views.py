from django.db import DatabaseError, IntegrityError, connection, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Place, Review, SavedPlace
from .serializers import (
    CategorySerializer,
    PlaceDetailSerializer,
    PlaceSerializer,
    PlaceSuggestionInputSerializer,
    ReviewSerializer,
    SavedPlaceSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("category_id")
    serializer_class = CategorySerializer


class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlaceSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "category",
        "status",
    ]

    search_fields = [
        "place_name",
        "address",
        "description",
    ]

    ordering_fields = [
        "place_id",
        "place_name",
        "created_at",
    ]

    def get_queryset(self):
        return (
            Place.objects.select_related("category")
            .filter(status="open")
            .order_by("place_id")
        )


class PlaceSuggestionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = PlaceSuggestionInputSerializer(
            data=request.data,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        validated_data = input_serializer.validated_data

        place_name = validated_data["place_name"]
        category = validated_data["category"]
        address = validated_data["address"]
        latitude = validated_data["latitude"]
        longitude = validated_data["longitude"]
        description = validated_data.get("description") or ""

        # Database gốc của dự án đang dùng quy ước open/close.
        # close được dùng như trạng thái chờ duyệt để tránh vi phạm
        # constraint cũ nếu PostgreSQL chưa cho phép giá trị pending.
        pending_database_status = "close"

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'places'
                        """
                    )

                    place_columns = {
                        row[0]
                        for row in cursor.fetchall()
                    }

                    cursor.execute(
                        """
                        SELECT pg_get_serial_sequence('places', 'place_id')
                        """
                    )

                    sequence_row = cursor.fetchone()
                    sequence_name = (
                        sequence_row[0]
                        if sequence_row
                        else None
                    )

                    if sequence_name:
                        cursor.execute(
                            """
                            SELECT setval(
                                %s::regclass,
                                COALESCE(
                                    (SELECT MAX(place_id) FROM places),
                                    0
                                ) + 1,
                                false
                            )
                            """,
                            [sequence_name],
                        )

                    base_columns = [
                        "category_id",
                        "place_name",
                        "address",
                        "latitude",
                        "longitude",
                        "view_count",
                        "save_count",
                        "status",
                        "description",
                        "created_at",
                        "updated_at",
                    ]

                    base_values = [
                        category.pk,
                        place_name,
                        address,
                        latitude,
                        longitude,
                        0,
                        0,
                        pending_database_status,
                        description,
                    ]

                    if "geom" in place_columns:
                        insert_sql = """
                            INSERT INTO places (
                                category_id,
                                place_name,
                                address,
                                latitude,
                                longitude,
                                geom,
                                view_count,
                                save_count,
                                status,
                                description,
                                created_at,
                                updated_at
                            )
                            VALUES (
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                ST_SetSRID(
                                    ST_MakePoint(%s, %s),
                                    4326
                                ),
                                %s,
                                %s,
                                %s,
                                %s,
                                NOW(),
                                NOW()
                            )
                            RETURNING place_id
                        """

                        insert_values = [
                            category.pk,
                            place_name,
                            address,
                            latitude,
                            longitude,
                            longitude,
                            latitude,
                            0,
                            0,
                            pending_database_status,
                            description,
                        ]
                    else:
                        insert_sql = """
                            INSERT INTO places (
                                category_id,
                                place_name,
                                address,
                                latitude,
                                longitude,
                                view_count,
                                save_count,
                                status,
                                description,
                                created_at,
                                updated_at
                            )
                            VALUES (
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                NOW(),
                                NOW()
                            )
                            RETURNING place_id
                        """

                        insert_values = base_values

                    cursor.execute(
                        insert_sql,
                        insert_values,
                    )

                    created_place_id = cursor.fetchone()[0]

            created_place = Place.objects.select_related(
                "category"
            ).get(
                place_id=created_place_id
            )

            response_data = PlaceSerializer(
                created_place
            ).data

            response_data["workflow_status"] = "pending"
            response_data["message"] = (
                "Đã gửi đề xuất địa điểm. "
                "Địa điểm đang chờ quản trị viên duyệt."
            )

            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError as error:
            return Response(
                {
                    "detail": (
                        "Không thể lưu địa điểm do dữ liệu trùng "
                        "hoặc vi phạm ràng buộc cơ sở dữ liệu."
                    ),
                    "database_error": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except DatabaseError as error:
            return Response(
                {
                    "detail": (
                        "Không thể lưu địa điểm vào PostgreSQL. "
                        "Hãy kiểm tra cấu trúc bảng places và PostGIS."
                    ),
                    "database_error": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        except Exception as error:
            return Response(
                {
                    "detail": "Có lỗi khi gửi đề xuất địa điểm.",
                    "server_error": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SavedPlaceListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        saved_places = (
            SavedPlace.objects.filter(user=request.user)
            .select_related(
                "place",
                "place__category",
            )
            .order_by("-saved_id")
        )

        serializer = SavedPlaceSerializer(
            saved_places,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        place_id = request.data.get("place_id")

        if not place_id:
            return Response(
                {"error": "Thiếu place_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        place = get_object_or_404(
            Place,
            place_id=place_id,
            status="open",
        )

        saved_place, created = SavedPlace.objects.get_or_create(
            user=request.user,
            place=place,
            defaults={
                "created_at": timezone.now(),
            },
        )

        serializer = SavedPlaceSerializer(saved_place)

        return Response(
            {
                "message": (
                    "Đã lưu địa điểm"
                    if created
                    else "Địa điểm đã được lưu trước đó"
                ),
                "data": serializer.data,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class SavedPlaceDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, place_id):
        saved_place = SavedPlace.objects.filter(
            user=request.user,
            place_id=place_id,
        ).first()

        if not saved_place:
            return Response(
                {"error": "Địa điểm này chưa được lưu"},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_place.delete()

        return Response(
            {"message": "Đã bỏ lưu địa điểm"},
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
def place_detail(request, pk):
    place = get_object_or_404(
        Place.objects.select_related("category"),
        place_id=pk,
        status="open",
    )

    place.view_count += 1
    place.save(update_fields=["view_count"])

    serializer = PlaceDetailSerializer(place)
    return Response(serializer.data)


class ReviewListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, place_id):
        reviews = (
            Review.objects.filter(
                place_id=place_id,
                status="active",
            )
            .select_related(
                "user",
                "place",
            )
            .order_by("-review_id")
        )

        serializer = ReviewSerializer(
            reviews,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request, place_id):
        place = get_object_or_404(
            Place,
            place_id=place_id,
            status="open",
        )

        serializer = ReviewSerializer(
            data=request.data,
        )

        if serializer.is_valid():
            serializer.save(
                user=request.user,
                place=place,
                created_at=timezone.now(),
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
