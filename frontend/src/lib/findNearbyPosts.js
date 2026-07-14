function findNearbyPosts(
    posts,
    lat,
    lng,
    radius = 0.02
) {

    return posts.filter(post => {

        if (
            typeof post.geo?.lat !== "number" ||
            typeof post.geo?.lng !== "number"
        ) {
            return false;
        }

        const latDiff =
            Math.abs(
                post.geo.lat - lat
            );

        const lngDiff =
            Math.abs(
                post.geo.lng - lng
            );

        return (
            latDiff < radius &&
            lngDiff < radius
        );
    });
}

export default findNearbyPosts;