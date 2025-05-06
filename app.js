const API_KEY = 'AIzaSyAzr65vxkOF_TmzS1fEbJOZn0MNBhcoA-U';
const messageInput = document.getElementById('messageInput');
const messageContainer = document.getElementById('messageContainer');
const chatBody = document.getElementById('chatBody');
const micBtn = document.getElementById('micBtn');
const stopBtn = document.getElementById('stopBtn');
let recognition;
let isSpeaking = false;

// Only English
const voiceConfig = { lang: 'en-US', rate: 1.0 };

function addMessage(text, isBot) {
  const div = document.createElement('div');
  div.className = isBot ? 'bot-message' : 'user-message';
  div.innerHTML = text;
  messageContainer.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function speak(text) {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceConfig.lang;
  utterance.rate = voiceConfig.rate;
  utterance.onstart = () => isSpeaking = true;
  utterance.onend = () => isSpeaking = false;
  window.speechSynthesis.speak(utterance);
}

async function sendMessage() {
  const userText = messageInput.value.trim();
  if (!userText) return;
  addMessage(userText, false);
  messageInput.value = '';

  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.style.display = 'block';

  // Use user input as natural conversational prompt for Gemini AI
  const prompt = userText;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await res.json();
    let botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';

    // Convert URLs in botText to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    botText = botText.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);

    addMessage(
      botText +
      `<br>
      <button onclick="speak(\`${botText.replace(/`/g, "'")}\`)">
        <i class="fas fa-volume-up"></i>
      </button>`,
      true
    );
  } catch (err) {
    addMessage(`Error: ${err.message}`, true);
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  recognition = new SpeechRecognition();
  recognition.lang = voiceConfig.lang;
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    messageInput.value += ' ' + transcript;
  };
  recognition.onerror = (e) => console.error('Mic error:', e);
}

// Event bindings
micBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
});
document.getElementById('sendBtn').addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
stopBtn.addEventListener('click', () => {
  messageContainer.innerHTML = '';
  window.speechSynthesis.cancel();
});

// Initialize
initSpeechRecognition();