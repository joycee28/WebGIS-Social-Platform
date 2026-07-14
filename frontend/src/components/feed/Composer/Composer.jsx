import "./Composer.css";
import normalizeMediaUrl from "../../../lib/normalizeMediaUrl";
import useCreatePostModal from "../../../context/useCreatePostModal";
import reverseGeocode from "../../../lib/reverseGeocode";
import { searchPlaces } from "../../../services/placeService";
import AddPlaceModal from "../AddPlaceModal/AddPlaceModal";
import usePosts from "../../../context/usePosts";
import { useAuth } from "../../../context/AuthContext";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Image,
    MapPinned,
    LocateFixed,
    Map as MapIcon,
    PencilLine,
    Search,
    Database,
    PlusCircle,
    Tag,
} from "lucide-react";

const DEFAULT_FEELING = "😐 Bình thường";

const FEELING_OPTIONS = [
    {
        value: "😊 Hài lòng",
        emoji: "😊",
        label: "Hài lòng",
        tone: "satisfied",
    },
    {
        value: "😐 Bình thường",
        emoji: "😐",
        label: "Bình thường",
        tone: "normal",
    },
    {
        value: "😞 Không hài lòng",
        emoji: "😞",
        label: "Không hài lòng",
        tone: "dissatisfied",
    },
];

const composerDraftCache = {
    postTitle: DEFAULT_FEELING,
    selectedCategoryId: "",
    selectedFile: null,
    selectedImagePreview: null,
    locationMode: "new",
    selectedDatabasePlace: null,
};

function Composer({
    onSubmit,
    categories = [],
}) {
    const { createPost } = usePosts();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [selectedImagePreview, setSelectedImagePreview] = useState(
        composerDraftCache.selectedImagePreview
    );

    const [selectedFile, setSelectedFile] = useState(
        composerDraftCache.selectedFile
    );

    const [isPosting, setIsPosting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [postTitle, setPostTitle] = useState(
        composerDraftCache.postTitle
    );

    const [selectedCategoryId, setSelectedCategoryId] = useState(
        composerDraftCache.selectedCategoryId
    );

    const [locationMode, setLocationMode] = useState(
        composerDraftCache.locationMode
    );

    const [selectedDatabasePlace, setSelectedDatabasePlace] = useState(
        composerDraftCache.selectedDatabasePlace
    );

    const [placeSearchKeyword, setPlaceSearchKeyword] = useState("");
    const [placeSearchResults, setPlaceSearchResults] = useState([]);
    const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
    const [placeSearchMessage, setPlaceSearchMessage] = useState("");

    const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
    const [placeSuggestionMessage, setPlaceSuggestionMessage] = useState("");

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const manualLocationRef = useRef(null);

    const {
        isLocationMenuOpen,
        setIsLocationMenuOpen,
        geo,
        setGeo,
        postContent,
        setPostContent,
        setIsLocationPickerOpen,
        closeCreatePostModal,
        isGettingLocation,
        setIsGettingLocation,
        isManualLocationInputOpen,
        setIsManualLocationInputOpen,
    } = useCreatePostModal();

    const avatarUrl =
        normalizeMediaUrl(user?.avatar_url) ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || "WebGIS"}`;

    function saveComposerDraft() {
        composerDraftCache.postTitle = postTitle;
        composerDraftCache.selectedCategoryId = selectedCategoryId;
        composerDraftCache.selectedFile = selectedFile;
        composerDraftCache.selectedImagePreview = selectedImagePreview;
        composerDraftCache.locationMode = locationMode;
        composerDraftCache.selectedDatabasePlace = selectedDatabasePlace;
    }

    function clearComposerDraft() {
        composerDraftCache.postTitle = DEFAULT_FEELING;
        composerDraftCache.selectedCategoryId = "";
        composerDraftCache.selectedFile = null;
        composerDraftCache.selectedImagePreview = null;
        composerDraftCache.locationMode = "new";
        composerDraftCache.selectedDatabasePlace = null;
    }

    useEffect(() => {
        if (locationMode !== "existing") {
            setPlaceSearchResults([]);
            setPlaceSearchMessage("");
            setIsSearchingPlaces(false);
            return undefined;
        }

        const keyword = placeSearchKeyword.trim();

        if (keyword.length < 2) {
            setPlaceSearchResults([]);
            setPlaceSearchMessage(
                keyword.length === 0
                    ? ""
                    : "Nhập ít nhất 2 ký tự để tìm địa điểm."
            );
            return undefined;
        }

        let isActive = true;

        const timeoutId = window.setTimeout(async () => {
            try {
                setIsSearchingPlaces(true);
                setPlaceSearchMessage("");

                const results = await searchPlaces(keyword);

                if (!isActive) {
                    return;
                }

                setPlaceSearchResults(results);
                setPlaceSearchMessage(
                    results.length === 0
                        ? "Không tìm thấy địa điểm phù hợp trong database."
                        : ""
                );
            } catch (error) {
                console.error("Search places error:", error);

                if (isActive) {
                    setPlaceSearchResults([]);
                    setPlaceSearchMessage(
                        "Không thể tìm địa điểm. Vui lòng thử lại."
                    );
                }
            } finally {
                if (isActive) {
                    setIsSearchingPlaces(false);
                }
            }
        }, 350);

        return () => {
            isActive = false;
            window.clearTimeout(timeoutId);
        };
    }, [locationMode, placeSearchKeyword]);

    function handlePickOnMap() {
        saveComposerDraft();

        setIsLocationMenuOpen(false);
        setIsLocationPickerOpen(true);
        closeCreatePostModal();
        navigate("/map");
    }

    function handleTextareaChange() {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    function handleImageChange(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
    ];

    const maxFileSize =
        15 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        alert(
            "Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF, HEIC hoặc HEIF."
        );

        event.target.value = "";
        return;
    }

    if (file.size > maxFileSize) {
        alert(
            "Dung lượng ảnh không được vượt quá 15 MB."
        );

        event.target.value = "";
        return;
    }

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onload = () => {
        setSelectedImagePreview(
            reader.result
        );
    };

    reader.onerror = () => {
        setSelectedFile(null);
        setSelectedImagePreview(null);

        composerDraftCache.selectedFile = null;
        composerDraftCache.selectedImagePreview = null;

        event.target.value = "";

        alert(
            "Không thể đọc ảnh này. Vui lòng chọn ảnh khác."
        );
    };

    reader.readAsDataURL(file);
}

    function handleRemoveImage() {
        setSelectedImagePreview(null);
        setSelectedFile(null);

        composerDraftCache.selectedFile = null;
        composerDraftCache.selectedImagePreview = null;

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleUseCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Trình duyệt không hỗ trợ định vị GPS.");
            return;
        }

        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    const locationName =
                        await reverseGeocode(lat, lng) ||
                        "Vị trí hiện tại";

                    setGeo({
                        lat,
                        lng,
                        locationName,
                        source: "gps",
                    });

                    setIsLocationMenuOpen(false);
                } catch (error) {
                    console.error("Lỗi reverse geocode:", error);

                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    setGeo({
                        lat,
                        lng,
                        locationName: "Vị trí hiện tại",
                        source: "gps",
                    });

                    setIsLocationMenuOpen(false);
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                console.error("Lỗi GPS:", error);
                setIsGettingLocation(false);
            }
        );
    }

    function handleLocationModeChange(nextMode) {
        if (nextMode === locationMode) {
            return;
        }

        setLocationMode(nextMode);
        setSelectedDatabasePlace(null);
        setPlaceSearchKeyword("");
        setPlaceSearchResults([]);
        setPlaceSearchMessage("");
        setPlaceSuggestionMessage("");
        setIsManualLocationInputOpen(false);
        setGeo(null);
    }

    function handleSelectDatabasePlace(place) {
        const latitude = Number(place?.latitude);
        const longitude = Number(place?.longitude);

        const selectedPlace = {
            ...place,
            place_id: place?.place_id ?? place?.id,
            place_name: place?.place_name || place?.name || "Địa điểm",
            latitude: Number.isFinite(latitude) ? latitude : null,
            longitude: Number.isFinite(longitude) ? longitude : null,
        };

        setSelectedDatabasePlace(selectedPlace);
        setPlaceSearchKeyword(selectedPlace.place_name);
        setPlaceSearchResults([]);
        setPlaceSearchMessage("");

        setGeo({
            lat: selectedPlace.latitude,
            lng: selectedPlace.longitude,
            locationName: selectedPlace.place_name,
            source: "database",
            placeId: selectedPlace.place_id,
        });
    }

    function handleClearSelectedDatabasePlace() {
        setSelectedDatabasePlace(null);
        setPlaceSearchKeyword("");
        setPlaceSearchResults([]);
        setPlaceSearchMessage("");
        setGeo(null);
    }

    function handleManualLocationSave() {
        const value = manualLocationRef.current?.value?.trim();

        if (!value) {
            return;
        }

        setGeo({
            lat: null,
            lng: null,
            locationName: value,
            source: "manual",
        });

        setIsManualLocationInputOpen(false);
        setIsLocationMenuOpen(false);

        if (manualLocationRef.current) {
            manualLocationRef.current.value = "";
        }
    }

    function handlePlaceSuggested(createdPlace) {
        const latitude = Number(
            createdPlace?.latitude
        );
        const longitude = Number(
            createdPlace?.longitude
        );

        setLocationMode("new");
        setSelectedDatabasePlace(null);
        setPlaceSearchKeyword("");
        setPlaceSearchResults([]);
        setPlaceSearchMessage("");

        setGeo({
            lat: Number.isFinite(latitude)
                ? latitude
                : null,
            lng: Number.isFinite(longitude)
                ? longitude
                : null,
            locationName:
                createdPlace?.place_name ||
                "Địa điểm đang chờ duyệt",
            source: "suggestion",
        });

        setPlaceSuggestionMessage(
            "Đã gửi đề xuất. Bạn vẫn có thể đăng bài tại vị trí này trong khi chờ quản trị viên duyệt."
        );

        setIsAddPlaceModalOpen(false);
        setIsLocationMenuOpen(false);
    }

    async function handleCreatePost() {
        if (isPosting) {
            return;
        }

        if (!postContent.trim() && !selectedFile) {
            setErrorMessage("Vui lòng viết nội dung hoặc chọn ảnh.");
            return;
        }

        if (!selectedCategoryId) {
            setErrorMessage("Vui lòng chọn danh mục đi chơi.");
            return;
        }

        const token = localStorage.getItem("access_token");

        if (!token) {
            setErrorMessage("❌ Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài viết.");
            return;
        }

        const isExistingPlace =
            locationMode === "existing" &&
            selectedDatabasePlace?.place_id;

        const locationName = isExistingPlace
            ? selectedDatabasePlace.place_name
            : geo?.locationName || null;

        const latitude = isExistingPlace
            ? selectedDatabasePlace.latitude
            : geo?.lat ?? null;

        const longitude = isExistingPlace
            ? selectedDatabasePlace.longitude
            : geo?.lng ?? null;

        const finalPostData = {
            title: postTitle || DEFAULT_FEELING,
            content: postContent,
            category_id: Number(selectedCategoryId),
            latitude,
            longitude,
            location_name: locationName,
            locationName,
            place: isExistingPlace
                ? selectedDatabasePlace.place_id
                : null,
            place_details: isExistingPlace
                ? selectedDatabasePlace
                : null,
            images: selectedFile ? [selectedFile] : [],
            image: selectedImagePreview || "",
        };

        try {
            setErrorMessage("");
            setIsPosting(true);

            if (typeof onSubmit === "function") {
                await onSubmit(finalPostData);
            } else {
                await createPost(finalPostData);
                closeCreatePostModal();
            }

            setPostContent("");
            setGeo(null);
            setPostTitle(DEFAULT_FEELING);
            setSelectedCategoryId("");
            setLocationMode("new");
            setSelectedDatabasePlace(null);
            setPlaceSearchKeyword("");
            setPlaceSearchResults([]);
            setPlaceSearchMessage("");
            setPlaceSuggestionMessage("");
            setIsAddPlaceModalOpen(false);
            handleRemoveImage();
            clearComposerDraft();
        } catch (error) {
            console.error("Lỗi tạo bài viết:", error);

            const errorMsg =
                error?.message ||
                error?.data?.detail ||
                "Không thể đăng bài viết. Vui lòng kiểm tra kết nối mạng.";

            setErrorMessage(errorMsg);
        } finally {
            setIsPosting(false);
        }
    }

    return (
        <section className="composer">
            <div className="composer__top">
                <div className="composer__avatar">
                    <img
                        src={avatarUrl}
                        alt={user?.username || "Avatar"}
                        className="composer__avatar-img"
                    />
                </div>

                <div className="composer__content">
                    <div className="composer__feeling">
                        <span className="composer__feeling-title">
                            Bạn cảm thấy thế nào?
                        </span>

                        <div className="composer__feeling-options">
                            {FEELING_OPTIONS.map((feeling) => {
                                const isSelected =
                                    postTitle === feeling.value;

                                return (
                                    <button
                                        key={feeling.value}
                                        type="button"
                                        className={
                                            isSelected
                                                ? `composer__feeling-button composer__feeling-button--${feeling.tone} composer__feeling-button--selected`
                                                : `composer__feeling-button composer__feeling-button--${feeling.tone}`
                                        }
                                        onClick={() => {
                                            setPostTitle(feeling.value);
                                            setErrorMessage("");
                                        }}
                                        aria-pressed={isSelected}
                                    >
                                        <span className="composer__feeling-emoji">
                                            {feeling.emoji}
                                        </span>

                                        <span className="composer__feeling-label">
                                            {feeling.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={postContent}
                        placeholder="Bạn đang nghĩ gì?"
                        className="composer__textarea"
                        rows={1}
                        onChange={(event) => {
                            setPostContent(event.target.value);
                            handleTextareaChange();
                        }}
                    />

                    {errorMessage && (
                        <div
                            style={{
                                padding: "8px 12px",
                                marginTop: "8px",
                                backgroundColor: "#fee2e2",
                                borderLeft: "4px solid #dc2626",
                                borderRadius: "4px",
                                color: "#991b1b",
                                fontSize: "13px",
                            }}
                        >
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    {isGettingLocation && (
                        <div className="composer__location-preview">
                            <span>⏳ Đang xác định vị trí...</span>
                        </div>
                    )}

                    {selectedImagePreview && (
                        <div
                            className="composer__image-preview"
                            style={{
                                position: "relative",
                                marginTop: "10px",
                            }}
                        >
                            <img
                                src={selectedImagePreview}
                                alt="Preview"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "180px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                }}
                            />

                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                style={{
                                    position: "absolute",
                                    top: "5px",
                                    right: "5px",
                                    background: "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "24px",
                                    height: "24px",
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {geo && (
                        <div className="composer__location-preview">
                            <span>
                                {selectedDatabasePlace
                                    ? "🏛️"
                                    : "📍"}{" "}
                                {geo.locationName || "Vị trí đã chọn"}
                            </span>

                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedDatabasePlace) {
                                        handleClearSelectedDatabasePlace();
                                    } else {
                                        setGeo(null);
                                    }
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {placeSuggestionMessage && (
                        <div className="composer__place-suggestion-success">
                            {placeSuggestionMessage}
                        </div>
                    )}
                </div>
            </div>

            {isLocationMenuOpen && (
                <div className="composer__location-section">
                    <div className="composer__location-mode-switch">
                        <button
                            type="button"
                            className={
                                locationMode === "existing"
                                    ? "composer__location-mode-button composer__location-mode-button--active"
                                    : "composer__location-mode-button"
                            }
                            onClick={() =>
                                handleLocationModeChange("existing")
                            }
                        >
                            <Database size={17} />
                            <span>Đã lưu sẵn</span>
                        </button>

                        <button
                            type="button"
                            className={
                                locationMode === "new"
                                    ? "composer__location-mode-button composer__location-mode-button--active"
                                    : "composer__location-mode-button"
                            }
                            onClick={() =>
                                handleLocationModeChange("new")
                            }
                        >
                            <MapPinned size={17} />
                            <span>Chưa lưu sẵn</span>
                        </button>
                    </div>

                    {locationMode === "existing" ? (
                        <div className="composer__database-place">
                            {selectedDatabasePlace ? (
                                <div className="composer__selected-place">
                                    <div>
                                        <strong>
                                            {selectedDatabasePlace.place_name}
                                        </strong>

                                        <span>
                                            {selectedDatabasePlace.address ||
                                                selectedDatabasePlace.category_name ||
                                                "Địa điểm đã có trong database"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleClearSelectedDatabasePlace
                                        }
                                    >
                                        Đổi
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="composer__place-search">
                                        <Search size={17} />

                                        <input
                                            type="text"
                                            value={placeSearchKeyword}
                                            placeholder="Nhập tên hoặc địa chỉ địa điểm..."
                                            onChange={(event) =>
                                                setPlaceSearchKeyword(
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    {isSearchingPlaces && (
                                        <div className="composer__place-search-status">
                                            Đang tìm trong database...
                                        </div>
                                    )}

                                    {!isSearchingPlaces &&
                                        placeSearchMessage && (
                                            <div className="composer__place-search-status">
                                                {placeSearchMessage}
                                            </div>
                                        )}

                                    {placeSearchResults.length > 0 && (
                                        <div className="composer__place-results">
                                            {placeSearchResults.map((place) => (
                                                <button
                                                    type="button"
                                                    key={
                                                        place.place_id ??
                                                        place.id
                                                    }
                                                    className="composer__place-result"
                                                    onClick={() =>
                                                        handleSelectDatabasePlace(
                                                            place
                                                        )
                                                    }
                                                >
                                                    <span className="composer__place-result-icon">
                                                        📍
                                                    </span>

                                                    <span className="composer__place-result-content">
                                                        <strong>
                                                            {place.place_name ||
                                                                place.name}
                                                        </strong>

                                                        <small>
                                                            {place.address ||
                                                                place.category_name ||
                                                                "Địa điểm đã lưu"}
                                                        </small>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="composer__location-menu">
                                <button
                                    type="button"
                                    className="composer__location-card"
                                    onClick={handleUseCurrentLocation}
                                >
                                    <LocateFixed size={18} />
                                    <span>Hiện tại</span>
                                </button>

                                <button
                                    type="button"
                                    className="composer__location-card"
                                    onClick={handlePickOnMap}
                                >
                                    <MapIcon size={18} />
                                    <span>Bản đồ</span>
                                </button>

                                <button
                                    type="button"
                                    className="composer__location-card"
                                    onClick={() =>
                                        setIsManualLocationInputOpen(
                                            (previousValue) =>
                                                !previousValue
                                        )
                                    }
                                >
                                    <PencilLine size={18} />
                                    <span>Nhập</span>
                                </button>
                            </div>

                            {isManualLocationInputOpen && (
                                <div className="composer__manual-location">
                                    <input
                                        ref={manualLocationRef}
                                        type="text"
                                        placeholder="Ví dụ: Quán cà phê gần trường"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleManualLocationSave}
                                    >
                                        Lưu
                                    </button>
                                </div>
                            )}


                            <div className="composer__suggest-place-box">
                                <div>
                                    <strong>
                                        Không tìm thấy địa điểm phù hợp?
                                    </strong>

                                    <span>
                                        Gửi đề xuất để quản trị viên kiểm tra và bổ sung vào hệ thống.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="composer__suggest-place-button"
                                    onClick={() => {
                                        setPlaceSuggestionMessage("");
                                        setIsAddPlaceModalOpen(true);
                                    }}
                                >
                                    <PlusCircle size={17} />
                                    <span>Đề xuất địa điểm mới</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="composer__bottom">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                />

                <button
                    type="button"
                    className="composer__action"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Image size={18} />
                    <span>Ảnh</span>
                </button>

                <button
                    type="button"
                    className="composer__action"
                    onClick={() => setIsLocationMenuOpen((prev) => !prev)}
                >
                    <MapPinned size={18} />
                    <span>Vị trí</span>
                </button>

                <label className="composer__action composer__category-action">
                    <Tag size={18} />

                    <select
                        value={selectedCategoryId}
                        onChange={(event) => setSelectedCategoryId(event.target.value)}
                        className="composer__category-select"
                    >
                        <option value="">
                            Danh mục
                        </option>

                        {categories.map((category) => (
                            <option
                                key={category.category_id}
                                value={category.category_id}
                            >
                                {category.category_name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="composer__submit">
                <button
                    type="button"
                    className="composer__submit-button"
                    onClick={handleCreatePost}
                    disabled={isPosting}
                >
                    {isPosting ? "Đang đăng..." : "Đăng"}
                </button>
            </div>


            <AddPlaceModal
                isOpen={isAddPlaceModalOpen}
                onClose={() =>
                    setIsAddPlaceModalOpen(false)
                }
                categories={categories}
                initialGeo={geo}
                onSuggested={handlePlaceSuggested}
            />
        </section>
    );
}

export default Composer;