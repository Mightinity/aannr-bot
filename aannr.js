const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const fetch = require("node-fetch");
const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { exit } = require("process");
const { resolve } = require("path");
const { reject } = require("lodash");
const {Headers} = require('node-fetch');
const readline = require('readline');

const Spinnies = require('spinnies')

const spinnies = new Spinnies();
const ffmpegPath = ffmpeg.path;
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "wabotv2",
        dataPath: "./cookieSessions"
    }),
    ffmpegPath,
    puppeteer: {
        args: ['--no-sandbox'],
        headless: false,
    }
});

const headers = new Headers();
headers.append('User-Agent', 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet');
const headersWm = new Headers();
headersWm.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36');


var qrcode = require('qrcode-terminal');
client.initialize();

spinnies.add("Loading", { text: "Opening WhatsApp Web..." });
client.on("loading_screen", (percent, message) => {
    spinnies.update("Loading", { text: `Status: ${message} ${percent}%` });
})

client.on("qr", (qr) => {
    spinnies.add("GeneratedQR", { text: "Generating a QR Code..." });
    console.log(chalk.greenBright("[!] Scan this QR to Login"));
    qrcode.generate(qr, { small: true });
    spinnies.succeed("GeneratedQR", { text: "QR Code Generated." });
    spinnies.update("Loading", { text: "Waiting to scan" });
});

client.on('auth_failure', (msg) => {
    spinnies.fail("Loading", { text: `✗ Authentication failure: : ${msg}` });
});

client.on("ready", () => {
    spinnies.succeed("Loading", { text: "Bot Connected!", succeedColor: 'greenBright' })
    aboutClient(client)
    console.log("Log messages: \n")
})

client.on("message", async (msg) => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    console.log(chalk.yellowBright(`💬 ${contact.pushname} : ${msg.body}`));

    try {
        if (msg.body === "!sticker"){
            if(msg.hasMedia){
                const media = await msg.downloadMedia();
                const idSticker = await generateIDSticker(9);
                chat.sendMessage(media, {
                    sendMediaAsSticker: true,
                    stickerName: `${contact.pushname}-[${idSticker}]`,
                    stickerAuthor: "percayajanji-bot",
                });
                msg.reply("_Sticker on process..._")
            } else {
                msg.reply("_Error: Send a images/media then !sticker_")
            }
        } else if (msg.body.startsWith("!tiktok ")) {
            const linkTiktokURL = msg.body.split(" ")[1];
            const redirectURL = await getRedirectURL(linkTiktokURL);
            msg.reply("_Downloading on process..._")
            if (redirectURL) {
                try{
                    const idVideo = await getIdVideo(redirectURL, msg);
                    const data = await getVideoNoWM(redirectURL, msg);
            
                    console.log(chalk.green(`[*] Downloading video 1 of 1`));
                    console.log(chalk.green(`[*] URL: ${data.url}`));
            
                    const listVideo = [data]; // Put the data into an array for easier processing
            
                    downloadMediaFromList(listVideo, chat, msg).then(() => {
                        console.log(chalk.green("[+] Downloaded successfully."));
                        msg.reply("_Uploading a video..._")
                    }).catch(err => {
                        console.log(chalk.red("[X] Error: " + err));
                        msg.reply("_Error:_ " + err + " Contact the administrator")
                    });
                } catch (err) {
                    msg.reply(err.message);
                    return;
                }
            }
        }
    } catch (err) {
        console.log(chalk.red(err))
        return;
    }
})

function aboutClient(client){
    console.log(chalk.cyan(                                                                                                                                                  
        '\nAbout Client :' +                                                                                                                                     
        '\n  - Username : ' + client.info.pushname +                                                                                                           
        '\n  - Phone    : ' + client.info.wid.user +                                                                                                       
        '\n  - Platform : ' + client.info.platform + '\n'
    ));
};

function generateIDSticker(length) {
    const char = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = ''

    for (let i = 0; i < length; i++){
        const randomIndex = Math.floor(Math.random() * char.length);
        result += char.charAt(randomIndex);
    }

    return result;
}

const getRedirectURL = async (url, msg) => {
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
        const response = await fetch(url, {
            redirect: "follow",
            follow: 10,
        });
        return response.url; // Return the final redirected URL
    }
    return url;
}


const getVideoNoWM = async (url, msg) => {
    const idVideo = await getIdVideo(url, msg)
    const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
    const request = await fetch(API_URL, {
        method: "GET",
        headers : headers
    });
    const body = await request.text();
        try {
            var res = JSON.parse(body);
        } catch (err) {
            console.error("Error:", err);
            console.error("Response body:", body);
        }
        const urlMedia = res.aweme_list[0].video.play_addr.url_list[0]
        const data = {
            url: urlMedia,
            id: idVideo
        }
        return data
}

const getIdVideo = (url, msg) => {
    const matching = url.includes("/video/");
    if(!matching) {
        throw new Error("URL not found");
    }
    const idVideo = url.substring(url.indexOf("/video/") + 7, url.length);
    return idVideo.length > 19 ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
};

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
                        msg.reply("_Downloaded Successfully_")
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
