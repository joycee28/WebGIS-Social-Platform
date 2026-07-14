import "./Header.css";

import { Search } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useSearch from "../../../context/useSearch";
import { searchPlaces } from "../../../services/placeService";

function getPlaceId(place) {
    return place?.place_id ?? place?.id;
}

function getPlaceName(place) {
    return place?.place_name ?? place?.name ?? "Địa điểm";
}

function getPlaceAddress(place) {
    return place?.address ?? place?.addressLevel1 ?? "";
}

function Header() {
    const navigate = useNavigate();
    const {
        keyword,
        setKeyword,
        searchResults,
        setSearchResults,
        setSelectedPlace,
    } = useSearch();

    useEffect(() => {
        let active = true;
        const timeout = window.setTimeout(async () => {
            const cleanKeyword = keyword.trim();
            if (cleanKeyword.length < 2) {
                setSearchResults([]);
                return;
            }

            try {
                const results = await searchPlaces(cleanKeyword);
                if (active) setSearchResults(Array.isArray(results) ? results : []);
            } catch (error) {
                console.error("Search places error:", error);
                if (active) setSearchResults([]);
            }
        }, 300);

        return () => {
            active = false;
            window.clearTimeout(timeout);
        };
    }, [keyword, setSearchResults]);

    return (
        <header className="header">
            <div className="header__left">
                <button className="header__logo" type="button" onClick={() => navigate("/")}>WebGIS</button>
            </div>

            <div className="header__center">
                <div className="header__search">
                    <Search size={18} />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Tìm kiếm địa điểm..."
                        className="header__search-input"
                    />

                    {searchResults.length > 0 && (
                        <div className="header__dropdown">
                            {searchResults.map((place) => (
                                <button
                                    key={getPlaceId(place)}
                                    type="button"
                                    className="header__result"
                                    onClick={() => {
                                        setSelectedPlace(place);
                                        setKeyword("");
                                        setSearchResults([]);
                                        navigate("/map");
                                    }}
                                >
                                    <strong>{getPlaceName(place)}</strong>
                                    <span>{getPlaceAddress(place)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
