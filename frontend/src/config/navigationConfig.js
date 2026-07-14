/*
|--------------------------------------------------------------------------
| Navigation Config
|--------------------------------------------------------------------------
|
| Toàn bộ menu sidebar được quản lý tập trung tại đây.
|
| Mỗi object đại diện cho một item menu.
|
*/

import {
  House,
  Map,
  UserRound,
  Bell,
  Settings,
} from "lucide-react";

const navigationItems = [
  {
    id: "home",
    label: "Trang chủ",
    path: "/",
    icon: House,
  },

  {
    id: "map",
    label: "Bản đồ",
    path: "/map",
    icon: Map,
  },

  {
    id: "public-profile",
    label: "Trang cá nhân",
    path: "/u/me",
    icon: UserRound,
  },

  {
    id: "notifications",
    label: "Thông báo",
    path: "/notifications",
    icon: Bell,
  },

  {
    id: "profile",
    label: "Hồ sơ",
    path: "/profile",
    icon: Settings,
  },
];

export default navigationItems;