function normalizeMediaUrl(url) {
    if (!url) {
        return "";
    }

    const text = String(url);

    if (text.startsWith("/media/")) {
        return text;
    }

    if (text.startsWith("http://127.0.0.1:8000/media/")) {
        return text.replace("http://127.0.0.1:8000", "");
    }

    if (text.startsWith("http://localhost:8000/media/")) {
        return text.replace("http://localhost:8000", "");
    }

    if (text.startsWith("https://127.0.0.1:8000/media/")) {
        return text.replace("https://127.0.0.1:8000", "");
    }

    if (text.startsWith("https://localhost:8000/media/")) {
        return text.replace("https://localhost:8000", "");
    }

    return text;
}

export default normalizeMediaUrl;