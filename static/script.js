// Send Button
document.getElementById('sendBtn').addEventListener('click', askBot);

// Enter Key
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') askBot();
});

// Ask Bot
async function askBot() {
    const inputField = document.getElementById('userInput');
    const userText = inputField.value.trim();
    if (!userText) return;

    appendUserMessage(userText);
    inputField.value = '';

    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });

        const data = await response.json();
        appendBotMessage(data.reply);
    } catch (error) {
        appendBotMessage("⚠️ Error connecting to server.");
    }
}

// Parse Markdown
function parseMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<i>$1</i>');
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');
    return text;
}

// Append User Message
function appendUserMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user';
    msgDiv.textContent = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Append Bot Message (with typing effect!)
function appendBotMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    chatBox.appendChild(msgDiv);

    let index = 0;
    let rawText = "";

    function type() {
        if (index < message.length) {
            rawText += message.charAt(index);
            msgDiv.textContent = rawText;
            index++;
            setTimeout(type, 25); // Speed of typing (adjust if needed)
        } else {
            msgDiv.innerHTML = parseMarkdown(rawText); // After full message typed
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

// Update Menu Icon with Theme
function updateMenuIcon() {
    if (document.body.classList.contains('dark-mode')) {
        menuIcon.src = 'static/Menudark.png';
    } else {
        menuIcon.src = 'static/Menulight.png';
    }
}
const observer = new MutationObserver(updateMenuIcon);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
updateMenuIcon(); // call once on load
