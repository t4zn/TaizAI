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
        appendMessage(data.reply, 'bot');  // 🔥 Corrected field
    } catch (error) {
        appendMessage("⚠️ Error connecting to server.", 'bot');
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

/* 🌙 Theme Toggle */
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        themeToggle.textContent = '🌙';
    } else {
        themeToggle.textContent = '☀️';
    }
});

/* Main Menu Button Functionality */
const mainMenuBtn = document.getElementById('mainMenuBtn');
const mainMenuPopup = document.getElementById('mainMenuPopup');
const newChatBtn = document.getElementById('newChatBtn');
const continueChatBtn = document.getElementById('continueChatBtn');
const closePopupBtn = document.getElementById('closePopupBtn');
const chatBox = document.getElementById('chatBox');

mainMenuBtn.addEventListener('click', () => {
    // Show the popup when the menu button is clicked
    mainMenuPopup.style.display = 'block';
});

closePopupBtn.addEventListener('click', () => {
    // Close the popup when the "Close" button is clicked
    mainMenuPopup.style.display = 'none';
});

newChatBtn.addEventListener('click', () => {
    // Clear the chat history to start a new chat
    chatBox.innerHTML = '';
    mainMenuPopup.style.display = 'none';
});

continueChatBtn.addEventListener('click', () => {
    // Close the popup and continue chatting
    mainMenuPopup.style.display = 'none';
});
