async function reverseGeocode(lat, lng) {

    try {

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );

        const data = await response.json();

        const address = data.address;

        const suburb =
            address.suburb
                ?.replace("Phường ", "")
                ?.replace("Xã ", "");

        const city =
            address.city
                ?.replace("Thành phố ", "")
                ?.replace("Huyện ", "");

        if (suburb && city) {
            return `${suburb}, ${city}`;
        }

        if (city) {
            return city;
        }

        return "Vị trí đã chọn";

    } catch (error) {

        console.error(error);

        return "Vị trí đã chọn";
    }
}

export default reverseGeocode;