// Send button + Enter key trigger
document.getElementById('sendBtn').addEventListener('click', askBot);
document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') askBot();
});

// Send user message + get bot reply
async function askBot() {
    const inputField = document.getElementById('userInput');
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
        appendBotMessage(data.reply);
    } catch (error) {
        appendBotMessage("⚠️ Error connecting to server.");
    }
}

// Escape HTML to prevent issues during typing
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

// Basic Markdown (bold, italic, underline)
function parseMarkdown(text) {
    text = text.replace(/^\*\s+/gm, '<br>• ');
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<i>$1</i>');
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');
    return text;
}

// Smart Scroll function (fix scroll issue)
function smartScrollToBottom() {
    const chatBox = document.getElementById('chatBox');
    const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 50;
    if (isAtBottom) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Append user message immediately
function appendMessage(message, sender) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = parseMarkdown(escapeHtml(message));
    chatBox.appendChild(msgDiv);
    smartScrollToBottom(); // 👈 use smart scroll
}

// Append bot message with typing animation and copy button
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
            setTimeout(type, 15);
        } else {
            msgDiv.innerHTML = parseMarkdown(escapeHtml(rawText));
            addCopyButton(msgDiv); // Add copy button after typing finishes
            smartScrollToBottom(); // 👈 use smart scroll
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
    updateThemeIcons();
});

function updateThemeIcons() {
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.src = 'static/Moon.png';
        sendIcon.src = 'static/senddark.png';
        menuIcon.src = 'static/Menudark.png';
    } else {
        themeIcon.src = 'static/Sun.png';
        sendIcon.src = 'static/sendlight.png';
        menuIcon.src = 'static/Menulight.png';
    }
}

/* 📋 Main Menu Button */
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
    document.getElementById('chatBox').innerHTML = '';
    mainMenuPopup.style.display = 'none';
});
continueChatBtn.addEventListener('click', () => {
    mainMenuPopup.style.display = 'none';
});

// ------------------ COPY BUTTON BELOW BOT REPLY ------------------ //

function addCopyButton(botMessageDiv) {
    const copyContainer = document.createElement('div');
    copyContainer.classList.add('copy-container');

    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');

    const copyIcon = document.createElement('img');
    updateCopyIcon(copyIcon);

    copyIcon.alt = 'Copy';
    copyBtn.appendChild(copyIcon);
    copyContainer.appendChild(copyBtn);
    botMessageDiv.appendChild(copyContainer);

    copyBtn.onclick = () => {
        const textToCopy = botMessageDiv.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                copyIcon.style.opacity = '0.3';
                setTimeout(() => {
                    copyIcon.style.opacity = '1';
                }, 1200);
            })
            .catch(err => {
                console.error('Copy failed', err);
            });
    };

    const observer = new MutationObserver(() => updateCopyIcon(copyIcon));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

function updateCopyIcon(copyIcon) {
    if (document.body.classList.contains('dark-mode')) {
        copyIcon.src = 'static/copydark.png';
    } else {
        copyIcon.src = 'static/copylight.png';
    }
}
