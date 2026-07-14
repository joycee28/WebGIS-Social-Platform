import { useContext } from "react";

import SearchContext
    from "./SearchContext";

function useSearch() {

    return useContext(
        SearchContext
    );
}

export default useSearch;