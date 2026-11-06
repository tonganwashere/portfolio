(function () {
  'use strict';

  const API_ENDPOINT = window.TONGAN_API_URL || (['localhost', '127.0.0.1'].includes(location.hostname) ? '/api/chat' : 'https://portfolio-tongan.vercel.app/api/chat');

  const WELCOME_MESSAGE = `Hey! I'm **Tongan AI**. Feel free to ask me anything about my projects, tech stack, or background. What would you like to know?`;

  const SUGGESTED_QUESTIONS = [
    "What projects have you built?",
    "What is your tech stack?",
    "Tell me about Bread & Blades",
    "Tell me about your cats!"
  ];

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
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-primary">$1</strong>')
      .replace(/(?<!\*)\*([^*\s][^*]*?[^*\s]|\w)\*(?!\*)/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 decoration-sub hover:text-primary hover:decoration-primary transition-colors duration-150">$1</a>');
  }

  function renderMarkdown(text) {
    if (!text) return '';
    let raw = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    raw = raw.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, '<pre class="my-3 p-3 bg-base border border-line rounded text-xs font-mono overflow-x-auto text-primary"><code>$1</code></pre>');
    raw = raw.replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 bg-base border border-line rounded text-xs font-mono text-primary">$1</code>');

    const lines = raw.split('\n');
    const out = [];
    let currentList = null;
    let paragraphLines = [];

    function flushParagraph() {
      if (paragraphLines.length > 0) {
        out.push('<p class="mb-2 leading-relaxed">' + paragraphLines.map(formatInline).join('<br>') + '</p>');
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

      if (line.startsWith('<pre class="')) {
        flushParagraph();
        flushList();
        out.push(line);
        continue;
      }

      const ulMatch = line.match(/^[-*]\s+(.*)$/);
      if (ulMatch) {
        flushParagraph();
        if (currentList !== 'ul') {
          flushList();
          currentList = 'ul';
          out.push('<ul class="list-disc pl-5 mb-2 space-y-1">');
        }
        out.push('<li>' + formatInline(ulMatch[1]) + '</li>');
        continue;
      }

      const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        flushParagraph();
        if (currentList !== 'ol') {
          flushList();
          currentList = 'ol';
          out.push('<ol class="list-decimal pl-5 mb-2 space-y-1">');
        }
        out.push('<li>' + formatInline(olMatch[2]) + '</li>');
        continue;
      }

      const bqMatch = line.match(/^>\s*(.*)$/);
      if (bqMatch) {
        flushParagraph();
        flushList();
        out.push('<blockquote class="border-l-2 border-line pl-3 my-2 text-sub italic">' + formatInline(bqMatch[1]) + '</blockquote>');
        continue;
      }

      paragraphLines.push(line);
    }

    flushParagraph();
    flushList();
    return out.join('');
  }

  function attachCursor(html) {
    const cursor = '<span class="inline-block w-[2px] h-[1.05em] bg-[var(--color-primary)] ml-[2px] align-[-0.12em] animate-pulse"></span>';
    const targets = ['</p>', '</li>', '</blockquote>', '</div>'];
    let bestIdx = -1;
    let bestTarget = '';

    for (let i = 0; i < targets.length; i++) {
      const tag = targets[i];
      const idx = html.lastIndexOf(tag);
      if (idx > bestIdx) {
        bestIdx = idx;
        bestTarget = tag;
      }
    }

    if (bestIdx !== -1) {
      return html.slice(0, bestIdx) + cursor + html.slice(bestIdx);
    }
    return html + cursor;
  }

  class TypewriterStreamer {
    constructor(container, onComplete) {
      this.container = container;
      this.onComplete = onComplete;
      this.targetText = '';
      this.renderedChars = 0;
      this.timer = null;
      this.donePushing = false;
      this.onVisibilityChange = this.onVisibilityChange.bind(this);
      this.container.innerHTML = '<span class="inline-block w-[2px] h-[1.05em] bg-[var(--color-primary)] ml-[2px] align-[-0.12em] animate-pulse"></span>';
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    onVisibilityChange() {
      if (document.hidden && this.donePushing) {
        this.stop();
      }
    }

    pushChunk(text) {
      this.targetText += text;
      if (!this.timer) {
        this.startLoop();
      }
    }

    finish() {
      this.donePushing = true;
      if (document.hidden) {
        this.stop();
      } else if (!this.timer && this.renderedChars >= this.targetText.length) {
        this.stop();
      }
    }

    stop() {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.renderedChars = this.targetText.length;
      try {
        this.container.innerHTML = renderMarkdown(this.targetText);
      } catch (e) {
        this.container.textContent = this.targetText;
      }
      scrollToBottom(true);
      if (this.onComplete) this.onComplete();
    }

    startLoop() {
      const self = this;
      this.timer = setInterval(function () {
        if (self.renderedChars < self.targetText.length) {
          const remaining = self.targetText.length - self.renderedChars;
          let step = 1;
          if (self.donePushing) {
            step = Math.max(step, Math.ceil(remaining / 3));
          } else if (remaining > 60) {
            step = 3;
          } else if (remaining > 20) {
            step = 2;
          }

          self.renderedChars = Math.min(self.renderedChars + step, self.targetText.length);
          const partial = self.targetText.slice(0, self.renderedChars);
          try {
            self.container.innerHTML = attachCursor(renderMarkdown(partial));
          } catch (e) {
            self.container.textContent = partial;
          }
          scrollToBottom();
        } else if (self.donePushing) {
          self.stop();
        }
      }, 16);
    }
  }

  function scrollToBottom(force) {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return;
    if (force) {
      feed.scrollTop = feed.scrollHeight;
      return;
    }
    const distanceToBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    if (distanceToBottom < 100) {
      feed.scrollTop = feed.scrollHeight;
    }
  }

  function renderMessageUI(role, text) {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return null;

    const wrap = document.createElement('div');
    if (role === 'user') {
      wrap.className = 'flex justify-end mb-4';
      wrap.innerHTML = `
        <div class="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-surface border border-line text-primary text-sm sm:text-base leading-relaxed">
          ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}
        </div>
      `;
    } else {
      wrap.className = 'flex items-start gap-3 mb-6';
      wrap.innerHTML = `
        <div class="shrink-0 w-8 h-8 rounded-md bg-surface border border-line p-0.5 aspect-square flex items-center justify-center">
          <img src="/assets/icons/tongan-pixelart.png" alt="Tongan AI" class="w-full h-full object-contain [image-rendering:pixelated]" style="image-rendering: pixelated;" />
        </div>
        <div class="chat-bubble-content flex-1 min-w-0 max-w-[90%] px-4 py-3 rounded-lg bg-surface border border-line text-primary text-sm sm:text-base leading-relaxed">
          ${renderMarkdown(text)}
        </div>
      `;
    }

    feed.appendChild(wrap);
    scrollToBottom(true);
    return wrap.querySelector('.chat-bubble-content');
  }

  function rebuildFeed() {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return;
    feed.innerHTML = '';

    renderMessageUI('assistant', WELCOME_MESSAGE);

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const text = m.content || (m.parts && m.parts[0] ? m.parts[0].text : '');
      if (text) renderMessageUI(m.role, text);
    }

    renderChips();
    scrollToBottom(true);
  }

  function renderChips() {
    const chipsBox = document.getElementById('chat-page-chips');
    if (!chipsBox) return;

    if (messages.length >= 4) {
      chipsBox.classList.add('hidden');
      return;
    }
    chipsBox.classList.remove('hidden');
    chipsBox.innerHTML = `
      <p class="text-xs text-muted mb-2 font-medium">Suggested questions</p>
      <div class="flex flex-wrap gap-2">
        ${SUGGESTED_QUESTIONS.map(q => `
          <button type="button" class="chat-chip cursor-pointer text-xs sm:text-sm px-3 py-1.5 rounded-md border border-line bg-surface hover:border-muted text-sub hover:text-primary transition-colors duration-150">
            ${q}
          </button>
        `).join('')}
      </div>
    `;

    chipsBox.querySelectorAll('.chat-chip').forEach(btn => {
      btn.addEventListener('click', function () {
        handleSend(this.textContent.trim());
      });
    });
  }

  async function handleSend(text) {
    if (!text || isGenerating) return;

    const input = document.getElementById('chat-page-input');
    if (input) input.value = '';

    messages.push({ role: 'user', content: text });
    saveHistory();
    renderMessageUI('user', text);
    renderChips();

    isGenerating = true;
    const sendBtn = document.getElementById('chat-page-send');
    if (sendBtn) sendBtn.disabled = true;

    const feed = document.getElementById('chat-page-feed');
    const wrap = document.createElement('div');
    wrap.className = 'flex items-start gap-3 mb-6';
    wrap.innerHTML = `
      <div class="shrink-0 w-8 h-8 rounded-md bg-surface border border-line p-0.5 aspect-square flex items-center justify-center">
        <img src="/assets/icons/tongan-pixelart.png" alt="Tongan AI" class="w-full h-full object-contain [image-rendering:pixelated]" style="image-rendering: pixelated;" />
      </div>
      <div class="chat-bubble-content flex-1 min-w-0 max-w-[90%] px-4 py-3 rounded-lg bg-surface border border-line text-primary text-sm sm:text-base leading-relaxed">
        <span class="inline-block w-[2px] h-[1.05em] bg-[var(--color-primary)] ml-[2px] align-[-0.12em] animate-pulse"></span>
      </div>
    `;
    feed.appendChild(wrap);
    const bubble = wrap.querySelector('.chat-bubble-content');
    scrollToBottom(true);

    let fullResponse = '';
    const controller = new AbortController();
    let streamTimer = setTimeout(() => controller.abort(), 25000);

    const streamer = new TypewriterStreamer(bubble, function () {
      isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
      if (fullResponse) {
        messages.push({ role: 'assistant', content: fullResponse });
        saveHistory();
      }
    });

    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ messages: messages.slice(-8) })
      });

      if (!res.ok) {
        let errData = {};
        try {
          errData = await res.json();
        } catch (e) {}
        const err = new Error(errData.error || 'Request failed with status ' + res.status);
        err.status = res.status;
        throw err;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      function handleChatLine(line) {
        if (!line.startsWith('data: ')) return;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed && parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed && parsed.text) {
            fullResponse += parsed.text;
            streamer.pushChunk(parsed.text);
          }
        } catch (e) {
          if (e && e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        clearTimeout(streamTimer);
        streamTimer = setTimeout(() => controller.abort(), 20000);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          handleChatLine(line);
        }
      }

      clearTimeout(streamTimer);
      if (buffer && buffer.trim()) {
        handleChatLine(buffer.trim());
      }

      streamer.finish();
    } catch (err) {
      clearTimeout(streamTimer);
      isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
      streamer.stop();
      let displayError = "I am having a little trouble connecting right now. Please try again in a moment!";
      if (err.name === 'AbortError') {
        displayError = "The request timed out. Please try sending your message again in a moment!";
      } else if (err.message === 'OFFLINE') {
        displayError = "It looks like you're offline. Please check your internet connection and try again!";
      } else if (err.status === 429) {
        displayError = err.message || "I have reached my daily message limit for today! Feel free to reach out directly on Telegram @tonganwashere.";
      } else if (err.status === 503) {
        displayError = "Google AI service is currently experiencing high traffic. Please try again in a moment!";
      } else if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Request failed')) {
        displayError = err.message;
      }
      bubble.innerHTML = renderMarkdown(displayError);
    }
  }

  function init() {
    rebuildFeed();

    const form = document.getElementById('chat-page-form');
    const input = document.getElementById('chat-page-input');
    const clearBtn = document.getElementById('chat-page-clear');

    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const text = input.value.trim();
        if (text) handleSend(text);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (isGenerating) return;
        messages = [];
        saveHistory();
        rebuildFeed();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();