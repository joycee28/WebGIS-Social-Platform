import "./FeedContainer.css";

import FeedList from "../../feed/FeedList/FeedList";

function FeedContainer() {
    return (
        <main className="feed-container">
            <section className="feed-container__posts">
                <FeedList />
            </section>
        </main>
    );
}

export default FeedContainer;
