import { useState } from "react";

import MapContext from "./MapContext";

function MapProvider({ children }) {

    const [map, setMap] =
        useState(null);

    const [
        pendingPost,
        setPendingPost,
    ] = useState(null);

    const [
        userLocation,
        setUserLocation,
    ] = useState(null);

    return (

        <MapContext.Provider
            value={{
                map,
                setMap,

                pendingPost,
                setPendingPost,

                userLocation,
                setUserLocation,
            }}
        >

            {children}

        </MapContext.Provider>

    );
}

export default MapProvider;