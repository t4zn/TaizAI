// Send button + Enter key trigger
document.getElementById('sendBtn').addEventListener('click', askBot);
document.getElementById('userInput').addEventListener('keydown', function(e) {
    // Auto-resize the textarea based on content
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Send message on Ctrl+Enter or Shift+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
        e.preventDefault();
        askBot();
    }
    // Add a new line on plain Enter
    else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        // Let the default behavior happen (new line)
    }
});

document.getElementById('userInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Send user message + get bot reply
async function askBot() {
    // If recording is active, stop it first
    if (isRecording) {
        stopRecording();
    }
    
    const inputField = document.getElementById('userInput');
    const userText = inputField.value.trim();
    if (!userText) return;

    appendMessage(userText, 'user');
    inputField.value = '';
    
    // Reset textarea height
    inputField.style.height = 'auto';

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
            msgDiv.innerHTML = formatCodeBlocks(parseMarkdown(escapeHtml(rawText)));
            addCopyButton(msgDiv); // Add copy button after typing finishes
            smartScrollToBottom(); // 
        }
    }
    type();
}

// Function to detect and format code blocks with syntax highlighting
function formatCodeBlocks(text) {
    // Regex to match markdown code blocks with optional language
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    return text.replace(codeBlockRegex, function(match, language, code) {
        // Default to 'text' if no language specified
        language = language || 'text';
        
        // Create the code block HTML
        return createCodeBlockHTML(code, language);
    });
}

// Create HTML for a code block with syntax highlighting
function createCodeBlockHTML(code, language) {
    // Decode HTML entities in the code before highlighting
    code = decodeHtmlEntities(code);
    
    // Apply basic syntax highlighting based on language
    const highlightedCode = applySyntaxHighlighting(code, language);
    
    // Create the code block container
    return `
    <div class="code-block">
        <div class="code-header">
            <span class="code-language">${language.toUpperCase()}</span>
            <button class="code-copy-btn" onclick="copyCodeToClipboard(this)">Copy</button>
        </div>
        <pre class="code-content">${highlightedCode}</pre>
    </div>
    `;
}

// Decode HTML entities to restore special characters
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Apply syntax highlighting based on language
function applySyntaxHighlighting(code, language) {
    // First escape HTML to prevent XSS
    let escapedCode = escapeHtml(code);
    
    // Apply different highlighting rules based on language
    switch(language.toLowerCase()) {
        case 'javascript':
        case 'js':
            escapedCode = highlightJavaScript(escapedCode);
            break;
        case 'html':
            escapedCode = highlightHTML(escapedCode);
            break;
        case 'css':
            escapedCode = highlightCSS(escapedCode);
            break;
        case 'python':
        case 'py':
            escapedCode = highlightPython(escapedCode);
            break;
        case 'c':
        case 'cpp':
            escapedCode = highlightC(escapedCode);
            break;
        // Add more languages as needed
    }
    
    return escapedCode;
}

// Highlight JavaScript syntax with improved regex
function highlightJavaScript(code) {
    // Create a safe copy to work with
    let highlighted = code;
    
    // Keywords - use word boundaries to avoid partial matches
    const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'try', 'catch', 'async', 'await', 'new', 'this'];
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="keyword">$1</span>');
    });
    
    // Process strings - handle quotes carefully
    highlighted = highlighted.replace(/("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(`(?:\\.|[^`\\])*`)/g, match => {
        return `<span class="string">${match}</span>`;
    });
    
    // Comments - single line
    highlighted = highlighted.replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>');
    
    // Comments - multi line (non-greedy match)
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    
    // Functions - only match function names
    highlighted = highlighted.replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
    
    return highlighted;
}

// Highlight HTML syntax with improved regex
function highlightHTML(code) {
    // Create a safe copy to work with
    let highlighted = code;
    
    // Tags - opening and closing
    highlighted = highlighted.replace(/(&lt;\/?)([\w-]+)(?=[^&]*&gt;)/g, '$1<span class="tag">$2</span>');
    
    // Attributes
    highlighted = highlighted.replace(/\s([\w-]+)(?==)/g, ' <span class="attribute">$1</span>');
    
    // Attribute values
    highlighted = highlighted.replace(/(=)(".*?"|'.*?')/g, '$1<span class="string">$2</span>');
    
    return highlighted;
}

// Highlight CSS syntax with improved regex
function highlightCSS(code) {
    // Create a safe copy to work with
    let highlighted = code;
    
    // Selectors
    highlighted = highlighted.replace(/([\.\#]?[\w-]+)(?=\s*\{)/g, '<span class="tag">$1</span>');
    
    // Properties
    highlighted = highlighted.replace(/\s([\w-]+)(?=\s*:)/g, ' <span class="attribute">$1</span>');
    
    // Values - including colors
    highlighted = highlighted.replace(/:\s*([\w-]+|#[a-fA-F0-9]+)/g, ': <span class="string">$1</span>');
    
    // Units
    highlighted = highlighted.replace(/(\d+)(px|em|rem|%|vh|vw)/g, '<span class="number">$1</span><span class="keyword">$2</span>');
    
    // Comments
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    
    return highlighted;
}

// Highlight Python syntax with improved regex
function highlightPython(code) {
    // Create a safe copy to work with
    let highlighted = code;
    
    // Keywords
    const keywords = ['def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'];
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="keyword">$1</span>');
    });
    
    // Strings - single and double quotes
    highlighted = highlighted.replace(/("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')/g, match => {
        return `<span class="string">${match}</span>`;
    });
    
    // Comments
    highlighted = highlighted.replace(/(#[^\n]*)/g, '<span class="comment">$1</span>');
    
    // Functions
    highlighted = highlighted.replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
    
    return highlighted;
}

// Highlight C/C++ syntax with improved regex
function highlightC(code) {
    // Create a safe copy to work with
    let highlighted = code;
    
    // Keywords
    const keywords = ['int', 'char', 'float', 'double', 'void', 'struct', 'enum', 'typedef', 'const', 'static', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'include', 'define', 'main'];
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="keyword">$1</span>');
    });
    
    // Preprocessor directives
    highlighted = highlighted.replace(/(#\w+)/g, '<span class="keyword">$1</span>');
    
    // Strings
    highlighted = highlighted.replace(/("(?:\\.|[^"\\])*")/g, '<span class="string">$1</span>');
    
    // Comments - single line
    highlighted = highlighted.replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>');
    
    // Comments - multi line
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    
    // Functions
    highlighted = highlighted.replace(/\b(\w+)(?=\s*\()/g, '<span class="function">$1</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
    
    return highlighted;
}

// Function to copy code to clipboard
function copyCodeToClipboard(button) {
    const codeBlock = button.closest('.code-block');
    const codeContent = codeBlock.querySelector('.code-content');
    
    // Create a temporary textarea to copy the text
    const textarea = document.createElement('textarea');
    // Get the text content without HTML tags
    textarea.value = codeContent.textContent;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        // Copy the text
        document.execCommand('copy');
        
        // Visual feedback
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy code: ', err);
    } finally {
        document.body.removeChild(textarea);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Add the copyCodeToClipboard function to the window object
window.copyCodeToClipboard = copyCodeToClipboard;

/* Theme Toggle */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sendIcon = document.getElementById('sendIcon');

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
    
    // Theme toggle functionality
    const menuIcon = document.getElementById('menuIcon');
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update theme icon
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.src = 'static/Moon.png';
            // Update menu icon for dark mode
            if (menuIcon) menuIcon.src = 'static/Menudark.png';
            // Update send icon for dark mode
            if (sendIcon) sendIcon.src = 'static/senddark.png';
        } else {
            themeIcon.src = 'static/Sun.png';
            // Update menu icon for light mode
            if (menuIcon) menuIcon.src = 'static/Menulight.png';
            // Update send icon for light mode
            if (sendIcon) sendIcon.src = 'static/sendlight.png';
        }
    });
    
    // Check initial theme state and set icons accordingly
    if (document.body.classList.contains('dark-mode')) {
        if (themeIcon) themeIcon.src = 'static/Moon.png';
        if (menuIcon) menuIcon.src = 'static/Menudark.png';
        if (sendIcon) sendIcon.src = 'static/senddark.png';
    } else {
        if (themeIcon) themeIcon.src = 'static/Sun.png';
        if (menuIcon) menuIcon.src = 'static/Menulight.png';
        if (sendIcon) sendIcon.src = 'static/sendlight.png';
    }
});

/* Main Menu Button */
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
let mediaStream = null;
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
                // Store the stream for later cleanup
                mediaStream = stream;
                
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
        animationFrameId = null;
    }
    
    // Disconnect microphone if connected
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    // Close audio context
    if (audioContext) {
        try {
            audioContext.close();
            audioContext = null;
        } catch (e) {
            console.error('Error closing audio context:', e);
        }
    }
    
    // Stop all tracks in the media stream to release microphone
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
            track.stop();
        });
        mediaStream = null;
    }
    
    // Reset microphone button appearance
    micBtn.classList.remove('active');
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
