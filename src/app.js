const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const auth = require('./auth');
const { createBot, stopBot } = require('./bot');
const axios = require('axios');
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;

dotenv.config();
const app = express();
const PORT = process.env.PORT || 2888;

// Create Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.connect().catch(console.error);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    }
}));

// Authentication route
app.post('/api/auth', async (req, res) => {
    const { token, turnstileToken } = req.body;

    if (!token || !turnstileToken) {
        return res.status(400).json({ success: false, message: 'Token and Turnstile token are required' });
    }

    try {
        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: turnstileToken }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (!response.data.success) {
            return res.status(400).json({ success: false, message: 'Turnstile verification failed' });
        }
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return res.status(500).json({ success: false, message: 'Error verifying Turnstile token' });
    }

    if (auth.validateToken(token)) {
        req.session.botToken = token;
        await redisClient.sAdd('online_bots', token);  // Store bot token in Redis
        return res.json({ success: true });
    } else {
        return res.json({ success: false, message: 'Invalid token' });
    }
});

// Bot status route
app.post('/api/bot', async (req, res) => {
    const { token, status } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    if (status) {
        createBot(token);
        await redisClient.sAdd('online_bots', token);  // Add bot to Redis set
        return res.json({ message: `Bot with token ${token} is now Online` });
    } else {
        stopBot(token);
        await redisClient.sRem('online_bots', token);  // Remove bot from Redis set
        return res.json({ message: `Bot with token ${token} is now Offline` });
    }
});

// API to get the number of online bots
app.get('/api/online-bots', async (req, res) => {
    try {
        const botCount = await redisClient.sCard('online_bots');  // Get count
        return res.json({ onlineBots: botCount });
    } catch (error) {
        console.error('Error fetching online bots:', error);
        return res.status(500).json({ message: 'Error fetching online bots' });
    }
});

// Restart bots on server restart
async function restartOnlineBots() {
    try {
        const bots = await redisClient.sMembers('online_bots');  // Get all online bots
        for (const token of bots) {
            console.log(`Restarting bot with token: ${token}`);
            createBot(token);
        }
    } catch (error) {
        console.error("Error retrieving online bots from Redis:", error);
    }
}

restartOnlineBots();

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
