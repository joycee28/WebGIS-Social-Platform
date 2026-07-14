import findNearestPlace from "./findNearestPlace";

export default function resolvePlace(lat, lng) {

    const place =
        findNearestPlace(lat, lng);

    if (!place) {
        return null;
    }

    return {
        id: place.id,

        name: place.name,

        addressLevel1:
            place.addressLevel1,

        addressLevel2:
            place.addressLevel2,

        geo: place.geo,

        resolution: "nearest"
    };
}