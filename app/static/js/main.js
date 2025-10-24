const chatMessages = document.getElementById("chatMessages")
const chatInput = document.getElementById("chatInput")
const sendButton = document.getElementById("sendButton")
const marked = window.marked

let firstQuerySent = false

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
  const history = getHistory()
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && history[i].content === content && history[i].tokens === null) {
      history[i].tokens = tokens
      break
    }
  }
  saveHistory(history)
}

function getStats() {
  return JSON.parse(localStorage.getItem('chatStats')) || null
}

function saveStats(statsData) {
  const statsToSave = {
    // Totals
    total_wh: statsData.total_wh,
    total_ml: statsData.total_ml,
    total_co2: statsData.total_co2,
    total_usd: statsData.total_usd,
    total_tokens: statsData.total_tokens,
    query_count: statsData.query_count,
    cached_tokens: statsData.cached_tokens,

    // Increments
    inc_wh: statsData.inc_wh,
    inc_ml: statsData.inc_ml,
    inc_co2: statsData.inc_co2,
    inc_usd: statsData.inc_usd,
    inc_tokens: statsData.inc_tokens
  };
  localStorage.setItem('chatStats', JSON.stringify(statsToSave));
}

function startNewChat() {
  localStorage.removeItem('chatHistory')
  localStorage.removeItem('chatStats')
  window.location.href = "/clear"
}

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
  if (firstQuerySent) return
  const queryCountEl = document.getElementById("queryCount");
  const queryCount = queryCountEl ? Number.parseInt(queryCountEl.textContent) : 0;

  if (queryCount > 0) {
    const incrementElements = document.querySelectorAll(".stat-increment")
    incrementElements.forEach((el) => {
      el.classList.add("visible")
    })
    firstQuerySent = true
  }
}

function updateStats(data) {
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

  saveStats(data);
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

  if (!element.classList.contains("increment-flash")) {
    element.classList.add("increment-flash")
    setTimeout(() => {
      element.classList.remove("increment-flash")
    }, 1000);
  }
}

async function sendMessage() {
  const message = chatInput.value.trim()
  if (!message) return

  chatInput.disabled = true
  sendButton.disabled = true

  const userMsgEl = addMessage(message, true)
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
      addMessage(data.response_text, false, { output_tokens: data.output_tokens })
      saveMessageToHistory('bot', data.response_text, data.output_tokens)
      attachTokenBadge(userMsgEl, "in", data.input_tokens)
      updateUserMessageTokens(message, data.input_tokens)

      updateStats(data)
    }
  } catch (error) {
    removeLoadingIndicator()
    const errorMsg = "Sorry, there was an error processing your request."
    addMessage(errorMsg, false)
    saveMessageToHistory('bot', errorMsg, 0)
    console.error("Error:", error)
  } finally {
    chatInput.disabled = false
    sendButton.disabled = false
    chatInput.focus()
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

function loadChatHistory() {
  const history = getHistory()
  if (history.length === 0) {
    return
  }

  // const defaultGreeting = document.getElementById("defaultGreeting")
  // if (defaultGreeting) {
  //   defaultGreeting.remove()
  // }

  history.forEach(item => {
    const isUser = item.role === 'user'
    const tokenData = {
      input_tokens: isUser ? item.tokens : null,
      output_tokens: !isUser ? item.tokens : null
    }
    addMessage(item.content, isUser, tokenData)
  })

  // --- REMOVED showMarginalStats() ---
  // loadStats() will now handle this.
}
function loadStats() {
  const stats = getStats();

  if (stats) {
    document.getElementById("totalEnergy").textContent = Number.parseFloat(stats.total_wh).toFixed(2);
    document.getElementById("totalWater").textContent = Number.parseFloat(stats.total_ml).toFixed(2);
    document.getElementById("totalCO2").textContent = Number.parseFloat(stats.total_co2).toFixed(3);
    document.getElementById("totalCost").textContent = Number.parseFloat(stats.total_usd).toFixed(4);
    document.getElementById("totalTokens").textContent = stats.total_tokens;
    document.getElementById("queryCount").textContent = stats.query_count;

    const cachedTokensEl = document.getElementById("cachedTokens");
    if (cachedTokensEl) {
      cachedTokensEl.textContent = Number.parseInt(stats.cached_tokens || 0);
    }
    const headerCachedTokens = document.getElementById("headerCachedTokens");
    if (headerCachedTokens) {
      headerCachedTokens.textContent = `${Number.parseInt(stats.cached_tokens || 0)} cached`;
    }

    if (stats.inc_wh !== undefined) {
      updateIncrement("marginalEnergy", stats.inc_wh, 2, " Wh");
      updateIncrement("marginalWater", stats.inc_ml, 2, " mL");
      updateIncrement("marginalCO2", stats.inc_co2, 3, " g CO₂");
      updateIncrement("marginalCost", stats.inc_usd, 4, "", "$");
      updateIncrement("marginalTokens", stats.inc_tokens, 0, " tokens");

      const incrementElements = document.querySelectorAll(".stat-increment");
      incrementElements.forEach((el) => {
        el.classList.add("visible");
      });
      firstQuerySent = true;
    } else {
      showMarginalStats();
    }
  } else {
    showMarginalStats();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  removeLoadingIndicator()
  loadChatHistory()
  loadStats();

  chatInput.focus()
  chatMessages.scrollTop = chatMessages.scrollHeight
})