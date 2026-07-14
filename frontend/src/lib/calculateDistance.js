function toRadians(value) {
    return (value * Math.PI) / 180;
}

/*
|--------------------------------------------------------------------------
| Tính khoảng cách Haversine
|--------------------------------------------------------------------------
|
| Kết quả trả về theo kilomet.
|
*/

function calculateDistance(
    firstLatitude,
    firstLongitude,
    secondLatitude,
    secondLongitude
) {
    const lat1 = Number(firstLatitude);
    const lng1 = Number(firstLongitude);
    const lat2 = Number(secondLatitude);
    const lng2 = Number(secondLongitude);

    if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lng1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lng2)
    ) {
        return null;
    }

    const earthRadius = 6371;

    const latitudeDifference =
        toRadians(lat2 - lat1);

    const longitudeDifference =
        toRadians(lng2 - lng1);

    const value =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(longitudeDifference / 2) ** 2;

    const centralAngle =
        2 * Math.atan2(
            Math.sqrt(value),
            Math.sqrt(1 - value)
        );

    return earthRadius * centralAngle;
}

export default calculateDistance;