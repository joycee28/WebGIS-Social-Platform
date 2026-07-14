import "./UserLocationMarker.css"
import { Marker } from "react-leaflet";
import L from "leaflet";

import useMap from "../../../context/useMap";

const userLocationIcon = L.divIcon({

    className: "user-location-marker",

    html: `
        <div class="user-location-marker__dot">
        </div>
    `,

    iconSize: [24, 24],

    iconAnchor: [12, 12],
});

function UserLocationMarker() {

    const {
        userLocation,
    } = useMap();

    if (!userLocation) {
        return null;
    }

    return (

        <Marker
            position={[
                userLocation.lat,
                userLocation.lng,
            ]}
            icon={userLocationIcon}
        />

    );
}

export default UserLocationMarker;