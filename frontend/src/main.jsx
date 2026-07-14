import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "leaflet/dist/leaflet.css";
import "./lib/leafletConfig";

import "./index.css";
import "./styles/typography.css";
import "./styles/utilities.css";

import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext";
import SidebarProvider from "./context/SidebarProvider";
import MobileSidebarProvider from "./context/MobileSidebarProvider";
import SearchProvider from "./context/SearchProvider";
import PlaceProvider from "./context/PlaceProvider";
import MapProvider from "./context/MapProvider";
import PostProvider from "./context/PostProvider";
import CommentProvider from "./context/CommentProvider";
import CreatePostModalProvider from "./context/CreatePostModalProvider";
import CommentModalProvider from "./context/CommentModalProvider";
import GeoFeedProvider from "./context/GeoFeedProvider";

createRoot(
    document.getElementById("root")
).render(
    <BrowserRouter>
        <AuthProvider>
            <SidebarProvider>
                <MobileSidebarProvider>
                    <SearchProvider>
                        <PlaceProvider>
                            <MapProvider>
                                <PostProvider>
                                    <CommentProvider>
                                        <CreatePostModalProvider>
                                            <CommentModalProvider>
                                                <GeoFeedProvider>
                                                    <App />
                                                </GeoFeedProvider>
                                            </CommentModalProvider>
                                        </CreatePostModalProvider>
                                    </CommentProvider>
                                </PostProvider>
                            </MapProvider>
                        </PlaceProvider>
                    </SearchProvider>
                </MobileSidebarProvider>
            </SidebarProvider>
        </AuthProvider>
    </BrowserRouter>
);
