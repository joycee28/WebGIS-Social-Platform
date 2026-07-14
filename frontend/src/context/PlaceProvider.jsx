import {
    useState,
    useEffect,
} from "react";

import PlaceContext
    from "./PlaceContext";

import {
    getPlaces,
} from "../services/placeService";

function PlaceProvider({
    children,
}) {

    const [
        places,
        setPlaces,
    ] = useState([]);

    const [
        selectedPlace,
        setSelectedPlace,
    ] = useState(null);

    useEffect(() => {

        async function loadPlaces() {

            try {
                const data = await getPlaces();
                setPlaces(data || []);
            } catch (error) {
                console.error(error);
                setPlaces([]);
            }
        }

        loadPlaces();

    }, []);

    return (

        <PlaceContext.Provider
            value={{

                places,

                selectedPlace,

                setSelectedPlace,
            }}
        >

            {children}

        </PlaceContext.Provider>
    );
}

export default PlaceProvider;