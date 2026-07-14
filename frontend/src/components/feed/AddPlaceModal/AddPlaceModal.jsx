import "./AddPlaceModal.css";

import {
    LoaderCircle,
    MapPin,
    PlusCircle,
    X,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";

import { suggestPlace } from "../../../services/placeService";

function getNumberOrEmpty(value) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return "";
    }

    return String(numberValue);
}

function AddPlaceModal({
    isOpen,
    onClose,
    categories = [],
    initialGeo = null,
    onSuggested,
}) {
    const [placeName, setPlaceName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [description, setDescription] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setPlaceName("");
        setCategoryId("");
        setAddress(
            initialGeo?.locationName || ""
        );
        setLatitude(
            getNumberOrEmpty(initialGeo?.lat)
        );
        setLongitude(
            getNumberOrEmpty(initialGeo?.lng)
        );
        setDescription("");
        setErrorMessage("");
        setIsSubmitting(false);
    }, [
        isOpen,
        initialGeo?.lat,
        initialGeo?.lng,
        initialGeo?.locationName,
    ]);

    if (!isOpen) {
        return null;
    }

    function handleClose() {
        if (isSubmitting) {
            return;
        }

        onClose?.();
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const normalizedPlaceName =
            placeName.trim();
        const normalizedAddress =
            address.trim();
        const latitudeNumber =
            Number(latitude);
        const longitudeNumber =
            Number(longitude);

        if (!normalizedPlaceName) {
            setErrorMessage(
                "Vui lòng nhập tên địa điểm."
            );
            return;
        }

        if (!categoryId) {
            setErrorMessage(
                "Vui lòng chọn danh mục địa điểm."
            );
            return;
        }

        if (!normalizedAddress) {
            setErrorMessage(
                "Vui lòng nhập địa chỉ."
            );
            return;
        }

        if (
            !Number.isFinite(latitudeNumber) ||
            latitudeNumber < -90 ||
            latitudeNumber > 90
        ) {
            setErrorMessage(
                "Vĩ độ không hợp lệ."
            );
            return;
        }

        if (
            !Number.isFinite(longitudeNumber) ||
            longitudeNumber < -180 ||
            longitudeNumber > 180
        ) {
            setErrorMessage(
                "Kinh độ không hợp lệ."
            );
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");

            const createdPlace =
                await suggestPlace({
                    place_name:
                        normalizedPlaceName,
                    category:
                        Number(categoryId),
                    address:
                        normalizedAddress,
                    latitude:
                        latitudeNumber,
                    longitude:
                        longitudeNumber,
                    description:
                        description.trim(),
                });

            onSuggested?.(createdPlace);
        } catch (error) {
            console.error(
                "Suggest place error:",
                error
            );

            setErrorMessage(
                error?.message ||
                    "Không thể gửi đề xuất địa điểm."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="add-place-modal__overlay"
            onMouseDown={handleClose}
        >
            <div
                className="add-place-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-place-modal-title"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <header className="add-place-modal__header">
                    <div>
                        <h2 id="add-place-modal-title">
                            Đề xuất địa điểm mới
                        </h2>

                        <p>
                            Địa điểm sẽ được lưu ở trạng thái chờ quản trị viên duyệt.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-place-modal__close"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="Đóng form"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form
                    className="add-place-modal__form"
                    onSubmit={handleSubmit}
                >
                    <label className="add-place-modal__field add-place-modal__field--full">
                        <span>Tên địa điểm *</span>
                        <input
                            type="text"
                            value={placeName}
                            onChange={(event) =>
                                setPlaceName(
                                    event.target.value
                                )
                            }
                            placeholder="Ví dụ: Quán cà phê gần trường"
                            maxLength={255}
                            autoFocus
                        />
                    </label>

                    <label className="add-place-modal__field add-place-modal__field--full">
                        <span>Danh mục *</span>
                        <select
                            value={categoryId}
                            onChange={(event) =>
                                setCategoryId(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Chọn danh mục
                            </option>

                            {categories.map(
                                (category) => (
                                    <option
                                        key={
                                            category.category_id
                                        }
                                        value={
                                            category.category_id
                                        }
                                    >
                                        {
                                            category.category_name
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    <label className="add-place-modal__field add-place-modal__field--full">
                        <span>Địa chỉ *</span>
                        <input
                            type="text"
                            value={address}
                            onChange={(event) =>
                                setAddress(
                                    event.target.value
                                )
                            }
                            placeholder="Nhập địa chỉ hoặc mô tả khu vực"
                        />
                    </label>

                    <label className="add-place-modal__field">
                        <span>Vĩ độ *</span>
                        <input
                            type="number"
                            step="any"
                            value={latitude}
                            onChange={(event) =>
                                setLatitude(
                                    event.target.value
                                )
                            }
                            placeholder="10.7626"
                        />
                    </label>

                    <label className="add-place-modal__field">
                        <span>Kinh độ *</span>
                        <input
                            type="number"
                            step="any"
                            value={longitude}
                            onChange={(event) =>
                                setLongitude(
                                    event.target.value
                                )
                            }
                            placeholder="106.6602"
                        />
                    </label>

                    <div className="add-place-modal__coordinate-note add-place-modal__field--full">
                        <MapPin size={16} />
                        <span>
                            Có thể lấy tọa độ trước bằng nút Hiện tại hoặc chọn trên Bản đồ.
                        </span>
                    </div>

                    <label className="add-place-modal__field add-place-modal__field--full">
                        <span>Mô tả</span>
                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Thông tin ngắn giúp quản trị viên xác minh địa điểm"
                            rows={3}
                        />
                    </label>

                    {errorMessage && (
                        <div className="add-place-modal__error add-place-modal__field--full">
                            {errorMessage}
                        </div>
                    )}

                    <footer className="add-place-modal__actions add-place-modal__field--full">
                        <button
                            type="button"
                            className="add-place-modal__cancel"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="add-place-modal__submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <LoaderCircle
                                        size={17}
                                        className="add-place-modal__spinner"
                                    />
                                    <span>Đang gửi...</span>
                                </>
                            ) : (
                                <>
                                    <PlusCircle size={17} />
                                    <span>Gửi đề xuất</span>
                                </>
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}

export default AddPlaceModal;
