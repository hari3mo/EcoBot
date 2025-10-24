const chatMessages = document.getElementById("chatMessages")
const chatInput = document.getElementById("chatInput")
const sendButton = document.getElementById("sendButton")
const marked = window.marked

let firstQuerySent = false

// --- New localStorage Helper Functions ---

function getHistory() {
  return JSON.parse(localStorage.getItem('chatHistory')) || []
}

function saveHistory(history) {
  localStorage.setItem('chatHistory', JSON.stringify(history))
}

function saveMessageToHistory(role, content, tokens) {
  const history = getHistory()
  history.push({ role, content, tokens })
  saveHistory(history)
}

function updateUserMessageTokens(content, tokens) {
  // Find the last user message with matching content and update its tokens
  const history = getHistory()
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && history[i].content === content && history[i].tokens === null) {
      history[i].tokens = tokens
      break
    }
  }
  saveHistory(history)
}

function startNewChat() {
  localStorage.removeItem('chatHistory')
  window.location.href = "/new" // Clears server session stats
}

// --- Existing Functions (Modified) ---

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
    gfm: true,
  })
}

function flashTotalStat(elementId) {
  const element = document.getElementById(elementId)
  if (!element) return
  element.classList.add("total-flash")
  setTimeout(() => {
    element.classList.remove("total-flash")
  }, 1000)
}

function showMarginalStats() {
  if (firstQuerySent) return // Prevent re-adding 'visible' class
  const queryCount = Number.parseInt(document.getElementById("queryCount").textContent)
  if (queryCount > 0) {
    const incrementElements = document.querySelectorAll(".stat-increment")
    incrementElements.forEach((el) => {
      el.classList.add("visible")
    })
    firstQuerySent = true
  }
}

function updateStats(data) {
  // This check is now needed here
  if (!firstQuerySent) {
    const incrementElements = document.querySelectorAll(".stat-increment")
    incrementElements.forEach((el) => {
      el.classList.add("visible")
    })
    firstQuerySent = true
  }

  const totalEnergy = document.getElementById("totalEnergy")
  totalEnergy.textContent = Number.parseFloat(data.total_wh).toFixed(2)
  flashTotalStat("totalEnergy")

  const totalWater = document.getElementById("totalWater")
  totalWater.textContent = Number.parseFloat(data.total_ml).toFixed(2)
  flashTotalStat("totalWater")

  const totalCO2 = document.getElementById("totalCO2")
  totalCO2.textContent = Number.parseFloat(data.total_co2).toFixed(3)
  flashTotalStat("totalCO2")

  const totalCost = document.getElementById("totalCost")
  totalCost.textContent = Number.parseFloat(data.total_usd).toFixed(4)
  flashTotalStat("totalCost")

  const totalTokens = document.getElementById("totalTokens")
  totalTokens.textContent = data.total_tokens
  flashTotalStat("totalTokens")

  const queryCount = document.getElementById("queryCount")
  queryCount.textContent = data.query_count
  flashTotalStat("queryCount")

  const cachedTokensEl = document.getElementById("cachedTokens")
  if (cachedTokensEl) {
    cachedTokensEl.textContent = Number.parseInt(data.cached_tokens || 0)
    flashTotalStat("cachedTokens")
  }

  const headerCachedTokens = document.getElementById("headerCachedTokens")
  if (headerCachedTokens) {
    headerCachedTokens.textContent = `${Number.parseInt(data.cached_tokens || 0)} cached`
    // flashTotalStat("headerCachedTokens")
  }

  updateIncrement("marginalEnergy", data.inc_wh, 2, " Wh")
  updateIncrement("marginalWater", data.inc_ml, 2, " mL")
  updateIncrement("marginalCO2", data.inc_co2, 3, " g CO₂")
  updateIncrement("marginalCost", data.inc_usd, 4, "", "$")
  updateIncrement("marginalTokens", data.inc_tokens, 0, " tokens")
}

function updateIncrement(elementId, value, decimals = 2, unit = "", prefix = "") {
  const element = document.getElementById(elementId)
  if (!element) return

  let displayValue
  if (decimals === 0) {
    displayValue = Number.parseInt(value)
  } else {
    displayValue = Number.parseFloat(value).toFixed(decimals)
  }

  element.textContent = `+${prefix}${displayValue}${unit}`
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

  // 1. Add user message to UI
  const userMsgEl = addMessage(message, true)
  // 2. Save user message to localStorage (with null tokens)
  saveMessageToHistory('user', message, null)

  chatInput.value = ""
  addLoadingIndicator()

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
    const data = await response.json()

    removeLoadingIndicator()

    const lowerMsg = message.trim().toLowerCase()
    if (data.redirect && lowerMsg !== "admin" && lowerMsg !== "exit" && lowerMsg !== "quit") {
      addMessage(`Redirecting to ${data.redirect}...`, false)
      // Don't save redirects to history
      setTimeout(() => {
        window.location.href = data.redirect
      }, 1000)
    } else if (data.redirect) {
      setTimeout(() => {
        window.location.href = data.redirect
      }, 1000)
    } else {
      // 3. Add bot response to UI
      addMessage(data.response_text, false, { output_tokens: data.output_tokens })
      // 4. Save bot response to localStorage
      saveMessageToHistory('bot', data.response_text, data.output_tokens)

      // 5. Add token badge to user message in UI
      attachTokenBadge(userMsgEl, "in", data.input_tokens)
      // 6. Update user message in localStorage with tokens
      updateUserMessageTokens(message, data.input_tokens)

      updateStats(data)
    }
  } catch (error) {
    removeLoadingIndicator()
    const errorMsg = "Sorry, there was an error processing your request."
    addMessage(errorMsg, false)
    saveMessageToHistory('bot', errorMsg, 0) // Save error message
    console.error("Error:", error)
  } finally {
    chatInput.disabled = false
    sendButton.disabled = false
    chatInput.focus()
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

/**
 * Loads the chat history from localStorage into the UI.
 */
function loadChatHistory() {
  const history = getHistory()
  if (history.length === 0) {
    return
  }

  const defaultGreeting = document.getElementById("defaultGreeting")
  if (defaultGreeting) {
    defaultGreeting.remove()
  }

  history.forEach(item => {
    const isUser = item.role === 'user'
    const tokenData = {
      input_tokens: isUser ? item.tokens : null,
      output_tokens: !isUser ? item.tokens : null
    }
    addMessage(item.content, isUser, tokenData)
  })

  // Also show marginal stats if history exists
  showMarginalStats()
}

// Run this when the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  removeLoadingIndicator()

  // Load chat history from localStorage
  loadChatHistory()

  chatInput.focus()
  chatMessages.scrollTop = chatMessages.scrollHeight
})