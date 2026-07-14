function getCurrentLocation() {

    return new Promise(
        (resolve, reject) => {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "Geolocation not supported"
                    )
                );

                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {

                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });

                },
                reject
            );
        }
    );
}

export default getCurrentLocation;