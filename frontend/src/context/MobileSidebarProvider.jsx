import {
    useState,
} from "react";

import MobileSidebarContext from "./mobileSidebarContext";

// Mobile Sidebar Provider
function MobileSidebarProvider({ children }) {

    // Mobile Sidebar State
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
        useState(false);
    
    // Open Sidebar
    const openMobileSidebar = () => {
        setIsMobileSidebarOpen(true);
    };

    // Close Sidebar
    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    return (
        <MobileSidebarContext.Provider
            value={{
                isMobileSidebarOpen,

                openMobileSidebar,
                closeMobileSidebar,
            }}
        >
            {children}
        </MobileSidebarContext.Provider>
    );
}

export default MobileSidebarProvider;