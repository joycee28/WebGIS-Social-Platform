import "./SkeletonPostCard.css";

/* Skeleton Post Card */

function SkeletonPostCard() {

    return (

        <article className="skeleton-post-card">

            {/* Header */}

            <div className="skeleton-post-card__header">

                <div className="skeleton-post-card__avatar" />

                <div className="skeleton-post-card__meta">

                    <div
                        className="
                            skeleton-post-card__line
                            skeleton-post-card__line--short
                        "
                    />

                    <div
                        className="
                            skeleton-post-card__line
                            skeleton-post-card__line--tiny
                        "
                    />

                </div>

            </div>

            {/* Content */}

            <div className="skeleton-post-card__content">

                <div className="skeleton-post-card__line" />

                <div className="skeleton-post-card__line" />

                <div
                    className="
                        skeleton-post-card__line
                        skeleton-post-card__line--medium
                    "
                />

            </div>

            {/* Image Placeholder */}

            <div className="skeleton-post-card__image" />

            {/* ==========================================================
             * Actions
             * ======================================================== */}

            <div className="skeleton-post-card__actions">

                <div className="skeleton-post-card__action" />

                <div className="skeleton-post-card__action" />

                <div className="skeleton-post-card__action" />

                <div className="skeleton-post-card__action" />

            </div>

        </article>
    );
}

export default SkeletonPostCard;