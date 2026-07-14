import resolvePlace from "../lib/placeEngine";

const AUTHORS = [
    "Nguyễn Văn A",
    "Trần Thị B",
    "Lê Văn C",
    "Phạm Văn D",
    "Hoàng Thị E",
    "Võ Minh F",
    "Ngô Gia G",
    "Đặng Quốc H",
];

const FEELINGS = [
    "đang vui vẻ",
    "đang khám phá",
    "đang nghiên cứu GIS",
    "đang khảo sát UAV",
    "đang đi du lịch",
    "đang học React",
];

const CONTENTS = [

    "Hôm nay mình vừa hoàn thành dashboard GIS.",

    "Đang khảo sát dữ liệu không gian ngoài thực địa.",

    "WebGIS kết hợp AI rất thú vị.",

    "Đây là một điểm check-in đẹp.",

    "Mình vừa thu thập dữ liệu UAV.",

    "Thử nghiệm hệ thống EmoMap mới.",

];

const LOCATIONS = [

    {
        name: "Thủ Đức",
        lat: 10.8500,
        lng: 106.7700,
    },

    {
        name: "Quận 1",
        lat: 10.7768,
        lng: 106.7009,
    },

    {
        name: "Bình Thạnh",
        lat: 10.8100,
        lng: 106.7100,
    },

    {
        name: "Quận 7",
        lat: 10.7300,
        lng: 106.7200,
    },

    {
        name: "Gò Vấp",
        lat: 10.8400,
        lng: 106.6600,
    },

    {
        name: "Tân Bình",
        lat: 10.8000,
        lng: 106.6500,
    },

    {
        name: "Dĩ An",
        lat: 10.9000,
        lng: 106.7700,
    },

    {
        name: "Thuận An",
        lat: 10.8900,
        lng: 106.6800,
    },

    {
        name: "Biên Hòa",
        lat: 10.9500,
        lng: 106.8200,
    },

    {
        name: "Đà Lạt",
        lat: 11.9400,
        lng: 108.4500,
    },

];

function randomItem(array) {

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}

export function generateMockPosts(
    count = 30
) {

    return Array.from(

        { length: count },

        (_, index) => {

            const location =
                randomItem(LOCATIONS);

            const lat =
                location.lat +
                (Math.random() - 0.5) * 0.02;

            const lng =
                location.lng +
                (Math.random() - 0.5) * 0.02;

            const place =
                resolvePlace(
                    lat,
                    lng
                );

            return {

                id: index + 1,

                author:
                    randomItem(AUTHORS),

                timestamp:
                    `${Math.floor(
                        Math.random() * 24
                    )} giờ trước`,

                feeling:
                    randomItem(FEELINGS),

                content:
                    randomItem(CONTENTS),

                image:
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",

                likes:
                    Math.floor(
                        Math.random() * 500
                    ),
                isLiked: false,

                comments:
                    Math.floor(
                        Math.random() * 100
                    ),

                reposts:
                    Math.floor(
                        Math.random() * 50
                    ),
                isReported: false,

                shares:
                    Math.floor(
                        Math.random() * 20
                    ),

                geo: {
                    lat,
                    lng,
                    locationName:
                        place?.name ||
                        location.name,
                },

                place,
            };
        }
    );
}