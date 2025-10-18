const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

function addMessage(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = isUser ? 'You' : 'EcoBot';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessage(content);

    messageDiv.appendChild(label);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loadingIndicator';

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = 'EcoBot';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content loading';
    contentDiv.innerHTML = '<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>';

    loadingDiv.appendChild(label);
    loadingDiv.appendChild(contentDiv);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}


// function formatMessage(text) {
//     return text
//         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
//         .replace(/\*(.*?)\*/g, '<em>$1</em>')
//         // .replace(/`(.*?)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">$1</code>')
//         .replace(/`(.*?)`/g, '<code style="background: rgba(30, 41, 59, 0.6); padding: 2px 6px; border-radius: 4px; color: #10b981;">$1</code>')
//         .replace(/\n/g, '<br>');
// }

function formatMessage(text) {
    // Sanitize output to prevent XSS
    return marked.parse(text, { 
        breaks: true
    });
}

function updateStats(data) {
    document.getElementById('totalEnergy').innerHTML = `${parseFloat(data.total_wh).toFixed(2)}<span class="stat-unit">Wh</span>`;
    document.getElementById('totalWater').innerHTML = `${parseFloat(data.total_ml).toFixed(2)}<span class="stat-unit">mL</span>`;
    document.getElementById('totalCO2').innerHTML = `${parseFloat(data.total_co2).toFixed(4)}<span class="stat-unit">g</span>`;
    document.getElementById('totalCost').textContent = `$${parseFloat(data.total_usd).toFixed(4)}`;
    document.getElementById('totalTokens').textContent = data.total_tokens;

    document.getElementById('marginalEnergy').innerHTML = `${parseFloat(data.inc_wh).toFixed(2)}<span class="stat-unit">Wh</span>`;
    document.getElementById('marginalWater').innerHTML = `${parseFloat(data.inc_ml).toFixed(2)}<span class="stat-unit">mL</span>`;
    document.getElementById('marginalCO2').innerHTML = `${parseFloat(data.inc_co2).toFixed(4)}<span class="stat-unit">g</span>`;
    document.getElementById('marginalCost').textContent = `$${parseFloat(data.inc_usd).toFixed(4)}`;
    document.getElementById('marginalTokens').textContent = data.inc_tokens;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    chatInput.disabled = true;
    sendButton.disabled = true;

    addMessage(message, true);
    chatInput.value = '';

    addLoadingIndicator();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        removeLoadingIndicator();

        const lowerMsg = message.trim().toLowerCase();
        if (
            data.redirect &&
            lowerMsg !== "admin" &&
            lowerMsg !== "exit" &&
            lowerMsg !== "quit"
        ) {
            addMessage(`Redirecting to ${data.redirect}...`, false);
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else if (data.redirect) {
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            addMessage(data.response_text, false);
            updateStats(data);
        }
        
    } catch (error) {
        removeLoadingIndicator();
        addMessage('Error: ' + error.message);
        addMessage('Sorry, there was an error processing your request.', false);
        console.error('Error:', error);
    } finally {
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}
