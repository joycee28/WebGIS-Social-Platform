import { useContext } from "react";

import MapContext
    from "./MapContext";

function useMap() {

    return useContext(MapContext);

}

export default useMap;