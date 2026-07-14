import "./NavItem.css";

import { NavLink } from "react-router-dom";

function NavItem({
    icon: Icon,
    label,
    path,
    badgeCount = 0,
}) {
    const hasBadge = Number(badgeCount) > 0;

    return (
        <NavLink
            to={path}
            className={({ isActive }) =>
                isActive
                    ? "nav-item nav-item--active"
                    : "nav-item"
            }
        >
            <div className="nav-item__icon">
                <Icon size={22} />

                {hasBadge && (
                    <span className="nav-item__badge">
                        {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                )}
            </div>

            <span className="nav-item__label">
                {label}
            </span>
        </NavLink>
    );
}

export default NavItem;