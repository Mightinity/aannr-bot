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
