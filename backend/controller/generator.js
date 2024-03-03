const usedStrings = new Set();

function generateRandomString(charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let randomString = '';
    for (let i = 0; i < 25; i++) {
        randomString += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    if (usedStrings.has(randomString)) {
        return generateRandomString(length, charset); // Recursively call until a unique string is generated
    } else {
        usedStrings.add(randomString);
        return randomString;
    }
}

module.exports={generateRandomString};