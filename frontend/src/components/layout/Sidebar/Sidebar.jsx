import "./Sidebar.css";

import {
  useEffect,
  useState,
} from "react";

// Navigation Config
import navigationItems from "../../../config/navigationConfig";

// Navigation Component
import NavItem from "../../navigation/NavItem/NavItem";

import useCreatePostModal from "../../../context/useCreatePostModal";

// Icons
import {
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
} from "lucide-react";

// Sidebar Context
import useSidebar from "../../../context/useSidebar";
import { useAuth } from "../../../context/AuthContext";

import {
  getUnreadNotificationCount,
} from "../../../services/notificationService";

function Sidebar() {
  const {
    isCollapsed,
    toggleSidebar,
  } = useSidebar();

  const {
    openCreatePostModal,
  } = useCreatePostModal();

  const { user } = useAuth();

  const [
    unreadNotificationCount,
    setUnreadNotificationCount,
  ] = useState(0);

  async function loadUnreadNotificationCount() {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const data = await getUnreadNotificationCount();

      setUnreadNotificationCount(
        Number(data?.unread_count || 0)
      );
    } catch (error) {
      console.error("Load unread notification count error:", error);
      setUnreadNotificationCount(0);
    }
  }

  useEffect(() => {
    loadUnreadNotificationCount();

    const intervalId = window.setInterval(() => {
      loadUnreadNotificationCount();
    }, 15000);

    window.addEventListener(
      "notifications-updated",
      loadUnreadNotificationCount
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "notifications-updated",
        loadUnreadNotificationCount
      );
    };
  }, [user?.username]);

  return (
    <aside
      className={
        isCollapsed
          ? "sidebar sidebar--collapsed"
          : "sidebar"
      }
    >
      <div className="sidebar__content">
        <div className="sidebar__header">
          <button
            className="sidebar__toggle-button"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </div>

        <nav className="sidebar__navigation">
          {navigationItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              path={item.path}
              badgeCount={
                item.id === "notifications"
                  ? unreadNotificationCount
                  : 0
              }
            />
          ))}
        </nav>

        <button
          className="nav-item sidebar__create-post"
          onClick={openCreatePostModal}
        >
          <div className="nav-item__icon">
            <SquarePen size={22} />
          </div>

          {!isCollapsed && (
            <span className="nav-item__label">
              Tạo bài viết
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;