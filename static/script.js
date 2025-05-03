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
    smartScrollToBottom(); // 
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
            smartScrollToBottom(); // 
        }
    }
    type();
}

/* Theme Toggle */
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

/* Main Menu Button */
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

// Speech Recognition Variables
let recognition;
let isRecording = false;
let audioContext;
let analyser;
let microphone;
let dataArray;
let animationFrameId;
let finalTranscript = "";
const micBtn = document.getElementById('micBtn');
const voiceWaveContainer = document.getElementById('voiceWaveContainer');
const bars = document.querySelectorAll('.bar');

// Initialize Speech Recognition
function initSpeechRecognition() {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error("Your browser doesn't support speech recognition. Try Chrome or Edge.");
        if (micBtn) micBtn.style.display = 'none';
        return;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = false; // Only get final results to avoid repetition
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';
}

// Start recording
function startRecording() {
    if (!recognition) initSpeechRecognition();
    
    // Save current input value
    const userInput = document.getElementById('userInput');
    finalTranscript = userInput.value || "";
    
    isRecording = true;
    
    // Set up new recognition session
    recognition.onresult = function(event) {
        // Get the last result (most accurate)
        const transcript = event.results[0][0].transcript;
        
        // Add a space if needed
        if (finalTranscript && finalTranscript.trim().length > 0 && 
            !finalTranscript.endsWith(' ') && !transcript.startsWith(' ')) {
            finalTranscript += ' ';
        }
        
        // Add new transcript to existing text
        finalTranscript += transcript;
        userInput.value = finalTranscript;
    };
    
    recognition.onend = function() {
        if (isRecording) {
            // Start a new session after a short delay
            setTimeout(() => {
                if (isRecording) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                    }
                }
            }, 300);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            // Just restart if no speech detected
            if (isRecording) {
                setTimeout(() => {
                    if (isRecording) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error restarting after no-speech:', e);
                        }
                    }
                }, 300);
            }
        } else if (event.error === 'aborted' || event.error === 'network') {
            // These are usually temporary, try to restart
            setTimeout(() => {
                if (isRecording) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error('Error restarting after abort/network error:', e);
                    }
                }
            }, 500);
        } else {
            // For other errors, stop recording
            stopRecording();
        }
    };
    
    // Start recognition
    try {
        recognition.start();
        console.log('Speech recognition started');
        
        // Show voice wave container
        voiceWaveContainer.style.display = 'flex';
        
        // Initialize audio context for visualization
        if (!audioContext) {
            initAudioContext();
        } else if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Change microphone button appearance
        micBtn.classList.add('active');
    } catch (e) {
        console.error('Error starting recognition:', e);
    }
}

// Stop recording
function stopRecording() {
    isRecording = false;
    
    // Stop speech recognition
    if (recognition) {
        try {
            recognition.abort();
        } catch (e) {
            console.error('Error stopping recognition:', e);
        }
    }
    
    // Hide voice wave container
    voiceWaveContainer.style.display = 'none';
    
    // Stop audio visualization
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Disconnect microphone if connected
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    // Reset microphone button appearance
    micBtn.classList.remove('active');
}

// Initialize Audio Context for waveform visualization
function initAudioContext() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7; // Smoother transitions
        
        // Get microphone access
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                // Connect microphone to analyser
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                
                // Create data array for frequency analysis
                dataArray = new Uint8Array(analyser.frequencyBinCount);
                
                // Start visualizing
                visualizeAudio();
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
                stopRecording();
            });
    } catch (err) {
        console.error('Error initializing audio context:', err);
    }
}

// Visualize audio data
function visualizeAudio() {
    if (!isRecording) return;
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Determine if there's actual speech (threshold detection)
    const isSpeaking = average > 10; // Adjust threshold as needed
    
    // Update each bar's height based on volume
    bars.forEach((bar, index) => {
        if (isSpeaking) {
            // Use different frequency bands for each bar
            const bandIndex = Math.floor(index * (dataArray.length / bars.length));
            const frequencyValue = dataArray[bandIndex];
            
            // Scale height based on frequency value (min 3px, max 20px)
            const height = 3 + ((frequencyValue / 255) * 17);
            bar.style.height = `${height}px`;
        } else {
            // When silent, keep bars at minimum height
            bar.style.height = '3px';
        }
    });
    
    // Continue animation
    animationFrameId = requestAnimationFrame(visualizeAudio);
}

// Initialize speech recognition when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Event listeners for microphone button
    if (micBtn) {
        micBtn.addEventListener('click', function() {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }
});
