async function authenticate() {
    const token = document.getElementById('botToken').value;
    const turnstileToken = turnstile.getResponse(); // Correct way to get the Turnstile token

    if (!token) return alert("Please enter a bot token!");
    if (!turnstileToken) return alert("Please complete the Turnstile verification!");

    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, turnstileToken })
    });

    const data = await response.json();
    if (data.success) {
        localStorage.setItem('botToken', token);
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('home-section').style.display = 'block';
    } else {
        alert("Invalid token!");
    }
}

async function toggleBot(status) {
    const token = localStorage.getItem('botToken');  // Get token from localStorage instead of input
    if (!token) return alert("Please log in first!");

    const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, status: status })
    });

    const data = await response.json();
    alert(data.message);
}

function logout() {
    toggleBot(false);
    localStorage.removeItem('botToken');
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('home-section').style.display = 'none';
}

async function fetchOnlineBots() {
    const response = await fetch('/api/online-bots');
    const data = await response.json();
    const botCountElement = document.getElementById('bot-count');

    const newCount = data.onlineBots;
    const oldCount = parseInt(botCountElement.innerText, 10);

    if (newCount !== oldCount) {
        // Apply animation (scale up + fade out)
        botCountElement.style.transform = 'scale(1.3)';
        botCountElement.style.opacity = '0';

        setTimeout(() => {
            botCountElement.innerText = newCount;

            // Reset animation after updating the count
            botCountElement.style.transform = 'scale(1)';
            botCountElement.style.opacity = '1';
        }, 300);
    }
}

// Fetch bot count every 5 seconds
setInterval(fetchOnlineBots, 5000);
fetchOnlineBots(); // Fetch on page load