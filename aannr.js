const { Client, LocalAuth, } = require('whatsapp-web.js')
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const chalk = require("chalk");
const puppeteer = require("puppeteer");
const { getRedirectURL, getIdVideo, getVideoNoWM, downloadMediaFromList } = require('./features/tiktok-function');
const { aboutClient, generateIDSticker } = require('./features/whatsapp-function');
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
        } else if (msg.body.startsWith("!instagram ")) {
            const linkInstagramURL = msg.body.split(" ")[1];
            if (!linkInstagramURL){
                msg.reply("_Error: please provide a link. Ex: '!instagram https://www.instagram.com/(p/reel/tv)/example/'_");
                return;
            }
            
            
        }
    } catch (err) {
        console.log(chalk.red(err))
        return;
    }
})
