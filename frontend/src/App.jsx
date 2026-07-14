import "./App.css";

import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import MainLayout from "./components/layout/MainLayout/MainLayout";
import CreatePostModal from "./components/feed/CreatePostModal/CreatePostModal";
import CommentModal from "./components/feed/CommentModal/CommentModal";

import Authpage from "./pages/Auth/Authpage";
import HomePage from "./pages/Home/HomePage";
import MapPage from "./pages/Map/MapPage";
import ProfileWrapperPage from "./pages/Profile/ProfileWrapperPage";
import PublicProfilePage from "./pages/PublicProfile/PublicProfilePage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import PostDetailPage from "./pages/PostDetail/PostDetailPage";

import { useAuth } from "./context/AuthContext";

function MyPublicProfileRedirect() {
    const {
        user,
        isLoading,
    } = useAuth();

    if (isLoading) {
        return (
            <div
                style={{
                    width: "100%",
                    padding: "40px",
                    textAlign: "center",
                }}
            >
                Đang tải trang cá nhân...
            </div>
        );
    }

    if (!user?.username) {
        return (
            <Navigate
                to="/auth"
                replace
            />
        );
    }

    return (
        <Navigate
            to={`/u/${encodeURIComponent(
                user.username
            )}`}
            replace
        />
    );
}

function App() {
    return (
        <>
            <Routes>
                <Route
                    path="/auth"
                    element={<Authpage />}
                />

                <Route
                    path="/login"
                    element={<Authpage />}
                />

                <Route
                    path="/register"
                    element={<Authpage />}
                />

                <Route
                    path="/"
                    element={<MainLayout />}
                >
                    <Route
                        index
                        element={<HomePage />}
                    />

                    <Route
                        path="map"
                        element={<MapPage />}
                    />

                    <Route
                        path="profile"
                        element={
                            <ProfileWrapperPage />
                        }
                    />

                    <Route
                        path="u/me"
                        element={
                            <MyPublicProfileRedirect />
                        }
                    />

                    <Route
                        path="u/:username"
                        element={
                            <PublicProfilePage />
                        }
                    />

                    <Route
                        path="notifications"
                        element={
                            <NotificationsPage />
                        }
                    />

                    <Route
                        path="posts/:postId"
                        element={
                            <PostDetailPage />
                        }
                    />
                </Route>

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>

            <CreatePostModal />
            <CommentModal />
        </>
    );
}

export default App;
