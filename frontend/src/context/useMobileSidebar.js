import {
  useContext,
} from "react";

import MobileSidebarContext from "./mobileSidebarContext";

// useMobileSidebar
function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export default useMobileSidebar;