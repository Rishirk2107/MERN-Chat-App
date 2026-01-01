const usedStrings = new Set();

function generateRandomString(length = 25, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    if (usedStrings.has(randomString)) {
        // Recursively call until a unique string is generated
        return generateRandomString(length, charset);
    } else {
        usedStrings.add(randomString);
        return randomString;
    }
}

module.exports = { generateRandomString };