require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const botTelegram = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
var qrcode = require('qrcode-terminal');

function generateID(length) {
    const char = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * char.length);
        result += char.charAt(randomIndex);
    }

    return result;
}
exports.generateID = generateID;

async function generateQRCode(qr) {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(qr, { small: true }, (err, dataURI) => {
            if (err) {
                reject(err);
            } else {
                resolve(dataURI);
            }
        });
    });
}
exports.generateQRCode = generateQRCode;

function sendTelegramLog(messagelog){
    if (process.env.LOG_TELEGRAM_ENABLE == "TRUE"){
        botTelegram.sendMessage(process.env.TELEGRAM_CHATID, messagelog)
    } else {
        console.log(messagelog)
    }
}
exports.sendTelegramLog = sendTelegramLog;