const chalk = require("chalk");

function aboutClient(client) {
    console.log(chalk.cyan(
        '\nAbout Client :' +
        '\n  - Username : ' + client.info.pushname +
        '\n  - Phone    : ' + client.info.wid.user +
        '\n  - Platform : ' + client.info.platform + '\n'
    ));
}
exports.aboutClient = aboutClient;
;
function generateIDSticker(length) {
    const char = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * char.length);
        result += char.charAt(randomIndex);
    }

    return result;
}
exports.generateIDSticker = generateIDSticker;
