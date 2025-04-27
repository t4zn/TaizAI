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
        appendBotMessage(data.reply);  // Typing effect here!
    } catch (error) {
        appendBotMessage("⚠️ Error connecting to server.");
    }
}

// Typing animation function
function typeText(element, text, speed = 30) {
    let index = 0;
    function type() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, speed);
        }
    }
    type();
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

// Normal user message (instant add)
function appendMessage(message, sender) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = parseMarkdown(message);  
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Bot message (animated typing add)
function appendBotMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    chatBox.appendChild(msgDiv);

    const parsedText = parseMarkdown(message);
    typeText(msgDiv, parsedText, 25);  // Adjust speed here (smaller = faster)
    
    chatBox.scrollTop = chatBox.scrollHeight;
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
const chatBox = document.getElementById('chatBox');

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

// Watch for theme changes and update menu icon
const observer = new MutationObserver(updateMenuIcon);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

// Set correct menu icon on load
updateMenuIcon();
