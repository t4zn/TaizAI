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
            // For C/C++, we need special handling for include directives
            // First, process includes with angle brackets
            let processedCode = escapedCode.replace(
                /(#include\s*)&lt;([^&>]+)&gt;/g, 
                '<span class="preprocessor">$1</span><span class="string">&lt;$2&gt;</span>'
            );
            
            // Then process includes with quotes
            processedCode = processedCode.replace(
                /(#include\s*)(".*?")/g,
                '<span class="preprocessor">$1</span><span class="string">$2</span>'
            );
            
            // Process other preprocessor directives (that aren't already handled)
            processedCode = processedCode.replace(
                /#(\w+)(?!\s*&lt;)(?!\s*")/g,
                '<span class="preprocessor">#$1</span>'
            );
            
            // Now apply the rest of the syntax highlighting
            return highlightSyntax(processedCode, {
                keywords: ['int', 'char', 'float', 'double', 'void', 'struct', 'enum', 'typedef', 'const', 'static', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'using', 'namespace', 'class', 'public', 'private', 'protected', 'template', 'typename', 'virtual', 'friend', 'operator', 'new', 'delete'],
                stringPattern: /("(?:\\.|[^"\\])*")/g,
                commentPatterns: [/\/\/[^\n]*/g, /\/\*[\s\S]*?\*\//g],
                functionPattern: /\b(\w+)(?=\s*\()/g,
                numberPattern: /\b(\d+(?:\.\d+)?)\b/g,
                skipPreprocessor: true // Skip preprocessor since we've already handled it
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
    if (options.preprocessor && !options.skipPreprocessor) {
        let match;
        while ((match = options.preprocessor.exec(codeText)) !== null) {
            spans.push({
                start: match.index,
                end: match.index + match[0].length,
                class: 'preprocessor',
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
    
    // If the code already has HTML tags, return it as is
    if (result.includes('<span class=')) {
        return result;
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
let analyser;
let dataArray;
let animationFrameId;
let audioContext;
let bars = [];
let mediaStream = null;
const micBtn = document.getElementById('micBtn');
const voiceWaveContainer = document.getElementById('voiceWaveContainer');

// Initialize Speech Recognition
function initSpeechRecognition() {
    try {
        // Check if running in a WebView (likely a mobile app)
        const isWebView = navigator.userAgent.includes('wv') || 
                          window.navigator.standalone || 
                          window.matchMedia('(display-mode: standalone)').matches;
        
        // Create speech recognition object with appropriate fallbacks
        window.SpeechRecognition = window.SpeechRecognition || 
                                  window.webkitSpeechRecognition || 
                                  window.mozSpeechRecognition || 
                                  window.msSpeechRecognition;
        
        // If we're in a WebView, add additional logging for debugging
        if (isWebView) {
            console.log("Running in WebView/Mobile App environment");
            console.log("UserAgent: " + navigator.userAgent);
            console.log("SpeechRecognition available: " + (!!window.SpeechRecognition));
        }
        
        // If SpeechRecognition is not available, disable the microphone button
        if (!window.SpeechRecognition) {
            console.error("Speech recognition not supported in this browser/environment");
            const micButton = document.getElementById('micButton');
            if (micButton) {
                micButton.disabled = true;
                micButton.style.opacity = 0.5;
                micButton.title = "Speech recognition not available in this environment";
            }
            return false;
        }
        
        // Initialize the recognition object
        recognition = new window.SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Set language
        
        // Add event handlers
        recognition.onstart = function() {
            console.log("Speech recognition started");
            isRecording = true;
        };
        
        recognition.onend = function() {
            console.log("Speech recognition ended");
            isRecording = false;
            
            // Stop the visualization
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Reset the wave bars
            if (bars && bars.length > 0) {
                bars.forEach(bar => {
                    bar.style.height = '3px';
                });
            }
        };
        
        recognition.onerror = function(event) {
            console.error("Speech recognition error", event.error);
            // Show error message to user
            if (event.error === 'not-allowed') {
                alert("Microphone access was denied. Please allow microphone access to use voice input.");
            } else if (event.error === 'no-speech') {
                console.log("No speech detected");
            } else {
                console.log("Error occurred in recognition: " + event.error);
            }
            
            stopRecording();
        };
        
        recognition.onresult = handleRecognitionResult;
        
        return true;
    } catch (error) {
        console.error("Error initializing speech recognition:", error);
        return false;
    }
}

// Handle the results from speech recognition
function handleRecognitionResult(event) {
    const inputField = document.getElementById('userInput');
    let finalTranscript = '';
    let interimTranscript = '';
    
    // Get current cursor position
    const cursorPos = inputField.selectionStart;
    const textBeforeCursor = inputField.value.substring(0, cursorPos);
    const textAfterCursor = inputField.value.substring(cursorPos);
    
    // Process the recognition results
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }
    
    // Only update if we have something new
    if (finalTranscript || interimTranscript) {
        // Insert at cursor position
        inputField.value = textBeforeCursor + (finalTranscript || interimTranscript) + textAfterCursor;
        
        // Move cursor to end of inserted text
        const newCursorPos = cursorPos + (finalTranscript || interimTranscript).length;
        inputField.setSelectionRange(newCursorPos, newCursorPos);
        
        // Auto-resize the textarea
        autoResizeTextarea(inputField);
    }
}

// Toggle microphone recording
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Start recording audio - completely rewritten for WebIntoApp compatibility
function startRecording() {
    try {
        console.log("Starting recording...");
        
        // Get UI elements
        const micButton = document.getElementById('micButton');
        const voiceWaveContainer = document.getElementById('voiceWaveContainer');
        
        // Check if already recording
        if (isRecording) {
            console.log("Already recording, stopping first");
            stopRecording();
            return;
        }
        
        // Update UI to show recording attempt
        if (micButton) micButton.classList.add('recording');
        if (voiceWaveContainer) voiceWaveContainer.style.display = 'flex';
        
        // IMPORTANT: For WebIntoApp, we need to detect Android WebView
        const isAndroidWebView = /Android/i.test(navigator.userAgent) && 
                                /wv|WebView/i.test(navigator.userAgent);
        
        console.log("User agent:", navigator.userAgent);
        console.log("Is Android WebView:", isAndroidWebView);
        
        // Initialize speech recognition if needed
        if (!recognition) {
            // Create speech recognition with all possible fallbacks
            window.SpeechRecognition = window.SpeechRecognition || 
                                      window.webkitSpeechRecognition || 
                                      window.mozSpeechRecognition || 
                                      window.msSpeechRecognition;
            
            if (!window.SpeechRecognition) {
                console.error("Speech recognition not supported");
                alert("Speech recognition is not supported on this device.");
                stopRecording();
                return;
            }
            
            recognition = new window.SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            // Set up recognition handlers
            recognition.onstart = function() {
                console.log("Speech recognition started");
                isRecording = true;
            };
            
            recognition.onend = function() {
                console.log("Speech recognition ended");
                if (isRecording) {
                    // If we're still supposed to be recording, try to restart
                    try {
                        setTimeout(() => {
                            if (isRecording) recognition.start();
                        }, 100);
                    } catch (e) {
                        console.warn("Could not restart recognition:", e);
                        stopRecording();
                    }
                }
            };
            
            recognition.onerror = function(event) {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    alert("Microphone access denied. Please allow microphone access in your device settings.");
                }
                stopRecording();
            };
            
            recognition.onresult = function(event) {
                const inputField = document.getElementById('userInput');
                if (!inputField) return;
                
                // Get current cursor position
                const cursorPos = inputField.selectionStart || 0;
                const textBeforeCursor = inputField.value.substring(0, cursorPos);
                const textAfterCursor = inputField.value.substring(cursorPos);
                
                let finalTranscript = '';
                let interimTranscript = '';
                
                // Process results
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Only update if we have something new
                if (finalTranscript || interimTranscript) {
                    // Insert at cursor position
                    inputField.value = textBeforeCursor + (finalTranscript || interimTranscript) + textAfterCursor;
                    
                    // Move cursor to end of inserted text
                    const newCursorPos = cursorPos + (finalTranscript || interimTranscript).length;
                    inputField.setSelectionRange(newCursorPos, newCursorPos);
                    
                    // Auto-resize the textarea
                    if (typeof autoResizeTextarea === 'function') {
                        autoResizeTextarea(inputField);
                    }
                }
            };
        }
        
        // Special handling for Android WebView (WebIntoApp)
        if (isAndroidWebView) {
            console.log("Using Android WebView specific approach");
            
            // For Android WebView, we need to try to get microphone permission first
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(function(stream) {
                        console.log("Microphone permission granted");
                        
                        // Setup audio visualization
                        setupVisualization(stream);
                        
                        // Start recognition
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error("Error starting recognition:", e);
                            stopRecording();
                        }
                    })
                    .catch(function(err) {
                        console.error("Microphone permission denied:", err);
                        alert("Please allow microphone access for voice input to work.");
                        stopRecording();
                    });
            } else {
                // Direct attempt for older devices
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Error starting recognition:", e);
                    alert("Could not access microphone. This feature may not be supported in this app.");
                    stopRecording();
                }
            }
        } else {
            // Standard browser approach
            console.log("Using standard browser approach");
            
            // Try to get microphone access
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    } 
                })
                .then(function(stream) {
                    console.log("Microphone permission granted");
                    
                    // Store stream for cleanup
                    mediaStream = stream;
                    
                    // Setup visualization
                    setupVisualization(stream);
                    
                    // Start recognition
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Error starting recognition:", e);
                        stopRecording();
                    }
                })
                .catch(function(err) {
                    console.error("Microphone permission denied:", err);
                    alert("Please allow microphone access for voice input to work.");
                    stopRecording();
                });
            } else {
                // Fallback for browsers without mediaDevices
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Error starting recognition:", e);
                    alert("Could not access microphone. This feature may not be supported in your browser.");
                    stopRecording();
                }
            }
        }
    } catch (error) {
        console.error("Error in startRecording:", error);
        alert("An error occurred while trying to start voice recording.");
        stopRecording();
    }
}

// Setup audio visualization
function setupVisualization(stream) {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        // Connect microphone to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Create data array
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Get wave bars
        bars = Array.from(document.querySelectorAll('.voice-wave-bar'));
        
        // Start visualization
        animationFrameId = requestAnimationFrame(visualizeAudio);
    } catch (error) {
        console.warn("Could not setup audio visualization:", error);
    }
}

// Visualize audio data
function visualizeAudio() {
    if (!isRecording) return;
    
    try {
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Update each bar's height based on volume
        bars.forEach((bar, index) => {
            // Use different frequency bands for each bar
            const frequencyValue = dataArray[Math.floor(index * (dataArray.length / bars.length))];
            const height = Math.max(20, Math.min(80, frequencyValue * 0.8));
            bar.style.height = `${height}px`;
        });
        
        // Continue animation
        animationFrameId = requestAnimationFrame(visualizeAudio);
    } catch (error) {
        console.error("Error visualizing audio:", error);
    }
}

// Stop recording audio - completely rewritten for better cleanup
function stopRecording() {
    console.log("Stopping recording...");
    
    // Update state
    isRecording = false;
    
    // Stop speech recognition
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.warn("Error stopping recognition:", e);
        }
    }
    
    // Stop visualization
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Close audio context
    if (audioContext) {
        try {
            if (audioContext.state !== 'closed' && audioContext.close) {
                audioContext.close();
            }
        } catch (e) {
            console.warn("Error closing audio context:", e);
        }
        audioContext = null;
    }
    
    // Release microphone
    if (mediaStream) {
        try {
            mediaStream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.warn("Error stopping media tracks:", e);
        }
        mediaStream = null;
    }
    
    // Reset UI
    const micButton = document.getElementById('micButton');
    if (micButton) micButton.classList.remove('recording');
    
    const voiceWaveContainer = document.getElementById('voiceWaveContainer');
    if (voiceWaveContainer) voiceWaveContainer.style.display = 'none';
    
    // Reset wave bars
    if (bars && bars.length > 0) {
        bars.forEach(bar => {
            if (bar) bar.style.height = '3px';
        });
    }
}

// Add event listeners when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, setting up event listeners");
    
    // Microphone button click handler
    const micButton = document.getElementById('micButton');
    if (micButton) {
        micButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Microphone button clicked");
            toggleRecording();
        });
    } else {
        console.warn("Microphone button not found");
    }
    
    // Permission button click handler (for the overlay)
    const requestPermissionBtn = document.getElementById('requestPermissionBtn');
    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', function() {
            console.log("Permission button clicked");
            
            // Hide the overlay
            const overlay = document.getElementById('permissionOverlay');
            if (overlay) overlay.style.display = 'none';
            
            // Try to start recording
            startRecording();
        });
    }
    
    // Check for Android WebView (WebIntoApp)
    const isAndroidWebView = /Android/i.test(navigator.userAgent) && 
                            /wv|WebView/i.test(navigator.userAgent);
    
    // If we're in WebIntoApp, show the permission overlay on first load
    if (isAndroidWebView && !localStorage.getItem('permissionRequested')) {
        const overlay = document.getElementById('permissionOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            localStorage.setItem('permissionRequested', 'true');
        }
    }
});
