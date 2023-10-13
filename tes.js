const fetch = require('node-fetch');
const { DateTime } = require('luxon');

const url = "https://ctftime.org/api/v1/events/?limit=1";
const headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
};

async function getCTFEventData() {
    try {
        const response = await fetch(url, { headers });
        const json_data = await response.json();
        return json_data[0];
    } catch (error) {
        console.error("Error fetching CTF data:", error);
        return null;
    }
}

function formatDateTime(dt, tz) {
    return dt.setZone(tz).toFormat("EEEE, dd LLLL yyyy, HH mm 'WIB'");
}

function printCTFInfo(ctfData) {
    const {
        title, description, logo, ctftime_url, weight, format, url, id,
        organizers, start, finish, duration
    } = ctfData;

    const jkt_tz = "Asia/Jakarta";
    const startDateTime = DateTime.fromISO(start);
    const finishDateTime = DateTime.fromISO(finish);
    const startFormatted = formatDateTime(startDateTime, jkt_tz);
    const finishFormatted = formatDateTime(finishDateTime, jkt_tz);

    const durationDays = duration.days;
    const durationHours = duration.hours;

    console.log("Description:");
    console.log(`${description}\n`);
    console.log(`Title: ${title} by ${organizers[0].name} [ID: ${id}]`);
    console.log(`URL: ${ctftime_url}`);
    console.log(`Icon URL: ${logo}`);
    console.log(`Weight: ${weight}`);
    console.log(`Format: ${format}`);
    console.log(`URL CTF: ${url}`);
    console.log(`Start: ${startFormatted} <t:${startDateTime.toSeconds()}:R>`);
    console.log(`Finish: ${finishFormatted} <t:${finishDateTime.toSeconds()}:R>`);
    console.log(`Duration: ${durationDays} day(s) ${durationHours} hour(s)`);
    console.log("Beliauini Assist © 2023 - " + process.env.VERSION);
}

async function main() {
    const ctfData = await getCTFEventData();
    if (ctfData) {
        printCTFInfo(ctfData);
    }
}

main();
