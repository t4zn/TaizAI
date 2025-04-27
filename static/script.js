// 📥 Elements
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const micBtn = document.getElementById('micBtn');
const micIcon = document.getElementById('micIcon');
const sendIcon = document.getElementById('sendIcon');
const themeIcon = document.getElementById('themeIcon');
const menuIcon = document.getElementById('menuIcon');

// 🌎 Global recognition + recording state
let recognition;
let isRecording = false;

// 🖱️ Send button & Enter key
sendBtn.addEventListener('click', askBot);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') askBot();
});

// 🎙️ Mic button
micBtn.addEventListener('click', toggleListening);

// 🚀 Ask Bot
async function askBot() {
    const userText = userInput.value.trim();
    if (!userText) return;

    appendMessage(userText, 'user');
    userInput.value = '';

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

// ✍️ Escape HTML
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

// ✨ Parse Markdown
function parseMarkdown(text) {
    return text
        .replace(/^\*\s+/gm, '<br>• ')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/(?<!\w)\*(.*?)\*(?!\w)/g, '<i>$1</i>')
        .replace(/__(.*?)__/g, '<u>$1</u>');
}

// 💬 Append User Message
function appendMessage(message, sender) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = parseMarkdown(escapeHtml(message));
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 🤖 Append Bot Message (typing effect)
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
            addCopyButton(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
    type();
}

// 🌙 Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    updateThemeIcons();
    updateMicIcon(); // 🔥 Also update mic/stop icon after theme change
});

function updateThemeIcons() {
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.src = 'static/Moon.png';
        sendIcon.src = 'static/senddark.png';
        micIcon.src = isRecording ? 'static/stopdark.png' : 'static/micdark.png';
        menuIcon.src = 'static/Menudark.png';
    } else {
        themeIcon.src = 'static/Sun.png';
        sendIcon.src = 'static/sendlight.png';
        micIcon.src = isRecording ? 'static/stoplight.png' : 'static/miclight.png';
        menuIcon.src = 'static/Menulight.png';
    }
}

// 📋 Main Menu
const mainMenuBtn = document.getElementById('mainMenuBtn');
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

// 📋 Copy Button
function addCopyButton(botMessageDiv) {
    const copyContainer = document.createElement('div');
    copyContainer.className = 'copy-container';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';

    const copyIcon = document.createElement('img');
    updateCopyIcon(copyIcon);
    copyIcon.alt = 'Copy';

    copyBtn.appendChild(copyIcon);
    copyContainer.appendChild(copyBtn);
    botMessageDiv.appendChild(copyContainer);

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(botMessageDiv.innerText)
            .then(() => {
                copyIcon.style.opacity = '0.3';
                setTimeout(() => {
                    copyIcon.style.opacity = '1';
                }, 1200);
            })
            .catch(err => console.error('Copy failed', err));
    });

    const observer = new MutationObserver(() => updateCopyIcon(copyIcon));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

function updateCopyIcon(copyIcon) {
    copyIcon.src = document.body.classList.contains('dark-mode') ? 'static/copydark.png' : 'static/copylight.png';
}

// 🎤 Voice Input (toggle mode)
function toggleListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Sorry, your browser doesn't support speech recognition.");
        return;
    }

    if (isRecording) {
        recognition.stop();
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    isRecording = true;
    updateMicIcon();

    recognition.addEventListener('result', (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value += (userInput.value ? ' ' : '') + transcript;
    });

    recognition.addEventListener('error', (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecognition();
    });

    recognition.addEventListener('end', () => {
        stopRecognition();
    });
}

// 🔁 Helper to stop recording and reset icon
function stopRecognition() {
    isRecording = false;
    updateMicIcon();
}

function updateMicIcon() {
    if (document.body.classList.contains('dark-mode')) {
        micIcon.src = isRecording ? 'static/stopdark.png' : 'static/micdark.png';
    } else {
        micIcon.src = isRecording ? 'static/stoplight.png' : 'static/miclight.png';
    }
}
