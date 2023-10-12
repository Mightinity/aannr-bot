const { MessageMedia } = require("whatsapp-web.js");
const fetch = require("node-fetch");
const fs = require("fs");
const { Headers } = require("node-fetch");

const headers = new Headers();
headers.append('User-Agent', 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet');
const headersWm = new Headers();
headersWm.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36');

const getRedirectURL = async (url, msg) => {
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
        const response = await fetch(url, {
            redirect: "follow",
            follow: 10,
        });
        return response.url; // Return the final redirected URL
    }
    return url;
};
exports.getRedirectURL = getRedirectURL;

const getVideoNoWM = async (url, msg) => {
    const idVideo = await getIdVideo(url, msg);
    const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
    const request = await fetch(API_URL, {
        method: "GET",
        headers: headers
    });
    const body = await request.text();
    try {
        var res = JSON.parse(body);
    } catch (err) {
        console.error("Error:", err);
        console.error("Response body:", body);
    }
    const urlMedia = res.aweme_list[0].video.play_addr.url_list[0];
    const data = {
        url: urlMedia,
        id: idVideo
    };
    return data;
};
exports.getVideoNoWM = getVideoNoWM;

const getIdVideo = (url, msg) => {
    const matching = url.includes("/video/");
    if (!matching) {
        throw new Error("URL not found");
    }
    const idVideo = url.substring(url.indexOf("/video/") + 7, url.length);
    return idVideo.length > 19 ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
};
exports.getIdVideo = getIdVideo;

const downloadMediaFromList = async (list, chat, msg) => {
    const folder = "downloads/";

    const sendMediaPromises = list.map((item) => {
        const fileName = `${item.id}.mp4`;
        const downloadFile = fetch(item.url);
        return new Promise(async (resolve, reject) => {
            downloadFile
                .then((res) => {
                    const file = fs.createWriteStream(folder + fileName);
                    res.body.pipe(file);
                    file.on("finish", () => {
                        file.close();
                        msg.reply("_Downloaded Successfully_");
                        const media = MessageMedia.fromFilePath(`${folder}${fileName}`);
                        chat.sendMessage(media, {
                            sendMediaAsDocument: true,
                            caption: "Enjoy your video :)"
                        });

                        resolve();
                    });
                    file.on("error", (err) => reject(err));
                })
                .catch(reject);
        });
    });
    try {
        await Promise.all(sendMediaPromises);
    } catch (err) {
        console.error("[X] Error: " + err);
    }
};
exports.downloadMediaFromList = downloadMediaFromList;
