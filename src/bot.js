const Eris = require('eris');
const keepAlive = require('./keepAlive'); // Import keepAlive
const bots = {}; // Store all bots with their tokens

keepAlive(); // Start the keep-alive server

function createBot(token) {
    if (bots[token]) {
        console.log(`Bot with token ${token} is already online!`);
        return;
    }

    const bot = new Eris(token, {
        autoReconnect: true, // Automatically reconnect if the bot disconnects
        maxReconnectAttempts: Infinity, // Retry indefinitely
        maxReconnectInterval: 5000, // 5 seconds between reconnect attempts
    });

    bots[token] = bot;

    bot.on('ready', () => {
        console.log(`Bot logged in as ${bot.user.username}`);
    });

    bot.on('error', (err) => {
        console.error(`Error for bot with token ${token}:`, err.message);
    });

    bot.on('disconnect', () => {
        console.warn(`Bot with token ${token} disconnected! Reconnecting...`);
    });

    bot.connect().catch(() => {
        console.log(`Invalid Token for ${token}`);
        stopBot(token);
    });
}

function stopBot(token) {
    if (bots[token]) {
        bots[token].disconnect();
        console.log(`Bot with token ${token} Offline`);
        delete bots[token];
    } else {
        console.log(`Bot with token ${token} not found`);
    }
}

module.exports = { createBot, stopBot };