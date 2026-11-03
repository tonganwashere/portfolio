(function () {
  'use strict';

  if (window.location.pathname.startsWith('/chat')) {
    return;
  }

  const API_ENDPOINT = window.TONGAN_API_URL || (['localhost', '127.0.0.1'].includes(location.hostname) ? '/api/chat' : 'https://portfolio-tongan.vercel.app/api/chat');

  const WELCOME_MESSAGE = `Hey! I'm **Tongan AI**. Feel free to ask me anything about my projects, tech stack, or background. What would you like to know?`;

  const SUGGESTED_QUESTIONS = [
    "What projects have you built?",
    "What is your tech stack?",
    "Tell me about Bread & Blades",
    "Tell me about your cats!"
  ];

  let isOpen = false;
  let isGenerating = false;
  let messages = [];

  try {
    const saved = sessionStorage.getItem('tongan_chat_history');
    if (saved) messages = JSON.parse(saved);
  } catch (e) {
    messages = [];
  }

  function saveHistory() {
    try {
      sessionStorage.setItem('tongan_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }

  function formatInline(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="tongan-bold">$1</strong>')
      .replace(/(?<!\*)\*([^*\s][^*]*?[^*\s]|\w)\*(?!\*)/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="tongan-link">$1</a>');
  }

  function renderMarkdown(text) {
    if (!text) return '';
    let raw = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    raw = raw.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, '<pre class="tongan-code-block"><code>$1</code></pre>');
    raw = raw.replace(/`([^`\n]+)`/g, '<code class="tongan-code-inline">$1</code>');

    const lines = raw.split('\n');
    const out = [];
    let currentList = null;
    let paragraphLines = [];

    function flushParagraph() {
      if (paragraphLines.length > 0) {
        out.push('<p>' + paragraphLines.map(formatInline).join('<br>') + '</p>');
        paragraphLines = [];
      }
    }

    function flushList() {
      if (currentList) {
        out.push('</' + currentList + '>');
        currentList = null;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      if (line.startsWith('<pre class="tongan-code-block">')) {
        flushParagraph();
        flushList();
        out.push(line);
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
        out.push('<' + tag + ' class="tongan-' + tag + '">' + formatInline(headingMatch[2]) + '</' + tag + '>');
        continue;
      }

      const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
      if (ulMatch) {
        flushParagraph();
        if (currentList !== 'ul') {
          flushList();
          out.push('<ul class="tongan-list">');
          currentList = 'ul';
        }
        out.push('<li>' + formatInline(ulMatch[1]) + '</li>');
        continue;
      }

      const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
      if (olMatch) {
        flushParagraph();
        if (currentList !== 'ol') {
          flushList();
          out.push('<ol class="tongan-list tongan-ol">');
          currentList = 'ol';
        }
        out.push('<li>' + formatInline(olMatch[1]) + '</li>');
        continue;
      }

      const quoteMatch = line.match(/^\s*&gt;\s*(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushList();
        out.push('<blockquote class="tongan-blockquote">' + formatInline(quoteMatch[1]) + '</blockquote>');
        continue;
      }

      if (/^\s*---+\s*$/.test(trimmed)) {
        flushParagraph();
        flushList();
        out.push('<hr class="tongan-hr" />');
        continue;
      }

      flushList();
      paragraphLines.push(line);
    }

    flushParagraph();
    flushList();

    return out.join('');
  }

  function injectStyles() {
    if (document.getElementById('tongan-assistant-styles')) return;

    const style = document.createElement('style');
    style.id = 'tongan-assistant-styles';
    style.textContent = `
      #tongan-assistant-root {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: var(--font-sans, "Inter", -apple-system, sans-serif);
      }
      @media (max-width: 640px) {
        #tongan-assistant-root {
          bottom: 16px;
          right: 16px;
        }
      }

      .tongan-trigger-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background-color: var(--color-surface);
        border: 1px solid var(--color-line);
        border-radius: 9999px;
        padding: 6px 14px 6px 6px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        user-select: none;
        color: var(--color-primary);
      }
      .dark .tongan-trigger-btn {
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.45);
      }
      .tongan-trigger-btn:hover {
        border-color: var(--color-muted);
        transform: translateY(-1px);
      }
      .tongan-avatar-box {
        position: relative;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }
      .tongan-trigger-avatar {
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background-color: var(--color-base);
        border: 1px solid var(--color-line);
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .tongan-status-dot {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background-color: #10b981;
        border: 2px solid var(--color-surface);
        z-index: 2;
      }

      .tongan-chat-window {
        display: none;
        flex-direction: column;
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 400px;
        max-width: calc(100vw - 32px);
        height: 590px;
        max-height: calc(100vh - 48px);
        background-color: var(--color-surface);
        border: 1px solid var(--color-line);
        border-radius: 18px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
        overflow: hidden;
        z-index: 10000;
        animation: tonganFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .dark .tongan-chat-window {
        box-shadow: 0 14px 50px rgba(0, 0, 0, 0.65);
      }
      @media (max-width: 640px) {
        .tongan-chat-window {
          top: 12px;
          bottom: 12px;
          left: 12px;
          right: 12px;
          width: auto;
          max-width: none;
          height: auto;
          max-height: none;
          border-radius: 16px;
        }
      }
      @keyframes tonganFadeIn {
        from { opacity: 0; transform: scale(0.96) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      .tongan-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: var(--color-base);
        border-bottom: 1px solid var(--color-line);
        user-select: none;
        flex-shrink: 0;
      }
      .tongan-chat-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .tongan-header-avatar-box {
        position: relative;
        width: 34px;
        height: 34px;
        flex-shrink: 0;
      }
      .tongan-header-avatar {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        border: 1px solid var(--color-line);
        background-color: var(--color-surface);
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .tongan-header-title-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-primary);
        line-height: 1;
        letter-spacing: -0.01em;
      }
      .tongan-header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .tongan-icon-btn {
        background: none;
        border: none;
        padding: 6px;
        border-radius: 6px;
        color: var(--color-sub);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s, background-color 0.15s;
      }
      .tongan-icon-btn:hover {
        color: var(--color-primary);
        background-color: var(--color-surface);
      }

      .tongan-chat-feed {
        flex: 1 1 0%;
        min-height: 0;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: var(--color-line) transparent;
      }
      .tongan-chat-feed::-webkit-scrollbar {
        width: 5px;
      }
      .tongan-chat-feed::-webkit-scrollbar-track {
        background: transparent;
      }
      .tongan-chat-feed::-webkit-scrollbar-thumb {
        background-color: var(--color-line);
        border-radius: 9999px;
      }

      .tongan-msg-user-wrap {
        display: flex;
        justify-content: flex-end;
      }
      .tongan-msg-user {
        max-width: 82%;
        background-color: #141414;
        color: #f8f7f4;
        border: 1px solid #141414;
        padding: 10px 14px;
        border-radius: 14px 14px 2px 14px;
        font-size: 13.5px;
        line-height: 1.5;
        word-break: break-word;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .dark .tongan-msg-user {
        background-color: #272727;
        color: #f0eeea;
        border-color: #383838;
      }

      .tongan-msg-assistant {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        align-self: flex-start;
        max-width: 95%;
      }
      .tongan-msg-assistant-avatar {
        width: 26px;
        height: 26px;
        border-radius: 6px;
        border: 1px solid var(--color-line);
        background-color: var(--color-surface);
        padding: 2px;
        flex-shrink: 0;
        margin-top: 2px;
        overflow: hidden;
      }
      .tongan-msg-assistant-bubble {
        flex: 1;
        background-color: var(--color-base);
        border: 1px solid var(--color-line);
        color: var(--color-primary);
        padding: 12px 14px;
        border-radius: 2px 14px 14px 14px;
        font-size: 13.5px;
        line-height: 1.55;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      }

      .tongan-msg-assistant-bubble p {
        margin: 0 0 10px 0;
      }
      .tongan-msg-assistant-bubble p:last-child {
        margin-bottom: 0;
      }
      .tongan-h2, .tongan-h3, .tongan-h4 {
        font-weight: 600;
        color: var(--color-primary);
        margin: 10px 0 6px 0;
        line-height: 1.3;
      }
      .tongan-h2 { font-size: 15px; }
      .tongan-h3 { font-size: 14px; }
      .tongan-h4 { font-size: 13.5px; }
      .tongan-h2:first-child, .tongan-h3:first-child, .tongan-h4:first-child {
        margin-top: 0;
      }
      .tongan-bold {
        font-weight: 600;
        color: var(--color-primary);
      }
      .tongan-msg-assistant-bubble a {
        color: var(--color-primary);
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: opacity 0.15s;
      }
      .tongan-msg-assistant-bubble a:hover {
        opacity: 0.75;
      }
      .tongan-list {
        margin: 6px 0 10px 0;
        padding-left: 20px;
        list-style-type: disc;
      }
      .tongan-list.tongan-ol {
        list-style-type: decimal;
      }
      .tongan-list:last-child {
        margin-bottom: 0;
      }
      .tongan-list li {
        margin-bottom: 4px;
        line-height: 1.5;
      }
      .tongan-list li:last-child {
        margin-bottom: 0;
      }
      .tongan-code-inline {
        background-color: var(--color-surface);
        border: 1px solid var(--color-line);
        padding: 1px 5px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
      }
      .tongan-code-block {
        background-color: var(--color-surface);
        border: 1px solid var(--color-line);
        padding: 10px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        overflow-x: auto;
        margin: 8px 0;
      }
      .tongan-blockquote {
        margin: 8px 0;
        padding: 4px 10px;
        border-left: 3px solid var(--color-muted);
        color: var(--color-sub);
        font-style: italic;
        background-color: var(--color-surface);
        border-radius: 0 6px 6px 0;
      }
      .tongan-hr {
        border: none;
        border-top: 1px solid var(--color-line);
        margin: 10px 0;
      }

      .tongan-chips-section {
        padding: 4px 0 6px 36px;
        transition: opacity 0.2s ease;
      }
      .tongan-chips-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-muted);
        margin: 0 0 8px 0;
        font-weight: 500;
      }
      .tongan-chips-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 7px;
      }
      .tongan-chip-btn {
        background-color: var(--color-base);
        border: 1px solid var(--color-line);
        color: var(--color-sub);
        font-size: 12.5px;
        padding: 7px 14px;
        border-radius: 9999px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
        line-height: 1.3;
        font-family: inherit;
        width: fit-content;
      }
      .tongan-chip-btn:hover {
        color: var(--color-primary);
        border-color: var(--color-muted);
        background-color: var(--color-surface);
      }

      .tongan-chat-input-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background-color: var(--color-base);
        border-top: 1px solid var(--color-line);
        flex-shrink: 0;
      }
      .tongan-chat-input {
        flex: 1;
        background-color: var(--color-surface);
        border: 1px solid var(--color-line);
        color: var(--color-primary);
        border-radius: 10px;
        padding: 9px 12px;
        font-size: 13.5px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
      }
      .tongan-chat-input::placeholder {
        color: var(--color-muted);
      }
      .tongan-chat-input:focus {
        border-color: var(--color-muted);
      }
      .tongan-send-btn {
        background-color: var(--color-surface);
        border: 1px solid var(--color-line);
        color: var(--color-sub);
        border-radius: 10px;
        padding: 9px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }
      .tongan-send-btn:hover:not(:disabled) {
        color: var(--color-primary);
        border-color: var(--color-muted);
      }
      .tongan-send-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .tongan-chat-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 12px;
        font-size: 10px;
        color: var(--color-muted);
        background-color: var(--color-surface);
        border-top: 1px solid var(--color-line);
        user-select: none;
        flex-shrink: 0;
      }

      .tongan-loading-dots {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        padding: 4px 0;
      }
      .tongan-dot {
        width: 5px;
        height: 5px;
        border-radius: 9999px;
        background-color: var(--color-muted);
        animation: tonganBounce 1.2s infinite ease-in-out;
      }
      .tongan-dot:nth-child(2) { animation-delay: 0.2s; }
      .tongan-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes tonganBounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1.1); opacity: 1; }
      }

      .tongan-cursor {
        display: inline-block;
        width: 2px;
        height: 1.05em;
        background-color: var(--color-primary);
        margin-left: 2px;
        vertical-align: -0.12em;
        animation: tonganCursorBlink 0.75s infinite;
      }
      @keyframes tonganCursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function createChatWidget() {
    injectStyles();

    const container = document.createElement('div');
    container.id = 'tongan-assistant-root';

    container.innerHTML = `
      <div id="tongan-chat-window" class="tongan-chat-window">
        <div class="tongan-chat-header">
          <div class="tongan-chat-header-title">
            <div class="tongan-header-avatar-box">
              <div class="tongan-header-avatar">
                <img src="/assets/icons/tongan-pixelart.png" alt="Tongan AI" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />
              </div>
              <span class="tongan-status-dot"></span>
            </div>
            <span class="tongan-header-title-text">Tongan AI</span>
          </div>
          
          <div class="tongan-header-actions">
            <button type="button" id="tongan-clear-btn" class="tongan-icon-btn" title="Reset Conversation">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            </button>
            <button type="button" id="tongan-close-btn" class="tongan-icon-btn" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div id="tongan-messages-feed" class="tongan-chat-feed">
          <div class="tongan-msg-assistant">
            <div class="tongan-msg-assistant-avatar">
              <img src="/assets/icons/tongan-pixelart.png" alt="" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />
            </div>
            <div class="tongan-msg-assistant-bubble">
              ${renderMarkdown(WELCOME_MESSAGE)}
            </div>
          </div>

          <div id="tongan-chips-container" class="tongan-chips-section">
            <p class="tongan-chips-title">Suggested Questions</p>
            <div class="tongan-chips-wrap">
              ${SUGGESTED_QUESTIONS.map(q => `
                <button type="button" class="tongan-chip-btn">
                  ${q}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <form id="tongan-chat-form" class="tongan-chat-input-bar">
          <input type="text" id="tongan-chat-input" 
                 placeholder="Ask me anything..." 
                 autocomplete="off"
                 class="tongan-chat-input" />
          <button type="submit" id="tongan-send-btn" 
                  aria-label="Send message"
                  class="tongan-send-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>

        <div class="tongan-chat-footer">
          <span>Ask about my code or life</span>
          <span>Esc / Ctrl+K to close</span>
        </div>
      </div>

      <button type="button" id="tongan-trigger-btn"
              aria-label="Chat with Tongan AI"
              class="tongan-trigger-btn">
        <div class="tongan-avatar-box">
          <div class="tongan-trigger-avatar">
            <img src="/assets/icons/tongan-pixelart.png" alt="Tongan AI" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />
          </div>
          <span class="tongan-status-dot"></span>
        </div>
        <div style="text-align: left;">
          <span style="display: block; font-size: 13px; font-weight: 500; line-height: 1.2;">Chat with Tongan AI</span>
          <span style="display: block; font-size: 10px; color: var(--color-muted); line-height: 1.2;">Ask me anything</span>
        </div>
      </button>
    `;

    document.body.appendChild(container);
    setupEventListeners();
  }

  function setupEventListeners() {
    const triggerBtn = document.getElementById('tongan-trigger-btn');
    const closeBtn = document.getElementById('tongan-close-btn');
    const clearBtn = document.getElementById('tongan-clear-btn');
    const chatWindow = document.getElementById('tongan-chat-window');
    const form = document.getElementById('tongan-chat-form');
    const input = document.getElementById('tongan-chat-input');
    const chipsContainer = document.getElementById('tongan-chips-container');

    function toggleChat(forceState) {
      isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
      if (isOpen) {
        chatWindow.style.display = 'flex';
        triggerBtn.style.display = 'none';
        input.focus();
        scrollToBottom();
      } else {
        chatWindow.style.display = 'none';
        triggerBtn.style.display = 'flex';
      }
    }

    triggerBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    function bindChipButtons(parent) {
      const btns = (parent || document).querySelectorAll('.tongan-chip-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          handleUserInput(btn.textContent.trim());
        });
      });
    }

    clearBtn.addEventListener('click', () => {
      if (isGenerating) return;
      messages = [];
      saveHistory();
      const feed = document.getElementById('tongan-messages-feed');
      feed.innerHTML = `
        <div class="tongan-msg-assistant">
          <div class="tongan-msg-assistant-avatar">
            <img src="/assets/icons/tongan-pixelart.png" alt="" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />
          </div>
          <div class="tongan-msg-assistant-bubble">
            ${renderMarkdown(WELCOME_MESSAGE)}
          </div>
        </div>
        <div id="tongan-chips-container" class="tongan-chips-section">
          <p class="tongan-chips-title">Suggested Questions</p>
          <div class="tongan-chips-wrap">
            ${SUGGESTED_QUESTIONS.map(q => `
              <button type="button" class="tongan-chip-btn">
                ${q}
              </button>
            `).join('')}
          </div>
        </div>
      `;
      bindChipButtons(feed);
    });

    bindChipButtons();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || isGenerating) return;
      input.value = '';
      handleUserInput(text);
    });

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleChat();
      } else if (e.key === 'Escape' && isOpen) {
        toggleChat(false);
      }
    });

    if (messages.length > 0) {
      if (chipsContainer) chipsContainer.style.display = 'none';
      messages.forEach(msg => appendMessageUI(msg.role, msg.content));
    }
  }

  function scrollToBottom(force = false) {
    const feed = document.getElementById('tongan-messages-feed');
    if (!feed) return;
    const isNearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
    if (force || isNearBottom) {
      feed.scrollTop = feed.scrollHeight;
    }
  }

  function attachCursor(html) {
    if (!html) return '<span class="tongan-cursor"></span>';
    const lastP = html.lastIndexOf('</p>');
    const lastLi = html.lastIndexOf('</li>');
    const lastBlockquote = html.lastIndexOf('</blockquote>');
    const lastCode = html.lastIndexOf('</code>');
    const targetIdx = Math.max(lastP, lastLi, lastBlockquote, lastCode);
    if (targetIdx !== -1) {
      return html.slice(0, targetIdx) + '<span class="tongan-cursor"></span>' + html.slice(targetIdx);
    }
    return html + '<span class="tongan-cursor"></span>';
  }

  class TypewriterStreamer {
    constructor(bubbleContainer) {
      this.container = bubbleContainer;
      this.targetText = '';
      this.displayedLength = 0;
      this.isStreamDone = false;
      this.timer = null;
      this.resolvePromise = null;
      this.completionPromise = new Promise(resolve => {
        this.resolvePromise = resolve;
      });
      this.tick = this.tick.bind(this);
    }

    start() {
      this.container.innerHTML = '<span class="tongan-cursor"></span>';
      this.timer = setInterval(this.tick, 16);
    }

    append(chunk) {
      this.targetText += chunk;
    }

    finishStream() {
      this.isStreamDone = true;
    }

    tick() {
      const remaining = this.targetText.length - this.displayedLength;

      if (remaining > 0) {
        let step = 1;
        if (remaining > 120) {
          step = Math.ceil(remaining / 8);
        } else if (remaining > 50) {
          step = 3;
        } else if (remaining > 20) {
          step = 2;
        } else {
          step = 1;
        }

        this.displayedLength = Math.min(this.targetText.length, this.displayedLength + step);
        const partial = this.targetText.slice(0, this.displayedLength);
        this.container.innerHTML = attachCursor(renderMarkdown(partial));
        scrollToBottom();
      } else if (this.isStreamDone) {
        this.stop();
      }
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.displayedLength = this.targetText.length;
      this.container.innerHTML = renderMarkdown(this.targetText);
      scrollToBottom();
      if (this.resolvePromise) {
        this.resolvePromise(this.targetText);
        this.resolvePromise = null;
      }
    }

    waitUntilDone() {
      return this.completionPromise;
    }
  }

  function appendMessageUI(role, content) {
    const feed = document.getElementById('tongan-messages-feed');
    if (!feed) return null;

    const wrapper = document.createElement('div');

    if (role === 'user') {
      wrapper.className = 'tongan-msg-user-wrap';
      wrapper.innerHTML = `
        <div class="tongan-msg-user">
          ${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      `;
    } else {
      wrapper.className = 'tongan-msg-assistant';
      wrapper.innerHTML = `
        <div class="tongan-msg-assistant-avatar">
          <img src="/assets/icons/tongan-pixelart.png" alt="" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />
        </div>
        <div class="tongan-msg-assistant-bubble">
          ${renderMarkdown(content)}
        </div>
      `;
    }

    feed.appendChild(wrapper);
    scrollToBottom(true);
    return wrapper;
  }

  async function handleUserInput(query) {
    if (isGenerating || !query) return;

    const chipsContainer = document.getElementById('tongan-chips-container');
    if (chipsContainer) {
      chipsContainer.style.display = 'none';
    }

    messages.push({ role: 'user', content: query });
    appendMessageUI('user', query);
    saveHistory();

    isGenerating = true;
    const sendBtn = document.getElementById('tongan-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    const feed = document.getElementById('tongan-messages-feed');
    const assistantBubble = document.createElement('div');
    assistantBubble.className = 'tongan-msg-assistant';
    assistantBubble.innerHTML = `
      <div class="tongan-msg-assistant-avatar">
        <img src="/assets/icons/tongan-pixelart.png" alt="" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" />
      </div>
      <div class="tongan-msg-assistant-bubble">
        <div class="tongan-loading-dots">
          <span class="tongan-dot"></span>
          <span class="tongan-dot"></span>
          <span class="tongan-dot"></span>
        </div>
      </div>
    `;
    feed.appendChild(assistantBubble);
    scrollToBottom(true);

    const bubbleContainer = assistantBubble.querySelector('.tongan-msg-assistant-bubble');
    let typewriter = null;
    let fullResponse = '';

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        let errMsg = `AI service returned ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;

            let parsed = null;
            try {
              parsed = JSON.parse(dataStr);
            } catch (e) {}

            if (parsed) {
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                if (!typewriter) {
                  bubbleContainer.innerHTML = '';
                  typewriter = new TypewriterStreamer(bubbleContainer);
                  typewriter.start();
                }
                typewriter.append(parsed.text);
              }
            }
          }
        }
      }

      if (!typewriter) {
        fullResponse = "I'm not sure how to respond to that, but feel free to reach out to me directly on Telegram [@tonganwashere](https://t.me/tonganwashere)!";
        bubbleContainer.innerHTML = renderMarkdown(fullResponse);
      } else {
        typewriter.finishStream();
        fullResponse = await typewriter.waitUntilDone();
      }

      messages.push({ role: 'assistant', content: fullResponse });
      saveHistory();

    } catch (err) {
      console.error('AI chat error:', err);
      if (typewriter) {
        typewriter.stop();
      }
      let displayError = '';
      if (!navigator.onLine) {
        displayError = "It looks like you're offline. Please check your internet connection and try again!";
      } else if (err && err.message && !err.message.includes('Failed to fetch') && !err.message.includes('AI service returned')) {
        displayError = err.message;
      } else {
        displayError = "I couldn't reach the AI service right now. Please try again in a moment, or reach out to me directly on Telegram [@tonganwashere](https://t.me/tonganwashere)!";
      }
      bubbleContainer.innerHTML = renderMarkdown(displayError);
      messages.push({ role: 'assistant', content: displayError });
      saveHistory();
    } finally {
      isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
      scrollToBottom(true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }

})();