import { useState } from "react";

import SearchContext
    from "./SearchContext";

function SearchProvider({
    children,
}) {

    const [
        keyword,
        setKeyword,
    ] = useState("");

    const [
        searchResults,
        setSearchResults,
    ] = useState([]);

    const [
        selectedPlace,
        setSelectedPlace,
    ] = useState(null);

    return (

        <SearchContext.Provider
            value={{
                keyword,
                setKeyword,
                
                searchResults,
                setSearchResults,

                selectedPlace,
                setSelectedPlace,
            }}
        >

            {children}

        </SearchContext.Provider>

    );
}

export default SearchProvider;