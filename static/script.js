document.getElementById('sendBtn').addEventListener('click', askBot);
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') askBot();
});

async function askBot() {
    const inputField = document.getElementById('userInput');
    const userText = inputField.value.trim();
    if (!userText) return;

    appendMessage(userText, 'user');
    inputField.value = '';

    try {
        const response = await fetch('/api/ask', {  // 🔥 Corrected endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })  // 🔥 Corrected key
        });

        const data = await response.json();
        appendBotMessage(data.reply);  // ✨ New typing function for bot
    } catch (error) {
        appendBotMessage("⚠️ Error connecting to server.");
    }
}

function parseMarkdown(text) {
    // Convert **bold**
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Convert *italic*
    text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<i>$1</i>');
    // Convert __underline__
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');
    return text;
}

function appendMessage(message, sender) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = parseMarkdown(message);  
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ✨ NEW function for bot messages with typing effect
function appendBotMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    chatBox.appendChild(msgDiv);

    let index = 0;

    function type() {
        if (index < message.length) {
            msgDiv.innerText += message.charAt(index);  // Type plain text
            index++;
            setTimeout(type, 25); // typing speed
        } else {
            // After complete typing, parse into bold/italic
            msgDiv.innerHTML = parseMarkdown(msgDiv.innerText);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
    type();
}

/* 🌙 Theme Toggle */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sendIcon = document.getElementById('sendIcon');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        themeIcon.src = 'static/Moon.png';
        sendIcon.src = 'static/senddark.png';
    } else {
        themeIcon.src = 'static/Sun.png';
        sendIcon.src = 'static/sendlight.png';
    }
});

/* Main Menu Button Functionality */
const mainMenuBtn = document.getElementById('mainMenuBtn');
const menuIcon = document.getElementById('menuIcon');
const mainMenuPopup = document.getElementById('mainMenuPopup');
const newChatBtn = document.getElementById('newChatBtn');
const continueChatBtn = document.getElementById('continueChatBtn');
const closePopupBtn = document.getElementById('closePopupBtn');

mainMenuBtn.addEventListener('click', () => {
    mainMenuPopup.style.display = 'block';
});

closePopupBtn.addEventListener('click', () => {
    mainMenuPopup.style.display = 'none';
});

newChatBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    mainMenuPopup.style.display = 'none';
});

continueChatBtn.addEventListener('click', () => {
    mainMenuPopup.style.display = 'none';
});

function updateMenuIcon() {
    if (document.body.classList.contains('dark-mode')) {
        menuIcon.src = 'static/Menudark.png';
    } else {
        menuIcon.src = 'static/Menulight.png';
    }
}

// Update menu icon on theme change
const observer = new MutationObserver(updateMenuIcon);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

// Set correct menu icon on page load
updateMenuIcon();
