const { Client, LocalAuth, MessageMedia, } = require('whatsapp-web.js')
const { getRedirectURL, getIdVideo, getVideoNoWM, downloadMediaFromList } = require('./features/tiktok-function');
const { aboutClient } = require('./features/whatsapp-function');
const { generateID } = require('./features/generateID');
const { DateTime } = require('luxon');
const { getCTFScheduleEventData, formatDateTime } = require('./features/ctf-function');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const chalk = require("chalk");
const puppeteer = require("puppeteer");
const axios = require("axios");
const Spinnies = require('spinnies')
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

// const botToken = '6624272343:AAGOLrO95beNNm4Ca6fsLs3-hg5GAa0Gek4';
// const botTelegramToken = process.env.TELEGRAM_TOKEN;
// const chatId = process.env.TELEGRAM_CHATID;
// const botTelegram = new TelegramBot(botTelegramToken, { polling: true });

const spinnies = new Spinnies();
const ffmpegPath = ffmpeg.path;
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one",
        dataPath: "./cookieSessions"
    }),
    ffmpegPath,
    puppeteer: {
        args: ['--no-sandbox'],
        headless: false
    }
});

var qrcode = require('qrcode-terminal');

client.initialize();

spinnies.add("Loading", { text: "Opening WhatsApp Web..." });
// axios.post(apiTelegramUrl,{chat_id: chatId, text: `Booting AANNR WhatsApp bot... `})
// botTelegram.sendMessage(chatId, "TES123")
client.on("loading_screen", (percent, message) => {
    spinnies.update("Loading", { text: `Status: ${message} ${percent}%` });
    // axios.post(apiTelegramUrl,{chat_id: chatId, text: `Status: ${message} ${percent}%`})
})

client.on("qr", (qr) => {
    spinnies.add("GeneratedQR", { text: "Generating a QR Code..." });
    console.log(chalk.greenBright("[!] Scan this QR to Login"));
    qrcode.generate(qr, { small: true });
    spinnies.succeed("GeneratedQR", { text: "QR Code Generated." });
    // axios.post(apiTelegramUrl,{chat_id: chatId, text: `QR Code Generated. Please scan on CLI`})
    spinnies.update("Loading", { text: "Waiting to scan" });
});

client.on('auth_failure', (msg) => {
    spinnies.fail("Loading", { text: `✗ Authentication failure: : ${msg}` });
    // axios.post(apiTelegramUrl,{chat_id: chatId, text: `✗ Authentication failure: : ${msg}`})
});

client.on("ready", () => {
    spinnies.succeed("Loading", { text: "Bot Connected!", succeedColor: 'greenBright' })
    // axios.post(apiTelegramUrl,{chat_id: chatId, text: `Bot Connected!`})
    aboutClient(client)
    console.log("Log messages: \n")
})

client.on("message", async (msg) => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    console.log(chalk.yellowBright(`💬 ${contact.pushname} : ${msg.body}`));
    // axios.post(apiTelegramUrl,{chat_id: chatId, text: `💬 [${contact.number}] - ${contact.pushname}: ${msg.body}`})

    try {
        if (msg.body === "!sticker"){
            if(msg.hasMedia){
                const media = await msg.downloadMedia();
                const idSticker = await generateID(9);
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
            if (!linkTiktokURL){
                msg.reply("_Error: Please provide a link. Ex: '!tiktok https: https://vt.tiktok.com/example/'_")
                return;
            }
            const redirectURL = await getRedirectURL(linkTiktokURL);
            msg.reply("_Downloading on process..._")
            if (redirectURL) {
                try{
                    const idVideo = await getIdVideo(redirectURL, msg);
                    const data = await getVideoNoWM(redirectURL, msg);
            
                    console.log(chalk.green(`[*] Downloading video 1 of 1`));
                    console.log(chalk.green(`[*] URL: ${data.url}`));
            
                    const listVideo = [data]; // Put the data into an array for easier processing
            
                    downloadMediaFromList(listVideo, chat, msg, contact).then(() => {
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
        } else if (msg.body.startsWith("aa!schedule ")) {
            let chat = await msg.getChat();
            if (chat.isGroup){
                let scheduleNumber = parseInt(msg.body.split(" ")[1]);
                if (!scheduleNumber){
                    scheduleNumber = 1;
                }
                const ctfData = await getCTFScheduleEventData(scheduleNumber);
                if (ctfData) {
                    const {
                        title, description, logo, ctftime_url, weight, format, url, id,
                        organizers, start, finish, duration
                    } = ctfData;
                
                    const jkt_tz = "Asia/Jakarta";
                    const startDateTime = DateTime.fromISO(start);
                    const finishDateTime = DateTime.fromISO(finish);
                    const startFormatted = formatDateTime(startDateTime, jkt_tz);
                    const finishFormatted = formatDateTime(finishDateTime, jkt_tz);
                    
                    const gambar = await MessageMedia.fromUrl(logo);
                    chat.sendMessage(gambar, {
                        caption: `${title} by ${organizers[0].name} [ID: ${id}]\n\n*Description*:\n${description}\n\nCTFTime URL: ${ctftime_url}\nWeight: ${weight}\nFormat: ${format}\n\nCTF URL: ${url}\nStart: ${startFormatted}\nFinish: ${finishFormatted}\nDuration: ${duration.days} day(s) ${duration.hours} hour(s)\n`
                    })
                }
            }
        }
    } catch (err) {
        console.log(chalk.red(err))
        // axios.post(apiTelegramUrl,{chat_id: chatId, text: `${err}`})
        return;
    }
})


