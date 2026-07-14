import mockPlaces from "../data/mockPlaces";

/* simple distance (Haversine simplified) */
function distance(a, b) {

    const R = 6371000;

    const dLat =
        ((b.lat - a.lat) * Math.PI) / 180;

    const dLng =
        ((b.lng - a.lng) * Math.PI) / 180;

    const lat1 =
        (a.lat * Math.PI) / 180;

    const lat2 =
        (b.lat * Math.PI) / 180;

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLng / 2) ** 2;

    return (
        2 *
        R *
        Math.atan2(
            Math.sqrt(h),
            Math.sqrt(1 - h)
        )
    );
}

export default function findNearestPlace(lat, lng) {
    let nearest = null;
    let minDist = Infinity;

    mockPlaces.forEach(place => {
        const d = distance(
            { lat, lng },
            {
                lat: place.geo.lat,
                lng: place.geo.lng
            }
        );

        if (d < minDist) {
            minDist = d;
            nearest = place;
        }
    });

    const MAX_DISTANCE = 500;

    if (minDist > MAX_DISTANCE) {
        return null;
    }

    return nearest;
}