import "./MobileBottomNav.css";

import {
    NavLink,
} from "react-router-dom";

import { Plus } from "lucide-react";

import useCreatePostModal
    from "../../../context/useCreatePostModal";

import navigationItems
    from "../../../config/navigationConfig";

/*
Mobile Bottom Navigation
*/

function MobileBottomNav() {

    const {
        openCreatePostModal,
    } = useCreatePostModal();

    return (
        <nav className="mobile-bottom-nav">

            {navigationItems.slice(0, 3).map((item) => {

                const Icon = item.icon;

                return (

                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive
                                ? "mobile-bottom-nav__item mobile-bottom-nav__item--active"
                                : "mobile-bottom-nav__item"
                        }
                    >

                        <Icon size={22} />

                    </NavLink>
                );
            })}

            <button
                className="mobile-bottom-nav__create"
                onClick={openCreatePostModal}
            >

                <Plus size={24} />

            </button>

            {navigationItems.slice(3).map((item) => {

                const Icon = item.icon;

                return (

                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive
                                ? "mobile-bottom-nav__item mobile-bottom-nav__item--active"
                                : "mobile-bottom-nav__item"
                        }
                    >

                        <Icon size={22} />

                    </NavLink>
                );
            })}

        </nav>
    );
}

export default MobileBottomNav;