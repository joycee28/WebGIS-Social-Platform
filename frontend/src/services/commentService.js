import mockComments
    from "../data/mockComments";

export async function getComments(
    postId
) {

    return Promise.resolve(
        mockComments[postId] || []
    );
}

export async function createComment(
    postId,
    content
) {

    return Promise.resolve({

        id: Date.now(),

        author: "Bạn",

        content,

        timestamp: "Vừa xong",

        replies: [],
    });
}