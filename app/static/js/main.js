const chatMessages = document.getElementById("chatMessages")
const chatInput = document.getElementById("chatInput")
const sendButton = document.getElementById("sendButton")
const marked = window.marked // Declare the marked variable

function addMessage(content, isUser, tokenData = null) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`

    const label = document.createElement("div")
    label.className = "message-label"
    label.textContent = isUser ? "You" : "EcoBot"

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"
    contentDiv.innerHTML = formatMessage(content)

    messageDiv.appendChild(label)
    messageDiv.appendChild(contentDiv)

    if (!isUser && tokenData) {
        const tokenInfo = document.createElement("div")
        tokenInfo.className = "token-info"
        tokenInfo.innerHTML = `
            <span class="token-badge">⬇️ ${tokenData.input_tokens} tokens</span>
            <span class="token-badge">⬆️ ${tokenData.output_tokens} tokens</span>
        `
        messageDiv.appendChild(tokenInfo)
    }

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight
}

function addLoadingIndicator() {
    const loadingDiv = document.createElement("div")
    loadingDiv.className = "message bot-message"
    loadingDiv.id = "loadingIndicator"

    const label = document.createElement("div")
    label.className = "message-label"
    label.textContent = "EcoBot"

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content loading"
    contentDiv.innerHTML = '<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>'

    loadingDiv.appendChild(label)
    loadingDiv.appendChild(contentDiv)
    chatMessages.appendChild(loadingDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById("loadingIndicator")
    if (loadingIndicator) {
        loadingIndicator.remove()
    }
}

function formatMessage(text) {
    return marked.parse(text, {
        breaks: true,
    })
}

function updateStats(data) {
    document.getElementById("queryCount").textContent = data.query_count

    document.getElementById("totalEnergy").innerHTML =
        `${Number.parseFloat(data.total_wh).toFixed(2)}<span class="stat-unit">Wh</span>`

    document.getElementById("totalWater").innerHTML =
        `${Number.parseFloat(data.total_ml).toFixed(2)}<span class="stat-unit">mL</span>`

    document.getElementById("totalCO2").innerHTML =
        `${Number.parseFloat(data.total_co2).toFixed(4)}<span class="stat-unit">g</span>`

    document.getElementById("totalCost").textContent = `$${Number.parseFloat(data.total_usd).toFixed(4)}`

    document.getElementById("totalTokens").textContent = data.total_tokens

    document.getElementById("marginalEnergy").innerHTML =
        `${Number.parseFloat(data.inc_wh).toFixed(2)}<span class="stat-unit">Wh</span>`

    document.getElementById("marginalWater").innerHTML =
        `${Number.parseFloat(data.inc_ml).toFixed(2)}<span class="stat-unit">mL</span>`

    document.getElementById("marginalCO2").innerHTML =
        `${Number.parseFloat(data.inc_co2).toFixed(4)}<span class="stat-unit">g</span>`

    document.getElementById("marginalCost").textContent = `$${Number.parseFloat(data.inc_usd).toFixed(4)}`

    document.getElementById("marginalTokens").textContent = data.inc_tokens

    if (data.cached_tokens && data.cached_tokens > 0) {
        const cachedDisplay = document.getElementById("cachedTokensDisplay")
        const cachedValue = document.getElementById("cachedTokensValue")
        cachedDisplay.style.display = "flex"
        cachedValue.textContent = data.cached_tokens
    }
}

async function sendMessage() {
    const message = chatInput.value.trim()
    if (!message) return

    chatInput.disabled = true
    sendButton.disabled = true

    addMessage(message, true)
    chatInput.value = ""

    addLoadingIndicator()

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: message }),
        })

        const data = await response.json()

        removeLoadingIndicator()

        const lowerMsg = message.trim().toLowerCase()
        if (data.redirect && lowerMsg !== "admin" && lowerMsg !== "exit" && lowerMsg !== "quit") {
            addMessage(`Redirecting to ${data.redirect}...`, false)
            setTimeout(() => {
                window.location.href = data.redirect
            }, 1000)
        } else if (data.redirect) {
            setTimeout(() => {
                window.location.href = data.redirect
            }, 1000)
        } else {
            const tokenData = {
                input_tokens: data.input_tokens,
                output_tokens: data.output_tokens,
            }
            addMessage(data.response_text, false, tokenData)
            updateStats(data)
        }
    } catch (error) {
        removeLoadingIndicator()
        addMessage("Error: " + error.message)
        addMessage("Sorry, there was an error processing your request.", false)
        console.error("Error:", error)
    } finally {
        chatInput.disabled = false
        sendButton.disabled = false
        chatInput.focus()
    }
}