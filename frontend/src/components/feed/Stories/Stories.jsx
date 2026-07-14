import "./Stories.css";

/* Mock Stories Data */

const storiesData = [
    {
        id: 1,
        username: "Nguyễn Văn A",
    },

    {
        id: 2,
        username: "Trần Minh",
    },

    {
        id: 3,
        username: "GIS Explorer",
    },

    {
        id: 4,
        username: "Remote Mapper",
    },

    {
        id: 5,
        username: "OpenStreet",
    },
];

/* Stories */

function Stories() {

    return (
        <section className="stories">

            {storiesData.map((story) => (

                <div
                    key={story.id}

                    className="stories__item"
                >

                    {/* Avatar */}
                    <div className="stories__avatar" />

                    {/* Username */}
                    <span className="stories__username">
                        {story.username}
                    </span>

                </div>

            ))}

        </section>
    );
}

export default Stories;