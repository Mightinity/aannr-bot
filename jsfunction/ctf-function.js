async function getCTFScheduleEventData(scheduleNumber) {
    try {
        const response = await fetch(`https://ctftime.org/api/v1/events/?limit=${scheduleNumber}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
            }
        });
        const json_data = await response.json();
        return json_data[scheduleNumber-1];
    } catch (error) {
        console.error("Error fetching CTF data:", error);
        return null;
    }
}

function formatDateTime(dt, tz) {
    return dt.setZone(tz).toFormat("EEEE, dd LLLL yyyy, HH mm 'WIB'");
}

module.exports = { getCTFScheduleEventData, formatDateTime }
