import {
  useContext,
} from "react";

import SidebarContext from "./sidebarContext";

/*
|--------------------------------------------------------------------------
| useSidebar Hook
|--------------------------------------------------------------------------
*/

function useSidebar() {
  return useContext(SidebarContext);
}

export default useSidebar;