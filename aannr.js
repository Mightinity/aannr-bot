const { Client, LocalAuth, MessageMedia, } = require('whatsapp-web.js')
const { getRedirectURL, getIdVideo, getVideoNoWM, downloadMediaFromList } = require('./features/tiktok-function');
const { aboutClient } = require('./features/whatsapp-function');
const { generateID } = require('./features/essentials');
const { DateTime } = require('luxon');
const { getCTFScheduleEventData, formatDateTime } = require('./features/ctf-function');
const { getCPUInfo, getUpTime, getMemoryInfo } = require('./features/serverinfo-function');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const chalk = require("chalk");
const puppeteer = require("puppeteer");
const axios = require("axios");
const Spinnies = require('spinnies')
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const botToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHATID;
const botTelegram = new TelegramBot(botToken, { polling: false });

const spinnies = new Spinnies();
const ffmpegPath = ffmpeg.path;
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one",
        dataPath: "./cookieSessions"
    }),
    ffmpegPath,
    puppeteer: {
        args: ['--no-sandbox']
    }
});

var qrcode = require('qrcode-terminal');

client.initialize();

const startTimeBooting = Date.now()
spinnies.add("Loading", { text: "Opening WhatsApp Web..." });
if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, "Booting AANNR WhatsApp bot..."); else console.log(chalk.greenBright("Booting AANNR WhatsApp bot..."));
client.on("loading_screen", (percent, message) => {
    spinnies.update("Loading", { text: `Status: ${message} ${percent}%` });
    if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `Status: ${message} ${percent}%`);
})

client.on("qr", (qr) => {
    spinnies.add("GeneratedQR", { text: "Generating a QR Code..." });
    console.log(chalk.greenBright("[!] Scan this QR to Login"));
    qrcode.generate(qr, { small: true });
    spinnies.succeed("GeneratedQR", { text: "QR Code Generated." });
    if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `QR Code Generated. Please scan on CLI`);
    spinnies.update("Loading", { text: "Waiting to scan" });
});

client.on('auth_failure', (msg) => {
    spinnies.fail("Loading", { text: `✗ Authentication failure: : ${msg}` });
    if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `✗ Authentication failure: : ${msg}`);
});

client.on("ready", () => {
    const finishTimeBooting = Date.now()
    const elapsedTimeSeconds = (finishTimeBooting - startTimeBooting) / 1000;
    spinnies.succeed("Loading", { text: "AANNR BOT online and ready to use!", succeedColor: 'greenBright' })
    if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `AANNR BOT online and ready to use!\n\nTime Booting: ${elapsedTimeSeconds} second(s)`);
    aboutClient(client)
    console.log("Log messages: \n")
})

client.on("message", async (msg) => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    console.log(chalk.yellowBright(`💬 ${contact.pushname} : ${msg.body}`));
    if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `💬 [${contact.number}] - ${contact.pushname}: ${msg.body}`);

    try {
        if (msg.body.startsWith("!sticker")){
            const idSticker = await generateID(16);
            let titleStickerName = idSticker;
            if(msg.hasMedia){
                if (msg.body[8] === " "){
                    try {
                        titleStickerName = msg.body.split(" ")[1].slice(0, 16);
                    } catch (err) {
                        msg.reply("Caught Error, check log messages or contact an administrator")
                        if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `Caught Error aa!schedule: ${err}`);
                        return;
                    }
                }
                const media = await msg.downloadMedia();
                chat.sendMessage(media, {
                    sendMediaAsSticker: true,
                    stickerName: titleStickerName,
                    stickerAuthor: "44nnr-bot",
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
            
                    const listVideo = [data];
            
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
        } else if (msg.body.startsWith("aa!schedule")) {
            let chat = await msg.getChat();
            if (chat.isGroup){
                let scheduleNumber = 1;
                if (msg.body[11] === " "){
                    try {
                        scheduleNumber = parseInt(msg.body.split(" ")[1]);
                    } catch (err) {
                        chat.sendMessage("Caught Error, check log messages or contact an administrator")
                        if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `Caught Error aa!schedule: ${err}`);
                        return;
                    }
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
                        caption: `${title} by ${organizers[0].name} [ID: ${id}]\n\n*Description*:\n${description}\n\n*CTFTime URL:* ${ctftime_url}\n*Weight:* ${weight}\n*Format:* ${format}\n\n*CTF URL:* ${url}\n*Start:* ${startFormatted}\n*Finish:* ${finishFormatted}\n*Duration:* ${duration.days} day(s) ${duration.hours} hour(s)\n`
                    })
                }
            }
        } else if (msg.body === "aa!serverinfo"){
            let chat = await msg.getChat()
            if (chat.isGroup){
                const valuekB = 1048576;
                
                cpuData = getCPUInfo()
                upTimeDevice = getUpTime()

                const totalMemory = parseFloat((getMemoryInfo().total / valuekB).toFixed(2));
                const cacheMemory = parseFloat((getMemoryInfo().cache / valuekB).toFixed(2));
                const freeMemory = parseFloat((getMemoryInfo().cache / valuekB).toFixed(2));
                const usedMemory = parseFloat((totalMemory - (cacheMemory + freeMemory)).toFixed(2));
                const memoryPercent = parseFloat((((usedMemory + cacheMemory) / totalMemory) * 100).toFixed(1));

                msg.reply(`*CPU Information*:\n - CPU Name: ${cpuData.name}\n - CPU Core: ${cpuData.cores}\n - CPU Threads: ${cpuData.threads}\n\n*Memory Information:*\n - Memory Total: ${totalMemory} GB\n - Memory Used: ${usedMemory} GB\n - Memory Cache: ${cacheMemory} GB\n - Free Memory: ${freeMemory} GB\n - Memory Usage: ${memoryPercent}%\n\n Uptime: ${upTimeDevice}`)
                

            }

        // } else if (msg.body.startsWith("ll")){
        //     if (msg.body[2] === " "){
        //         msg.reply("Mengandung spasi");
        //     } else {
        //         msg.reply("Tidak mengandung spasi");
        //     }
        }
    } catch (err) {
        console.log(chalk.red(err))
        if (process.env.LOG_TELEGRAM_ENABLE === "TRUE") botTelegram.sendMessage(chatId, `Caught Error: ${err}`);
        return;
    }
})