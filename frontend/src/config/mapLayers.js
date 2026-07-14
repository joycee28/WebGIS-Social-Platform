const MAP_LAYERS = {

    osm: {

        name: "OpenStreetMap",

        url:
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        attribution:
            "&copy; OpenStreetMap contributors",
    },

    dark: {

        name: "Dark",

        url:
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",

        attribution:
            "&copy; CARTO",
    },

    satellite: {

        name: "Satellite",

        url:
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

        attribution:
            "&copy; Esri",
    },
};

export default MAP_LAYERS;