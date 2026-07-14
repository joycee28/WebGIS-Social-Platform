import {
  useState,
} from "react";

import SidebarContext from "./sidebarContext";

/*
|--------------------------------------------------------------------------
| Sidebar Provider
|--------------------------------------------------------------------------
|
| Provider quản lý:
| - trạng thái collapse
| - toggle sidebar
|
*/

function SidebarProvider({ children }) {

  /*
  |--------------------------------------------------------------------------
  | Sidebar State
  |--------------------------------------------------------------------------
  */

  const [isCollapsed, setIsCollapsed] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Toggle Sidebar
  |--------------------------------------------------------------------------
  */

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export default SidebarProvider;