import { useContext } from "react";

import GeoFeedContext from "./GeoFeedContext";

function useGeoFeed() {

    return useContext(GeoFeedContext);

}

export default useGeoFeed;