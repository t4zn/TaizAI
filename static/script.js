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
    
    // Only proceed if there's text input
    if (!userText) return;

    appendMessage(userText, 'user');
    inputField.value = '';
    
    // Reset textarea height
    inputField.style.height = 'auto';

    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userText,
                image: currentImage
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        appendBotMessage(data.reply);
        
        // Clear current image after sending
        currentImage = null;
    } catch (error) {
        console.error('Error:', error);
        appendBotMessage("⚠️ Error connecting to server. Please try again.");
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
    // First decode HTML entities in the code
    const decodedCode = decodeHtmlEntities(code);
    
    // Create the code block container
    return `
    <div class="code-block">
        <div class="code-header">
            <span class="code-language">${language.toUpperCase()}</span>
            <button class="code-copy-btn" onclick="copyCodeToClipboard(this)">Copy</button>
        </div>
        <pre class="code-content">${highlightCode(decodedCode, language)}</pre>
    </div>
    `;
}

// Decode HTML entities to restore special characters
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Main function to highlight code based on language
function highlightCode(code, language) {
    // First escape HTML to prevent XSS
    const escapedCode = escapeHtml(code);
    
    // Apply language-specific highlighting
    switch(language.toLowerCase()) {
        case 'javascript':
        case 'js':
            return highlightSyntax(escapedCode, {
                keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'try', 'catch', 'async', 'await', 'new', 'this'],
                stringPattern: /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(`(?:\\.|[^`\\])*`)/g,
                commentPatterns: [/\/\/[^\n]*/g, /\/\*[\s\S]*?\*\//g],
                functionPattern: /\b(\w+)(?=\s*\()/g,
                numberPattern: /\b(\d+(?:\.\d+)?)\b/g
            });
        case 'html':
            return highlightHTML(escapedCode);
        case 'css':
            return highlightCSS(escapedCode);
        case 'python':
        case 'py':
            return highlightSyntax(escapedCode, {
                keywords: ['def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'],
                stringPattern: /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')/g,
                commentPatterns: [/#[^\n]*/g],
                functionPattern: /\b(\w+)(?=\s*\()/g,
                numberPattern: /\b(\d+(?:\.\d+)?)\b/g
            });
        case 'c':
        case 'cpp':
            return highlightSyntax(escapedCode, {
                keywords: ['int', 'char', 'float', 'double', 'void', 'struct', 'enum', 'typedef', 'const', 'static', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'using', 'namespace', 'class', 'public', 'private', 'protected', 'template', 'typename', 'virtual', 'friend', 'operator', 'new', 'delete'],
                preprocessor: /#\w+/g,
                stringPattern: /("(?:\\.|[^"\\])*")/g,
                commentPatterns: [/\/\/[^\n]*/g, /\/\*[\s\S]*?\*\//g],
                functionPattern: /\b(\w+)(?=\s*\()/g,
                numberPattern: /\b(\d+(?:\.\d+)?)\b/g,
                includePattern: /#include\s*(?:<([^>]+)>|"([^"]+)")/g
            });
        default:
            return escapedCode;
    }
}

// Generic syntax highlighter
function highlightSyntax(code, options) {
    let result = code;
    
    // Create a temporary div to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result;
    const codeText = tempDiv.textContent;
    
    // Array to store all the spans we'll create
    const spans = [];
    
    // Special handling for C/C++ includes
    if (options.includePattern) {
        let match;
        while ((match = options.includePattern.exec(codeText)) !== null) {
            // First mark the entire #include statement
            spans.push({
                start: match.index,
                end: match.index + match[0].length,
                class: 'preprocessor',
                text: match[0]
            });
            
            // Then mark the header name specifically
            if (match[1]) { // <header> style
                const headerStart = match.index + match[0].indexOf('<');
                spans.push({
                    start: headerStart,
                    end: headerStart + match[1].length + 2, // +2 for < and >
                    class: 'string',
                    text: `<${match[1]}>`
                });
            } else if (match[2]) { // "header" style
                const headerStart = match.index + match[0].indexOf('"');
                spans.push({
                    start: headerStart,
                    end: headerStart + match[2].length + 2, // +2 for quotes
                    class: 'string',
                    text: `"${match[2]}"`
                });
            }
        }
    }
    
    // Process keywords
    if (options.keywords) {
        options.keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            let match;
            while ((match = regex.exec(codeText)) !== null) {
                spans.push({
                    start: match.index,
                    end: match.index + keyword.length,
                    class: 'keyword',
                    text: match[0]
                });
            }
        });
    }
    
    // Process preprocessor directives
    if (options.preprocessor) {
        let match;
        while ((match = options.preprocessor.exec(codeText)) !== null) {
            // Skip if this is part of an #include that we've already processed
            if (options.includePattern && codeText.substring(match.index, match.index + 9) === '#include') {
                continue;
            }
            
            spans.push({
                start: match.index,
                end: match.index + match[0].length,
                class: 'keyword',
                text: match[0]
            });
        }
    }
    
    // Process strings
    if (options.stringPattern) {
        let match;
        while ((match = options.stringPattern.exec(codeText)) !== null) {
            spans.push({
                start: match.index,
                end: match.index + match[0].length,
                class: 'string',
                text: match[0]
            });
        }
    }
    
    // Process comments
    if (options.commentPatterns) {
        options.commentPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(codeText)) !== null) {
                spans.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    class: 'comment',
                    text: match[0]
                });
            }
        });
    }
    
    // Process functions
    if (options.functionPattern) {
        let match;
        while ((match = options.functionPattern.exec(codeText)) !== null) {
            spans.push({
                start: match.index,
                end: match.index + match[0].length,
                class: 'function',
                text: match[0]
            });
        }
    }
    
    // Process numbers
    if (options.numberPattern) {
        let match;
        while ((match = options.numberPattern.exec(codeText)) !== null) {
            spans.push({
                start: match.index,
                end: match.index + match[0].length,
                class: 'number',
                text: match[0]
            });
        }
    }
    
    // Sort spans by start position (in reverse order to avoid position shifts)
    spans.sort((a, b) => b.start - a.start);
    
    // Apply spans to the code
    // Convert to array for easier manipulation
    const codeArray = codeText.split('');
    
    // Apply spans in reverse order to avoid position shifts
    spans.forEach(span => {
        // Check for overlaps - if this span overlaps with any already processed text, skip it
        if (codeArray.slice(span.start, span.end).join('') !== span.text) {
            return;
        }
        
        // Insert the end tag
        codeArray.splice(span.end, 0, '</span>');
        
        // Insert the start tag
        codeArray.splice(span.start, 0, `<span class="${span.class}">`);
    });
    
    // Join back to string
    return codeArray.join('');
}

// Specialized HTML highlighter
function highlightHTML(code) {
    // This is a simplified version - for a real implementation, you'd need a more sophisticated parser
    let result = code;
    
    // Tags
    result = result.replace(/(&lt;\/?)([\w-]+)(?=[^&]*&gt;)/g, '$1<span class="tag">$2</span>');
    
    // Attributes
    result = result.replace(/\s([\w-]+)(?==)/g, ' <span class="attribute">$1</span>');
    
    // Attribute values
    result = result.replace(/(=)(".*?"|'.*?')/g, '$1<span class="string">$2</span>');
    
    return result;
}

// Specialized CSS highlighter
function highlightCSS(code) {
    let result = code;
    
    // Selectors
    result = result.replace(/([\.\#]?[\w-]+)(?=\s*\{)/g, '<span class="tag">$1</span>');
    
    // Properties
    result = result.replace(/\s([\w-]+)(?=\s*:)/g, ' <span class="attribute">$1</span>');
    
    // Values
    result = result.replace(/:\s*([\w-]+|#[a-fA-F0-9]+)/g, ': <span class="string">$1</span>');
    
    // Units
    result = result.replace(/(\d+)(px|em|rem|%|vh|vw)/g, '<span class="number">$1</span><span class="keyword">$2</span>');
    
    // Comments
    result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    
    return result;
}

// Function to copy code to clipboard
function copyCodeToClipboard(button) {
    const codeBlock = button.closest('.code-block');
    const codeContent = codeBlock.querySelector('.code-content');
    
    // Create a temporary textarea to copy from
    const textarea = document.createElement('textarea');
    
    // Get the text content (without the HTML tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = codeContent.innerHTML;
    textarea.value = tempDiv.textContent;
    
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Show copied feedback
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
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

// Image Upload Functionality
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
let currentImage = null;

// Handle image button click
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

// Handle image selection
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

// Handle image file
function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        
        // Show image preview in chat
        const chatBox = document.getElementById('chatBox');
        const previewDiv = document.createElement('div');
        previewDiv.className = 'message user';
        previewDiv.innerHTML = `<img src="${currentImage}" class="image-preview" style="display: block; max-width: 200px; max-height: 200px;">`;
        chatBox.appendChild(previewDiv);
        smartScrollToBottom();
    };
    reader.readAsDataURL(file);
}
