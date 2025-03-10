const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.send('Bot is running!');
});

function keepAlive() {
    server.listen(2777, () => {
        console.log('Server is ready to keep the bot alive.');
    });
}

module.exports = keepAlive;