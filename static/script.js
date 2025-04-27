// Send button click and Enter keypress
document.getElementById('send-btn').addEventListener('click', askBot);
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') askBot();
});

// Asking Bot
async function askBot() {
    const inputField = document.getElementById('user-input');
    const userText = inputField.value.trim();
    if (!userText) return;

    appendMessage(userText, 'user');
    inputField.value = '';

    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });

        const data = await response.json();
        appendMessage(data.reply, 'bot');
    } catch (error) {
        appendMessage("⚠️ Error connecting to server.", 'bot');
    }
}

// Markdown Parser
function parseMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<i>$1</i>');
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');
    return text;
}

// Appending Messages
function appendMessage(message, sender) {
    const chatContainer = document.getElementById('chat-container');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = parseMarkdown(message);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/* 🌙 Theme Toggle, Menu Icon & Send Icon Change */
const themeToggle = document.getElementById('theme-toggle');
const menuBtn = document.getElementById('menu-btn');
const sendIcon = document.getElementById('send-icon');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        themeToggle.src = 'moon.png';
        menuBtn.src = 'menudark.png';
        sendIcon.src = 'senddark.png';
    } else {
        themeToggle.src = 'sun.png';
        menuBtn.src = 'menulight.png';
        sendIcon.src = 'sendlight.png';
    }
});

/* 🍔 Main Menu Popup Handling (if you still want it) */
const mainMenuBtn = document.getElementById('menu-btn');
const mainMenuPopup = document.getElementById('mainMenuPopup');
const newChatBtn = document.getElementById('newChatBtn');
const continueChatBtn = document.getElementById('continueChatBtn');
const closePopupBtn = document.getElementById('closePopupBtn');

mainMenuBtn.addEventListener('click', () => {
    if (mainMenuPopup) mainMenuPopup.style.display = 'block';
});

closePopupBtn?.addEventListener('click', () => {
    if (mainMenuPopup) mainMenuPopup.style.display = 'none';
});

newChatBtn?.addEventListener('click', () => {
    document.getElementById('chat-container').innerHTML = '';
    if (mainMenuPopup) mainMenuPopup.style.display = 'none';
});

continueChatBtn?.addEventListener('click', () => {
    if (mainMenuPopup) mainMenuPopup.style.display = 'none';
});
