import "./MainLayout.css";

import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import MobileBottomNav from "../MobileBottomNav/MobileBottomNav";

import useSidebar from "../../../context/useSidebar";

function MainLayout() {
    const location = useLocation();

    const isMapPage = location.pathname === "/map";

    const { isCollapsed } = useSidebar();

    return (
        <div className="main-layout">
            <Header />

            <div
                className={
                    isCollapsed
                        ? "main-layout__wrapper main-layout__wrapper--collapsed"
                        : "main-layout__wrapper"
                }
            >
                <Sidebar />

                <main
                    className={
                        isMapPage
                            ? "main-layout__page-content main-layout__page-content--map"
                            : "main-layout__page-content"
                    }
                >
                    <Outlet />
                </main>

                <MobileBottomNav />
            </div>
        </div>
    );
}

export default MainLayout;