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

