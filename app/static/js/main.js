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

    if (tokenData) {
        const tokenInfo = document.createElement("div")
        tokenInfo.className = "token-info"

        if (isUser && tokenData.input_tokens != null) {
            tokenInfo.innerHTML = `<span class="token-badge">⬆️ ${tokenData.input_tokens} tokens</span>`
            messageDiv.appendChild(tokenInfo)
        } else if (!isUser && tokenData.output_tokens != null) {
            tokenInfo.innerHTML = `<span class="token-badge">⬇️ ${tokenData.output_tokens} tokens</span>`
            messageDiv.appendChild(tokenInfo)
        }
    }

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight
    return messageDiv
}

function attachTokenBadge(messageDiv, direction, tokens) {
    if (!messageDiv || tokens == null) return
    const tokenInfo = document.createElement("div")
    tokenInfo.className = "token-info"
    const arrow = direction === "in" ? "⬆️" : "⬇️"
    tokenInfo.innerHTML = `<span class="token-badge">${arrow} ${tokens} tokens</span>`
    messageDiv.appendChild(tokenInfo)
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

function flashTotalStat(elementId) {
    const element = document.getElementById(elementId)
    if (!element) return
    element.classList.add("increment-flash")
    setTimeout(() => {
        element.classList.remove("increment-flash")
    }, 1000)
}

function flashCachedTokens() {
    const cachedDisplay = document.getElementById("cachedTokensDisplay")
    if (!cachedDisplay) return
    cachedDisplay.classList.add("increment-flash")
    setTimeout(() => {
        cachedDisplay.classList.remove("increment-flash")
    }, 1000)
}

function updateStats(data) {
    document.getElementById("queryCount").textContent = data.query_count

    const totalEnergy = document.getElementById("totalEnergy")
    totalEnergy.innerHTML =
        `${Number.parseFloat(data.total_wh).toFixed(2)}<span class="stat-unit">Wh</span>`
    flashTotalStat("totalEnergy")

    const totalWater = document.getElementById("totalWater")
    totalWater.innerHTML =
        `${Number.parseFloat(data.total_ml).toFixed(2)}<span class="stat-unit">mL</span>`
    flashTotalStat("totalWater")

    const totalCO2 = document.getElementById("totalCO2")
    totalCO2.innerHTML =
        `${Number.parseFloat(data.total_co2).toFixed(3)}<span class="stat-unit">g</span>`
    flashTotalStat("totalCO2")

    const totalCost = document.getElementById("totalCost")
    totalCost.textContent = `$${Number.parseFloat(data.total_usd).toFixed(3)}`
    flashTotalStat("totalCost")

    const totalTokens = document.getElementById("totalTokens")
    totalTokens.innerHTML = `${data.total_tokens}<span class="stat-unit">tokens</span>`
    flashTotalStat("totalTokens")

    updateIncrement("marginalEnergy", data.inc_wh, "Wh")
    updateIncrement("marginalWater", data.inc_ml, "mL")
    updateIncrement("marginalCO2", data.inc_co2, "g")
    updateIncrement("marginalCost", data.inc_usd, "")
    updateIncrement("marginalTokens", data.inc_tokens, "tokens")

  if (data.cached_tokens && data.cached_tokens > 0) {
        const cachedDisplay = document.getElementById("cachedTokensDisplay")
        const cachedValue = document.getElementById("cachedTokensValue")
        cachedDisplay.style.display = "flex"
        cachedValue.textContent = data.cached_tokens
        flashCachedTokens()
    }
}

function updateIncrement(elementId, value, unit = "", prefix = "+") {
    const element = document.getElementById(elementId)
    if (!element) return

    let displayValue = value
    if (elementId === "marginalTokens") {
        displayValue = parseInt(value)
    } else if (elementId === "marginalCost") {
        displayValue = Number.parseFloat(value).toFixed(4)
        displayValue = `$${displayValue}`
    } else if (elementId === "marginalCO2") {
        displayValue = Number.parseFloat(value).toFixed(3)
    } else {
        displayValue = Number.parseFloat(value).toFixed(2)
    }

    element.innerHTML = `${prefix}${displayValue}<span class="stat-unit">${unit}</span>`
    element.classList.add("increment-flash")

    setTimeout(() => {
        element.classList.remove("increment-flash")
    }, 1000)
}

async function sendMessage() {
    const message = chatInput.value.trim()
    if (!message) return

    chatInput.disabled = true
    sendButton.disabled = true

    const userMsgEl = addMessage(message, true)   // keep a handle to the user bubble
    chatInput.value = ""

    addLoadingIndicator()

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        })
        const data = await response.json()

        removeLoadingIndicator()

        const lowerMsg = message.trim().toLowerCase()
        if (data.redirect && lowerMsg !== "admin" && lowerMsg !== "exit" && lowerMsg !== "quit") {
            addMessage(`Redirecting to ${data.redirect}...`, false)
            setTimeout(() => { window.location.href = data.redirect }, 1000)
        } else if (data.redirect) {
            setTimeout(() => { window.location.href = data.redirect }, 1000)
        } else {
            // ⬇️ under bot bubble
            addMessage(data.response_text, false, { output_tokens: data.output_tokens })

            // ⬆️ under the existing user bubble
            attachTokenBadge(userMsgEl, "in", data.input_tokens)

            updateStats(data)
        }
    } catch (error) {
        removeLoadingIndicator()
        addMessage("Error: " + error.message, false)
        addMessage("Sorry, there was an error processing your request.", false)
        console.error("Error:", error)
    } finally {
        chatInput.disabled = false
        sendButton.disabled = false
        chatInput.focus()
    }
}