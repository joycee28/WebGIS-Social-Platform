from rest_framework import serializers

from .models import Category, Place, Review, SavedPlace


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "category_id",
            "category_name",
            "category_code",
        ]


class PlaceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.category_name",
        read_only=True,
    )

    category_code = serializers.CharField(
        source="category.category_code",
        read_only=True,
    )

    class Meta:
        model = Place
        fields = [
            "place_id",
            "place_name",
            "address",
            "latitude",
            "longitude",
            "category",
            "category_name",
            "category_code",
            "opening_time",
            "closing_time",
            "ticket_price",
            "status",
            "description",
            "image_url",
            "phone",
            "website",
            "created_at",
            "updated_at",
        ]


class PlaceSuggestionInputSerializer(serializers.Serializer):
    place_name = serializers.CharField(
        max_length=255,
        allow_blank=False,
        trim_whitespace=True,
    )

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=True,
        allow_null=False,
    )

    address = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )

    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        trim_whitespace=True,
    )

    def validate_place_name(self, value):
        normalized_name = value.strip()

        if len(normalized_name) < 2:
            raise serializers.ValidationError(
                "Tên địa điểm phải có ít nhất 2 ký tự."
            )

        duplicated_place = Place.objects.filter(
            place_name__iexact=normalized_name,
        ).exists()

        if duplicated_place:
            raise serializers.ValidationError(
                "Địa điểm này đã tồn tại hoặc đã được gửi trước đó."
            )

        return normalized_name

    def validate_address(self, value):
        normalized_address = value.strip()

        if len(normalized_address) < 3:
            raise serializers.ValidationError(
                "Địa chỉ phải có ít nhất 3 ký tự."
            )

        return normalized_address

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                "Vĩ độ phải nằm trong khoảng từ -90 đến 90."
            )

        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                "Kinh độ phải nằm trong khoảng từ -180 đến 180."
            )

        return value


class SavedPlaceSerializer(serializers.ModelSerializer):
    place_name = serializers.CharField(
        source="place.place_name",
        read_only=True,
    )

    address = serializers.CharField(
        source="place.address",
        read_only=True,
    )

    latitude = serializers.FloatField(
        source="place.latitude",
        read_only=True,
    )

    longitude = serializers.FloatField(
        source="place.longitude",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="place.category.category_name",
        read_only=True,
    )

    category_code = serializers.CharField(
        source="place.category.category_code",
        read_only=True,
    )

    class Meta:
        model = SavedPlace
        fields = [
            "saved_id",
            "user",
            "place",
            "place_name",
            "address",
            "latitude",
            "longitude",
            "category_name",
            "category_code",
            "created_at",
        ]

        read_only_fields = [
            "saved_id",
            "user",
            "place_name",
            "address",
            "latitude",
            "longitude",
            "category_name",
            "category_code",
            "created_at",
        ]


class PlaceDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.category_name",
        read_only=True,
    )

    category_code = serializers.CharField(
        source="category.category_code",
        read_only=True,
    )

    class Meta:
        model = Place
        fields = [
            "place_id",
            "place_name",
            "address",
            "latitude",
            "longitude",
            "description",
            "image_url",
            "phone",
            "website",
            "ticket_price",
            "opening_time",
            "closing_time",
            "status",
            "view_count",
            "save_count",
            "category_name",
            "category_code",
        ]


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    place_name = serializers.CharField(
        source="place.place_name",
        read_only=True,
    )

    class Meta:
        model = Review
        fields = [
            "review_id",
            "user",
            "username",
            "place",
            "place_name",
            "rating",
            "comment",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "review_id",
            "user",
            "username",
            "place",
            "place_name",
            "created_at",
        ]
