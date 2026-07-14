import "./GeoPostPreview.css";

import useGeoFeed
    from "../../../context/useGeoFeed";

function GeoPostPreview() {

    const { hoveredPost }
        = useGeoFeed();

    if (!hoveredPost) return null;

    return (

        <div className="geo-post-preview">

            <h4>
                {hoveredPost.author}
            </h4>

            <p>
                {hoveredPost.content}
            </p>

            <span>
                📍 {
                    hoveredPost.place?.name ||
                    hoveredPost.geo?.locationName ||
                    "Không xác định"
                }
            </span>

        </div>

    );
}

export default GeoPostPreview;