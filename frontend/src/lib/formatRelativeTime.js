function parseDateValue(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : value;
    }

    const isoDate = new Date(value);

    if (!Number.isNaN(isoDate.getTime())) {
        return isoDate;
    }

    const matched = String(value)
        .trim()
        .match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/
        );

    if (!matched) {
        return null;
    }

    const [
        ,
        day,
        month,
        year,
        hour = "0",
        minute = "0",
    ] = matched;

    const fallbackDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
    );

    if (Number.isNaN(fallbackDate.getTime())) {
        return null;
    }

    return fallbackDate;
}

function formatRelativeTime(
    value,
    currentTime = Date.now()
) {
    const date = parseDateValue(value);

    if (!date) {
        return "Vừa xong";
    }

    let differenceInSeconds =
        (date.getTime() - currentTime) / 1000;

    if (
        differenceInSeconds > 0 &&
        differenceInSeconds < 60
    ) {
        differenceInSeconds = 0;
    }

    const absoluteSeconds = Math.abs(
        differenceInSeconds
    );

    if (absoluteSeconds < 10) {
        return "Vừa xong";
    }

    const formatter =
        new Intl.RelativeTimeFormat("vi", {
            numeric: "always",
        });

    if (absoluteSeconds < 60) {
        return formatter.format(
            Math.round(differenceInSeconds),
            "second"
        );
    }

    if (absoluteSeconds < 60 * 60) {
        return formatter.format(
            Math.round(
                differenceInSeconds / 60
            ),
            "minute"
        );
    }

    if (absoluteSeconds < 60 * 60 * 24) {
        return formatter.format(
            Math.round(
                differenceInSeconds /
                    (60 * 60)
            ),
            "hour"
        );
    }

    if (
        absoluteSeconds <
        60 * 60 * 24 * 7
    ) {
        return formatter.format(
            Math.round(
                differenceInSeconds /
                    (60 * 60 * 24)
            ),
            "day"
        );
    }

    if (
        absoluteSeconds <
        60 * 60 * 24 * 30
    ) {
        return formatter.format(
            Math.round(
                differenceInSeconds /
                    (60 * 60 * 24 * 7)
            ),
            "week"
        );
    }

    if (
        absoluteSeconds <
        60 * 60 * 24 * 365
    ) {
        return formatter.format(
            Math.round(
                differenceInSeconds /
                    (60 * 60 * 24 * 30)
            ),
            "month"
        );
    }

    return formatter.format(
        Math.round(
            differenceInSeconds /
                (60 * 60 * 24 * 365)
        ),
        "year"
    );
}

export default formatRelativeTime;