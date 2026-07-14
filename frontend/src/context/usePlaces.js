import {
    useContext,
} from "react";

import PlaceContext
    from "./PlaceContext";

function usePlaces() {

    return useContext(
        PlaceContext
    );
}

export default usePlaces;