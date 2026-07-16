import { api } from '../api.js';

const CONTEXT_MAP = {
  'dashboard-client': 'event',
  'dashboard-planner': 'event',
  'dashboard-vendor': 'event',
  'events': 'event',
  'create-event': 'event',
  'event-detail': 'event',
  'dashboard-judge': 'innovation',
  'dashboard-admin': 'general',
  'innovation': 'innovation',
  'submit-innovation': 'innovation',
  'innovation-detail': 'innovation',
  'leaderboard': 'innovation',
  'landing': 'general',
};

function detectContext() {
  const page = document.querySelector('[data-page]');
  if (!page) return 'general';
  return CONTEXT_MAP[page.dataset.page] || 'general';
}

function getContextLabel(ctx) {
  const labels = {
    event: 'Event Planning Assistant',
    innovation: 'Innovation Coach',
    general: 'MEIH Assistant',
  };
  return labels[ctx] || labels.general;
}

function getContextColor(ctx) {
  return ctx === 'event' ? '#6c5ce7' : ctx === 'innovation' ? '#00cec9' : '#6c5ce7';
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

export function initAIAssistant() {
  const root = document.getElementById('ai-root');
  if (!root) return;

  const ctx = detectContext();
  const accentColor = getContextColor(ctx);

  root.innerHTML = `
    <style>
      .ai-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${accentColor}, ${ctx === 'innovation' ? '#22d3ee' : '#a855f7'});
        color: #fff;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: 800;
        font-family: var(--font-heading);
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px ${accentColor}44;
        z-index: 1000;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        animation: ai-rotate 4s linear infinite;
      }
      @keyframes ai-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .ai-fab:hover {
        transform: scale(1.08) rotate(0deg);
        box-shadow: 0 6px 28px ${accentColor}66;
        animation-play-state: paused;
      }
      .ai-fab.active {
        border-radius: var(--radius-lg);
        width: auto;
        padding: 0 16px;
        gap: 8px;
        font-size: 14px;
        animation: none;
      }

      .ai-chat-panel {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 380px;
        max-height: 520px;
        background: #12121a;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: var(--radius-xl);
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        z-index: 999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(16px);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .ai-chat-panel.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      .ai-chat-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, ${accentColor}22, ${accentColor}11);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ai-chat-header h3 {
        font-size: 15px;
        font-weight: 700;
        color: var(--color-text);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ai-chat-header .ai-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${accentColor};
        box-shadow: 0 0 8px ${accentColor};
      }
      .ai-chat-header .ai-status {
        font-size: 11px;
        color: var(--color-muted);
        font-weight: 400;
      }
      .ai-close-btn {
        background: none;
        border: none;
        color: var(--color-muted);
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      }
      .ai-close-btn:hover { color: var(--color-text); }

      .ai-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 360px;
        min-height: 200px;
      }

      .ai-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: var(--radius-md);
        font-size: 13px;
        line-height: 1.6;
        animation: fadeIn 0.2s ease;
      }
      .ai-msg.user {
        align-self: flex-end;
        background: ${accentColor};
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .ai-msg.bot {
        align-self: flex-start;
        background: var(--color-surface-raised);
        color: var(--color-text);
        border-bottom-left-radius: 4px;
      }
      .ai-msg.bot code {
        background: rgba(255,255,255,0.06);
        padding: 1px 5px;
        border-radius: 3px;
        font-size: 12px;
      }

      .ai-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        align-self: flex-start;
      }
      .ai-typing span {
        width: 6px;
        height: 6px;
        background: var(--color-muted);
        border-radius: 50%;
        animation: typing 1.2s ease-in-out infinite;
      }
      .ai-typing span:nth-child(2) { animation-delay: 0.15s; }
      .ai-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes typing { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

      .ai-chat-input {
        padding: 12px 16px;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        gap: 8px;
        background: var(--color-surface);
      }
      .ai-chat-input input {
        flex: 1;
        background: var(--color-surface-raised);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: var(--radius-md);
        padding: 10px 14px;
        color: var(--color-text);
        font-size: 13px;
        font-family: var(--font-base);
        outline: none;
        transition: border-color 0.15s;
      }
      .ai-chat-input input:focus { border-color: ${accentColor}; }
      .ai-chat-input input::placeholder { color: var(--color-muted); }
      .ai-chat-input button {
        background: ${accentColor};
        color: #fff;
        border: none;
        border-radius: var(--radius-md);
        padding: 10px 16px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .ai-chat-input button:hover { opacity: 0.9; }
      .ai-chat-input button:disabled { opacity: 0.4; cursor: not-allowed; }

      .ai-welcome {
        text-align: center;
        padding: 24px 16px;
        color: var(--color-muted);
      }
      .ai-welcome .ai-icon { font-size: 28px; font-weight: 800; font-family: var(--font-heading); background: linear-gradient(135deg, ${accentColor}, ${ctx === 'innovation' ? '#22d3ee' : '#a855f7'}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
      .ai-welcome p { font-size: 12px; line-height: 1.5; }

      @media (max-width: 480px) {
        .ai-chat-panel { right: 8px; left: 8px; width: auto; bottom: 84px; }
      }
    </style>

    <button class="ai-fab" id="ai-fab">AI</button>

    <div class="ai-chat-panel" id="ai-chat-panel">
      <div class="ai-chat-header">
        <div>
          <h3><span class="ai-dot"></span> ${getContextLabel(ctx)}</h3>
        </div>
        <button class="ai-close-btn" id="ai-close">&times;</button>
      </div>

      <div class="ai-chat-messages" id="ai-messages">
        <div class="ai-welcome">
          <div class="ai-icon">AI</div>
          <p>Hi! I'm your MEIH ${ctx === 'event' ? 'event planning assistant' : ctx === 'innovation' ? 'innovation coach' : 'assistant'}.<br/>Ask me anything about ${ctx === 'event' ? 'planning events, finding vendors, or budgeting' : ctx === 'innovation' ? 'innovations, competitions, or submissions' : 'the platform'}.</p>
        </div>
      </div>

      <div class="ai-chat-input">
        <input type="text" id="ai-input" placeholder="Type your question..." />
        <button id="ai-send">Send</button>
      </div>
    </div>
  `;

  const fab = document.getElementById('ai-fab');
  const panel = document.getElementById('ai-chat-panel');
  const messages = document.getElementById('ai-messages');
  const input = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const closeBtn = document.getElementById('ai-close');
  const context = detectContext();

  function togglePanel() {
    panel.classList.toggle('open');
    fab.classList.toggle('active');
    if (panel.classList.contains('open')) {
      fab.textContent = '✕';
      input.focus();
    } else {
      fab.textContent = 'AI';
    }
  }

  function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `ai-msg ${type}`;
    div.innerHTML = renderMarkdown(text);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ai-typing';
    div.id = 'ai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('ai-typing');
    if (t) t.remove();
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Remove welcome message
    const welcome = messages.querySelector('.ai-welcome');
    if (welcome) welcome.remove();

    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    showTyping();

    try {
      const result = await api.post('/ai/chat', { message: text, context });
      removeTyping();
      addMessage(result.reply, 'bot');
    } catch (err) {
      removeTyping();
      addMessage("Sorry, I'm having trouble connecting right now. Please try again.", 'bot');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // Event listeners
  fab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Also allow navbar AI button to toggle
  const navAiBtn = document.getElementById('ai-assistant-toggle');
  if (navAiBtn) {
    navAiBtn.addEventListener('click', togglePanel);
  }
}
