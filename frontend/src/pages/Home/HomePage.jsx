import "./HomePage.css";

import FeedContainer from "../../components/layout/FeedContainer/FeedContainer";
import RecommendationPanel from "../../components/feed/RecommendationPanel/RecommendationPanel";

function HomePage() {
    return (
        <div className="home-page">
            <section className="home-page__feed">
                <FeedContainer />
            </section>

            <aside className="home-page__right-panel">
                <RecommendationPanel />
            </aside>
        </div>
    );
}

export default HomePage;
