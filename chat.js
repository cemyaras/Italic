// ─── AI Travel Chat Widget ─────────────────────────────────────
(function () {
  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const MODEL = 'arcee-ai/trinity-large-preview:free';
  const SYSTEM_PROMPT = `Seyahat asistanı, bilgili bir tarihçi ve deneyimli bir tur rehberisin; pratik seyahat önerileri ver ve yerlerin tarihî/kültürel arka planını kısa ve doğru şekilde açıkla; gerçek olmayan rezervasyon, saat veya fiyat üretme; emin değilsen belirsiz olduğunu belirt; Türkçe, net ve kısa cevap ver.`;
  const LS_KEY = 'openrouter_api_key';
  const LS_MSG_KEY = 'openrouter_messages';

  let chatOpen = false;
  let messages = [];
  try {
    const saved = localStorage.getItem(LS_MSG_KEY);
    if (saved) messages = JSON.parse(saved);
  } catch (e) { }
  let isStreaming = false;

  function saveMessages() {
    localStorage.setItem(LS_MSG_KEY, JSON.stringify(messages));
  }

  // ── Inject CSS ──
  const style = document.createElement('style');
  style.textContent = `
    /* Chat toggle button */
    #chat-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(59,130,246,0.4);
      z-index: 9999;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    #chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 32px rgba(59,130,246,0.6);
    }
    #chat-toggle svg { width: 28px; height: 28px; fill: white; }

    /* Chat panel */
    #chat-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 140px);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 9998;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s, transform 0.3s;
      background: rgba(10, 17, 40, 0.97);
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 48px rgba(0,0,0,0.5);
    }
    #chat-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Header */
    .chat-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #1e3a5f, #2d1b4e);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chat-header-avatar {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .chat-header-info { flex: 1; }
    .chat-header-info h3 { font-size: 15px; font-weight: 700; color: white; margin: 0; }
    .chat-header-info p { font-size: 11px; color: rgba(255,255,255,0.5); margin: 2px 0 0; }

    .chat-header-actions {
      display: flex;
      gap: 8px;
    }
    .chat-icon-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 8px;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      transition: all 0.2s;
    }
    .chat-icon-btn:hover {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    .chat-icon-btn svg { width: 16px; height: 16px; fill: currentColor; }

    /* Chat body - must be flex to constrain messages scroll */
    #chat-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    /* Messages */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    #chat-panel.open {
      isolation: isolate;
    }
    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

    .chat-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.6;
      word-wrap: break-word;
      animation: msgIn 0.3s ease;
    }
    @keyframes msgIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .chat-msg.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .chat-msg.assistant {
      align-self: flex-start;
      background: rgba(255,255,255,0.06);
      color: #e2e8f0;
      border: 1px solid rgba(255,255,255,0.06);
      border-bottom-left-radius: 4px;
    }
    .chat-msg.system-info {
      align-self: center;
      background: rgba(251,191,36,0.1);
      color: #fbbf24;
      border: 1px solid rgba(251,191,36,0.15);
      border-radius: 12px;
      font-size: 12px;
      text-align: center;
      max-width: 95%;
    }

    /* Markdown styles inside messages */
    .chat-msg p { margin: 0 0 10px 0; line-height: 1.5; }
    .chat-msg p:last-child { margin-bottom: 0; }
    .chat-msg h1 { font-size: 18px; font-weight: 700; margin: 16px 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; }
    .chat-msg h2 { font-size: 15px; font-weight: 700; margin: 16px 0 8px 0; }
    .chat-msg h3 { font-size: 14px; font-weight: 700; margin: 12px 0 6px 0; }
    .chat-msg h1:first-child, .chat-msg h2:first-child, .chat-msg h3:first-child { margin-top: 0; }
    .chat-msg strong { font-weight: 700; color: inherit; }
    .chat-msg em { font-style: italic; }
    .chat-msg ul, .chat-msg ol { margin: 8px 0 10px 20px; padding: 0; list-style-position: outside; }
    .chat-msg li { margin-bottom: 4px; line-height: 1.5; }
    .chat-msg li:last-child { margin-bottom: 0; }
    .chat-msg code { background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 11px; }

    /* Thinking indicator */
    .chat-thinking {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      align-self: flex-start;
    }
    .chat-thinking span {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      animation: bounce 1.4s infinite ease-in-out;
    }
    .chat-thinking span:nth-child(2) { animation-delay: 0.16s; }
    .chat-thinking span:nth-child(3) { animation-delay: 0.32s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Input area */
    .chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      gap: 8px;
      align-items: center;
      background: rgba(255,255,255,0.02);
    }
    .chat-input-area input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 10px 14px;
      color: white;
      font-size: 13px;
      outline: none;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.2s;
    }
    .chat-input-area input:focus {
      border-color: rgba(99,102,241,0.5);
    }
    .chat-input-area input::placeholder { color: rgba(255,255,255,0.3); }
    .chat-input-area button {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .chat-input-area button:disabled { opacity: 0.4; cursor: not-allowed; }
    .chat-input-area button svg { width: 18px; height: 18px; fill: white; }

    /* API Key area */
    .chat-key-area {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 12px;
      text-align: center;
    }
    .chat-key-area .key-icon { font-size: 40px; }
    .chat-key-area h4 { color: white; font-size: 16px; font-weight: 700; margin: 0; }
    .chat-key-area p { color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; }
    .chat-key-area input {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 12px 14px;
      color: white;
      font-size: 13px;
      font-family: 'Inter', monospace;
      outline: none;
      text-align: center;
    }
    .chat-key-area input:focus { border-color: rgba(99,102,241,0.5); }
    .chat-key-area input::placeholder { color: rgba(255,255,255,0.25); }
    .chat-key-area button {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: none;
      color: white;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: opacity 0.2s;
    }
    .chat-key-area button:hover { opacity: 0.9; }
    .chat-key-link {
      color: #60a5fa;
      font-size: 11px;
      text-decoration: none;
    }
    .chat-key-link:hover { text-decoration: underline; }

    /* Footer with key management */
    .chat-footer-key {
      padding: 6px 16px 8px;
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .chat-footer-key button {
      background: none;
      border: none;
      color: rgba(255,255,255,0.25);
      font-size: 10px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      padding: 2px 6px;
    }
    .chat-footer-key button:hover { color: #f87171; }
  `;
  document.head.appendChild(style);

  // ── Build DOM ──
  function buildChat() {
    // Prevent duplicate DOM injections
    const existingToggle = document.getElementById('chat-toggle');
    if (existingToggle) existingToggle.remove();
    const existingPanel = document.getElementById('chat-panel');
    if (existingPanel) existingPanel.remove();

    // Toggle button
    const toggle = document.createElement('button');
    toggle.id = 'chat-toggle';
    toggle.title = 'AI Travel Assistant';
    toggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>`;
    toggle.addEventListener('click', toggleChat);
    document.body.appendChild(toggle);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-avatar">🤖</div>
        <div class="chat-header-info">
          <h3>Travel Assistant AI</h3>
          <p>Powered by Trinity via OpenRouter</p>
        </div>
        <div class="chat-header-actions">
          <button class="chat-icon-btn" onclick="window.__chatClearMessages()" title="Temizle">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
          <button class="chat-icon-btn" onclick="window.__chatToggle()" title="Kapat">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
          </button>
        </div>
      </div>
      <div id="chat-body"></div>
    `;
    document.body.appendChild(panel);

    // Prevent scroll-through: stop wheel & touch events from reaching the page
    panel.addEventListener('wheel', function (e) {
      const messages = panel.querySelector('.chat-messages');
      if (!messages) return;
      const atTop = messages.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = messages.scrollTop + messages.clientHeight >= messages.scrollHeight && e.deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
      e.stopPropagation();
    }, { passive: false });

    panel.addEventListener('touchmove', function (e) {
      e.stopPropagation();
    }, { passive: true });

    renderBody();
  }

  function toggleChat() {
    chatOpen = !chatOpen;
    const panel = document.getElementById('chat-panel');
    if (chatOpen) {
      panel.classList.add('open');
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    } else {
      panel.classList.remove('open');
    }
  }
  window.__chatToggle = toggleChat;

  function getApiKey() {
    return localStorage.getItem(LS_KEY) || '';
  }

  function renderBody() {
    const body = document.getElementById('chat-body');
    if (!body) return;

    const apiKey = getApiKey();

    if (!apiKey) {
      body.innerHTML = `
        <div class="chat-key-area">
          <div class="key-icon">🔑</div>
          <h4>API Key Required</h4>
          <p>Enter your OpenRouter API key to start chatting with the AI travel assistant.</p>
          <input type="password" id="api-key-input" placeholder="sk-or-..." />
          <button onclick="window.__chatSaveKey()">Start Chatting</button>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" class="chat-key-link">Get a key at openrouter.ai/keys →</a>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Ask me about the trip..." autocomplete="off" />
          <button id="chat-send" onclick="window.__chatSend()">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div class="chat-footer-key">
          <button onclick="window.__chatClearKey()">🔑 Change API Key</button>
        </div>
      `;

      const input = document.getElementById('chat-input');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          window.__chatSend();
        }
      });

      // Show welcome if no messages
      if (messages.length === 0) {
        addSystemMessage('👋 Merhaba! İtalya seyahatiniz hakkında sorularınızı yanıtlayabilirim.');
      }
      renderMessages();
    }
  }

  function parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .trim()
      // Headers
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Lists (simple conversion mapping "\n- " to list items)
      .replace(/^\s*[-*]\s+(.*)$/gm, '<ul><li>$1</li></ul>')
      // Merge consecutive UL lists
      .replace(/<\/ul>\s*<ul>/g, '\n');

    // Paragraphs and line breaks
    html = html.split(/\n\n+/).map(block => {
      // If block starts with a block-level tag, do not wrap in <p>
      if (/^(<h[1-6]>|<ul>|<ol>)/i.test(block.trim())) {
        return block.trim();
      } else {
        // Replace single newlines with <br> inside paragraphs
        return '<p>' + block.trim().replace(/\n/g, '<br>') + '</p>';
      }
    }).join('\n\n');

    return html;
  }

  function addSystemMessage(text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-msg system-info';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Clear existing messages but keep system ones
    container.innerHTML = '';

    if (messages.length === 0) {
      addSystemMessage('👋 Merhaba! İtalya seyahatiniz hakkında sorularınızı yanıtlayabilirim.');
    }

    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat-msg ${msg.role}`;
      // Parse markdown only for assistant and system, user messages shouldn't be parsed if they contain raw html
      if (msg.role === 'assistant' || msg.role === 'system-info') {
        div.innerHTML = parseMarkdown(msg.content);
      } else {
        div.textContent = msg.content;
      }
      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  }

  // ── Global handlers ──
  window.__chatClearMessages = function () {
    if (messages.length === 0) return;
    if (confirm('Konuşma geçmişini silmek istediğinize emin misiniz?')) {
      messages = [];
      saveMessages();
      renderMessages();
    }
  };

  window.__chatSaveKey = function () {
    const input = document.getElementById('api-key-input');
    const key = input ? input.value.trim() : '';
    if (!key) return;
    localStorage.setItem(LS_KEY, key);
    renderBody();
  };

  window.__chatClearKey = function () {
    localStorage.removeItem(LS_KEY);
    renderBody();
  };

  window.__chatSend = async function () {
    if (isStreaming) return;
    const input = document.getElementById('chat-input');
    const text = input ? input.value.trim() : '';
    if (!text) return;

    // Add user message
    messages.push({ role: 'user', content: text });
    saveMessages();
    input.value = '';
    renderMessages();

    // Show thinking indicator
    const container = document.getElementById('chat-messages');
    const thinking = document.createElement('div');
    thinking.className = 'chat-thinking';
    thinking.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(thinking);
    container.scrollTop = container.scrollHeight;

    // Disable input
    isStreaming = true;
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const apiKey = getApiKey();
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: apiMessages,
          reasoning: {
            enabled: true
          }
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'Yanıt alınamadı.';

      // Remove thinking indicator
      if (thinking.parentNode) thinking.remove();

      messages.push({ role: 'assistant', content: assistantContent });
      saveMessages();
      renderMessages();
    } catch (err) {
      if (thinking.parentNode) thinking.remove();
      addSystemMessage(`⚠️ Hata: ${err.message}`);
    } finally {
      isStreaming = false;
      const sendBtn2 = document.getElementById('chat-send');
      if (sendBtn2) sendBtn2.disabled = false;
      const input2 = document.getElementById('chat-input');
      if (input2) input2.focus();
    }
  };

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChat);
  } else {
    buildChat();
  }

  // Memory cleanup
  window.addEventListener('beforeunload', () => {
    isStreaming = false; // abort any internal flag
    const panel = document.getElementById('chat-panel');
    const toggle = document.getElementById('chat-toggle');
    if (panel) panel.remove();
    if (toggle) toggle.remove();
  });
})();
