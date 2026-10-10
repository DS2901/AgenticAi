/**
 * Agentic AI Studio - Frontend Client Logic with Voice Interaction
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const chatForm = document.getElementById("chatForm");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const voiceToggleBtn = document.getElementById("voiceToggleBtn");
  const messagesList = document.getElementById("messagesList");
  const chatViewport = document.getElementById("chatViewport");
  const welcomeHero = document.getElementById("welcomeHero");
  const resetSessionBtn = document.getElementById("resetSessionBtn");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const sidebar = document.getElementById("sidebar");
  const modelBadge = document.getElementById("modelBadge");
  const statusText = document.getElementById("statusText");
  const toolsCountBadge = document.getElementById("toolsCountBadge");
  const toolsList = document.getElementById("toolsList");

  // Session ID Management
  let sessionId = localStorage.getItem("agent_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("agent_session_id", sessionId);
  }

  // Auto Voice Output Preference (Default: true)
  let autoVoice = localStorage.getItem("agent_auto_voice") !== "false";

  function updateVoiceToggleUI() {
    if (!voiceToggleBtn) return;
    if (autoVoice) {
      voiceToggleBtn.classList.add("active");
      const icon = voiceToggleBtn.querySelector(".voice-icon");
      const text = voiceToggleBtn.querySelector(".voice-text");
      if (icon) icon.textContent = "🔊";
      if (text) text.textContent = "Voice On";
    } else {
      voiceToggleBtn.classList.remove("active");
      const icon = voiceToggleBtn.querySelector(".voice-icon");
      const text = voiceToggleBtn.querySelector(".voice-text");
      if (icon) icon.textContent = "🔇";
      if (text) text.textContent = "Voice Off";
    }
  }

  updateVoiceToggleUI();

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
      autoVoice = !autoVoice;
      localStorage.setItem("agent_auto_voice", autoVoice);
      updateVoiceToggleUI();
      if (!autoVoice && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
  }

  // ==========================================
  // SPEECH-TO-TEXT (MICROPHONE RECOGNITION)
  // ==========================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isRecording = true;
      if (micBtn) micBtn.classList.add("recording");
      messageInput.placeholder = "Listening... Speak now";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      messageInput.value = transcript;
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
      if (messageInput.value.trim().length > 0) {
        setTimeout(() => {
          chatForm.dispatchEvent(new Event("submit"));
        }, 400);
      }
    };
  }

  function stopRecording() {
    isRecording = false;
    if (micBtn) micBtn.classList.remove("recording");
    messageInput.placeholder = "Ask anything, speak via mic, compute math, or query weather...";
  }

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!SpeechRecognition) {
        alert("Speech Recognition is not supported by your browser. Please try Chrome, Edge, or Safari.");
        return;
      }
      if (isRecording) {
        recognition.stop();
      } else {
        messageInput.value = "";
        try {
          recognition.start();
        } catch (e) {
          console.warn("Recognition already active", e);
        }
      }
    });
  }

  // ==========================================
  // TEXT-TO-SPEECH (VOICE PLAYBACK)
  // ==========================================
  function cleanTextForSpeech(markdown) {
    if (!markdown) return "";
    return markdown
      .replace(/```[\s\S]*?```/g, "Code block omitted.") // Remove code blocks
      .replace(/`([^`]+)`/g, "$1") // Remove inline backticks
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Clean links to text
      // 1. Remove all Unicode planes containing emojis and pictographs (including waving hand 👋, smileys, etc.)
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
      // 2. Remove miscellaneous symbols, dingbats, and geometric shapes
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      // 3. Remove variation selectors (critical: removes emoji descriptors like 'waving hand')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
      // 4. Remove all remaining Extended Pictographics
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\p{Emoji}/gu, "")
      // 5. Remove decorative bullets, arrows, and checkmarks
      .replace(/[•✓✔✕✖●▪◆★☆→←↑↓]/g, "")
      // 6. Remove markdown formatting markers
      .replace(/[*#_~>|=]/g, "")
      // 7. Normalize line breaks into natural speech pauses
      .replace(/[\r\n]+/g, ". ")
      // 8. Clean up whitespace and punctuation
      .replace(/\s+/g, " ")
      .replace(/\.+/g, ".")
      .trim();
  }

  function speakText(text, btnElement) {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.querySelectorAll(".btn-speaker.speaking").forEach(b => b.classList.remove("speaking"));
      if (btnElement && btnElement.classList.contains("speaking")) {
        return;
      }
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira")) &&
      v.lang.startsWith("en")
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    if (btnElement) btnElement.classList.add("speaking");

    utterance.onend = () => {
      if (btnElement) btnElement.classList.remove("speaking");
    };
    utterance.onerror = () => {
      if (btnElement) btnElement.classList.remove("speaking");
    };

    window.speechSynthesis.speak(utterance);
  }

  window.toggleSpeakMessage = function(btn) {
    const bubble = btn.closest(".message-body").querySelector(".message-bubble");
    if (bubble) {
      if (btn.classList.contains("speaking")) {
        window.speechSynthesis.cancel();
        btn.classList.remove("speaking");
      } else {
        speakText(bubble.innerText, btn);
      }
    }
  };

  // Configure Marked.js
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
  });

  // Fetch Agent Metadata on load
  async function loadAgentInfo() {
    try {
      const res = await fetch("/api/info");
      if (res.ok) {
        const data = await res.json();
        if (modelBadge) modelBadge.textContent = "Nemotron-3 120B";
        if (statusText) statusText.textContent = "Agent Active";
        if (toolsCountBadge && data.tools) {
          toolsCountBadge.textContent = `${data.tools.length} Online`;
        }
        if (toolsList && data.tools) {
          toolsList.innerHTML = data.tools.map(tool => `
            <div class="tool-card">
              <div class="tool-icon">${tool.icon}</div>
              <div class="tool-details">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-desc">${tool.description}</div>
              </div>
            </div>
          `).join("");
        }
      }
    } catch (e) {
      console.warn("Could not fetch /api/info", e);
    }
  }

  loadAgentInfo();

  // Auto-resize textarea
  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 180) + "px";
  });

  // Handle Enter to send
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  // Scroll to bottom
  function scrollToBottom() {
    chatViewport.scrollTo({
      top: chatViewport.scrollHeight,
      behavior: "smooth"
    });
  }

  // Append user message
  function appendUserMessage(text) {
    if (welcomeHero) welcomeHero.style.display = "none";

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper user";
    wrapper.innerHTML = `
      <div class="avatar user">You</div>
      <div class="message-body">
        <div class="message-bubble">${escapeHtml(text)}</div>
        <div class="message-meta">
          <span>${time}</span>
        </div>
      </div>
    `;
    messagesList.appendChild(wrapper);
    scrollToBottom();
  }

  // Create loading typing indicator
  function showLoadingIndicator() {
    const wrapper = document.createElement("div");
    wrapper.id = "currentLoadingMsg";
    wrapper.className = "message-wrapper agent";
    wrapper.innerHTML = `
      <div class="avatar agent">AI</div>
      <div class="message-body">
        <div class="message-bubble">
          <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span style="font-size:0.75rem; color:#94a3b8; margin-left:8px;">Reasoning & checking tools...</span>
          </div>
        </div>
      </div>
    `;
    messagesList.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  // Append Agent response
  function appendAgentResponse(data) {
    const loadingElem = document.getElementById("currentLoadingMsg");
    if (loadingElem) loadingElem.remove();

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper agent";

    // Build Tools Used Banner
    let toolsHtml = "";
    if (data.tools && data.tools.length > 0) {
      toolsHtml = data.tools.map(t => {
        const argsStr = typeof t.args === "object" ? JSON.stringify(t.args) : t.args;
        return `
          <div class="tool-call-banner">
            <div class="tool-banner-header">
              <span>⚡ Tool Invoked:</span>
              <span class="tool-badge-pill">${escapeHtml(t.tool)}</span>
            </div>
            <div class="tool-args-box">Args: ${escapeHtml(argsStr)}</div>
            ${t.result ? `<div class="tool-result-box"><span>✓</span> Result: ${escapeHtml(t.result)}</div>` : ''}
          </div>
        `;
      }).join("");
    }

    // Build Thinking Accordion
    let thinkingHtml = "";
    if (data.thinking) {
      thinkingHtml = `
        <div class="thinking-box">
          <div class="thinking-header" onclick="this.parentElement.classList.toggle('expanded')">
            <span>🧠 Model Reasoning (Click to expand)</span>
            <span style="font-size: 0.7rem;">▼</span>
          </div>
          <div class="thinking-content">${escapeHtml(data.thinking)}</div>
        </div>
      `;
    }

    // Render Markdown for reply
    const markdownHtml = marked.parse(data.reply || "");

    wrapper.innerHTML = `
      <div class="avatar agent">AI</div>
      <div class="message-body">
        ${thinkingHtml}
        ${toolsHtml}
        <div class="message-bubble">${markdownHtml}</div>
        <div class="message-meta">
          <span>${time}</span>
          <span>•</span>
          <button class="btn-copy" onclick="copyReplyText(this)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
          <span>•</span>
          <button class="btn-speaker" onclick="toggleSpeakMessage(this)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            Listen
          </button>
        </div>
      </div>
    `;

    messagesList.appendChild(wrapper);

    // Apply code syntax highlighting
    wrapper.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el);
    });

    scrollToBottom();

    // Trigger auto voice playback if enabled
    if (autoVoice && data.reply) {
      const speakerBtn = wrapper.querySelector(".btn-speaker");
      speakText(data.reply, speakerBtn);
    }
  }

  // Submit Handler
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    // Stop speaking if currently speaking
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Clear input
    messageInput.value = "";
    messageInput.style.height = "auto";
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Display user message
    appendUserMessage(text);
    showLoadingIndicator();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Server error");
      }

      const data = await response.json();
      if (data.session_id) {
        sessionId = data.session_id;
        localStorage.setItem("agent_session_id", sessionId);
      }

      appendAgentResponse(data);
    } catch (err) {
      console.error(err);
      const loadingElem = document.getElementById("currentLoadingMsg");
      if (loadingElem) loadingElem.remove();

      appendAgentResponse({
        reply: `⚠️ **Error occurred while processing request:**\n\`${err.message}\`\n\nPlease check your internet connection or verify OpenRouter API key in \`.env\`.`,
        tools: []
      });
    } finally {
      messageInput.disabled = false;
      sendBtn.disabled = false;
      messageInput.focus();
    }
  });

  // Prompt click triggers
  document.querySelectorAll("[data-prompt]").forEach(el => {
    el.addEventListener("click", () => {
      const prompt = el.getAttribute("data-prompt");
      if (prompt) {
        messageInput.value = prompt;
        chatForm.dispatchEvent(new Event("submit"));
      }
    });
  });

  // Reset Session
  resetSessionBtn.addEventListener("click", async () => {
    if (confirm("Clear chat history and reset session memory?")) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      try {
        await fetch("/api/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId })
        });
      } catch (e) {
        console.warn("Reset failed", e);
      }

      sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("agent_session_id", sessionId);
      messagesList.innerHTML = "";
      if (welcomeHero) welcomeHero.style.display = "block";
    }
  });

  // Sidebar toggle
  toggleSidebarBtn.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle("mobile-open");
    } else {
      sidebar.classList.toggle("hidden");
    }
  });

  // Helper: Escape HTML
  function escapeHtml(text) {
    if (typeof text !== "string") return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper: Copy text
  window.copyReplyText = function(btn) {
    const bubble = btn.closest(".message-body").querySelector(".message-bubble");
    if (bubble) {
      navigator.clipboard.writeText(bubble.innerText).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `✓ Copied!`;
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      });
    }
  };
});
