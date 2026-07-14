import { useEffect } from "react";
import { useMap } from "react-leaflet";
import useMapContext
    from "../../../context/useMap";

function MapBridge() {

    const leafletMap = useMap();
    const { setMap } = useMapContext();

    useEffect(() => {

        setMap(leafletMap);

        return () => {

            setMap(null);

        };

    }, [leafletMap, setMap]);
}

export default MapBridge;