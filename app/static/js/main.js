const chatMessages = document.getElementById("chatMessages")
const chatInput = document.getElementById("chatInput")
const sendButton = document.getElementById("sendButton")
const marked = window.marked

let firstQuerySent = false

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
  }, 500)
}

function showMarginalStats() {
  if (!firstQuerySent) {
    const incrementElements = document.querySelectorAll(".stat-increment")
    incrementElements.forEach((el) => {
      el.classList.add("visible")
    })
    firstQuerySent = true
  }
}

function updateStats(data) {
  showMarginalStats()

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
  }, 600)
}

async function sendMessage() {
  const message = chatInput.value.trim()
  if (!message) return

  chatInput.disabled = true
  sendButton.disabled = true

  const userMsgEl = addMessage(message, true)
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
      setTimeout(() => {
        window.location.href = data.redirect
      }, 1000)
    } else if (data.redirect) {
      setTimeout(() => {
        window.location.href = data.redirect
      }, 1000)
    } else {
      addMessage(data.response_text, false, { output_tokens: data.output_tokens })
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
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}
