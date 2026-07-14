const mockComments = {

    1: [
        {
            id: 1,
            author: "Nguyễn Văn B",
            content: "Bài viết rất hay.",
            timestamp: "1 giờ trước",
        },

        {
            id: 2,
            parentId: 1,
            author: "Trần Văn C",
            content: "Đồng ý với bạn.",
            timestamp: "50 phút trước",
        },

        {
            id: 3,
            parentId: 2,
            author: "Lê Văn D",
            content: "Mình cũng nghĩ vậy.",
            timestamp: "40 phút trước",
        },

        {
            id: 4,
            author: "Phạm Văn E",
            content: "Có góc nhìn khác không?",
            timestamp: "20 phút trước",
        },
    ],

    2: [
        {
            id: 3,
            author: "Lê Văn D",
            content: "Thông tin rất hữu ích.",
            timestamp: "20 phút trước",
            replies: [],
        },
    ],

};

export default mockComments;