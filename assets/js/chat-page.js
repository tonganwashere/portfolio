(function () {
  'use strict';

  const API_ENDPOINT = window.TONGAN_API_URL || (['localhost', '127.0.0.1'].includes(location.hostname) ? '/api/chat' : 'https://portfolio-tongan.vercel.app/api/chat');

  const WELCOME_MESSAGE = `Hey! I'm an **AI version of Tongan**. Feel free to ask me anything about my projects or background. What would you like to know?`;

  const SUGGESTED_QUESTIONS = [
    "What projects have you built?",
    "Tell me about Bread & Blades",
    "Tell me about your cats!"
  ];

  let isGenerating = false;
  let messages = [];
  let autoScrollEnabled = true;
  let isProgrammaticScroll = false;
  let smoothScrollTimer = null;
  let activeStream = null;

  try {
    const saved = sessionStorage.getItem('tongan_chat_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) messages = parsed;
    }
  } catch (e) {
    messages = [];
  }

  function saveHistory() {
    try {
      sessionStorage.setItem('tongan_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {}
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatInline(text) {
    if (!text) return '';
    const inlineCodes = [];
    let processed = text.replace(/`([^`\n]+)`/g, (_, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push('<code class="px-1.5 py-0.5 bg-base border border-line rounded text-xs font-mono text-primary">' + code + '</code>');
      return '@@INLINECODE' + idx + '@@';
    });

    processed = processed
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-primary">$1</strong>')
      .replace(/(?<!\*)\*([^*\s][^*]*?[^*\s]|\w)\*(?!\*)/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"'<>]+|\/[^\s)"'<>]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 decoration-sub hover:text-primary hover:decoration-primary transition-colors duration-150">$1</a>');

    return processed.replace(/@@INLINECODE(\d+)@@/g, (_, idx) => inlineCodes[Number(idx)] || '');
  }

  function renderMarkdown(text) {
    if (!text) return '';
    let raw = escapeHtml(text);

    const codeBlocks = [];
    raw = raw.replace(/```([a-zA-Z0-9_-]+)?[ \t]*\r?\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang ? lang.trim() : 'code';
      const trimmedCode = code.replace(/\r?\n$/, '');
      const idx = codeBlocks.length;
      codeBlocks.push(
        '<div class="code-block-wrapper my-3 last:mb-0 relative rounded-lg border border-line bg-base overflow-hidden">' +
          '<div class="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-line text-[11px] text-sub font-mono">' +
            '<span>' + language + '</span>' +
            '<button type="button" class="copy-code-btn hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>' +
              '<span>Copy</span>' +
            '</button>' +
          '</div>' +
          '<pre class="p-3 text-xs font-mono overflow-x-auto text-primary leading-relaxed"><code>' + trimmedCode + '</code></pre>' +
        '</div>'
      );
      return '\n@@CODEBLOCK' + idx + '@@\n';
    });

    const lines = raw.split(/\r?\n/);
    const out = [];
    let currentList = null;
    let paragraphLines = [];

    function flushParagraph() {
      if (paragraphLines.length > 0) {
        out.push('<p class="mb-2.5 last:mb-0 leading-relaxed">' + paragraphLines.map(formatInline).join('<br>') + '</p>');
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

      const codeBlockMatch = trimmed.match(/^@@CODEBLOCK(\d+)@@$/);
      if (codeBlockMatch) {
        flushParagraph();
        flushList();
        out.push(codeBlocks[Number(codeBlockMatch[1])] || '');
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
        const sizeClass = level === 1 ? 'text-base sm:text-lg' : level === 2 ? 'text-sm sm:text-base' : 'text-sm';
        out.push('<' + tag + ' class="font-medium text-primary mt-3 mb-1.5 first:mt-0 ' + sizeClass + '">' + formatInline(headingMatch[2]) + '</' + tag + '>');
        continue;
      }

      const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
      if (ulMatch) {
        flushParagraph();
        if (currentList !== 'ul') {
          flushList();
          currentList = 'ul';
          out.push('<ul class="list-disc pl-5 mb-2.5 last:mb-0 space-y-1">');
        }
        out.push('<li>' + formatInline(ulMatch[1]) + '</li>');
        continue;
      }

      const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
      if (olMatch) {
        flushParagraph();
        if (currentList !== 'ol') {
          flushList();
          currentList = 'ol';
          out.push('<ol class="list-decimal pl-5 mb-2.5 last:mb-0 space-y-1">');
        }
        out.push('<li>' + formatInline(olMatch[2]) + '</li>');
        continue;
      }

      const bqMatch = line.match(/^\s*&gt;\s*(.*)$/);
      if (bqMatch) {
        flushParagraph();
        flushList();
        out.push('<blockquote class="border-l-2 border-line pl-3 my-2 text-sub italic">' + formatInline(bqMatch[1]) + '</blockquote>');
        continue;
      }

      if (/^\s*---+\s*$/.test(trimmed)) {
        flushParagraph();
        flushList();
        out.push('<hr class="border-0 border-t border-line my-3" />');
        continue;
      }

      flushList();
      paragraphLines.push(line);
    }

    flushParagraph();
    flushList();
    return out.join('');
  }

  function attachCursor(html) {
    const cursor = '<span class="inline-block w-[2px] h-[1.05em] bg-[var(--color-primary)] ml-[2px] align-[-0.12em] animate-pulse"></span>';
    const targets = ['</p>', '</li>', '</blockquote>', '</h2>', '</h3>', '</h4>'];
    let bestIdx = -1;

    for (let i = 0; i < targets.length; i++) {
      const idx = html.lastIndexOf(targets[i]);
      if (idx > bestIdx) {
        bestIdx = idx;
      }
    }

    if (bestIdx !== -1) {
      return html.slice(0, bestIdx) + cursor + html.slice(bestIdx);
    }
    return html + cursor;
  }

  function bindCodeBlockCopyButtons(container) {
    if (!container) return;
    container.querySelectorAll('.copy-code-btn').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', async () => {
        const codeEl = btn.closest('.code-block-wrapper')?.querySelector('code');
        if (!codeEl) return;
        const success = await copyToClipboard(codeEl.textContent || '');
        if (success) {
          const original = btn.innerHTML;
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
            <span class="text-emerald-500 font-medium">Copied!</span>
          `;
          setTimeout(() => {
            btn.innerHTML = original;
          }, 2000);
        }
      });
    });
  }

  function createCopyButton(textToCopy) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-msg-btn text-xs text-muted hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer self-start py-0.5 px-2 rounded hover:bg-base border border-transparent hover:border-line';
    btn.title = 'Copy response';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      <span>Copy</span>
    `;
    btn.addEventListener('click', async () => {
      const ok = await copyToClipboard(textToCopy);
      if (ok) {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="text-emerald-500 font-medium">Copied!</span>
        `;
        setTimeout(() => {
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copy</span>
          `;
        }, 2000);
      }
    });
    return btn;
  }

  function cancelSmoothScroll() {
    if (smoothScrollTimer) {
      clearTimeout(smoothScrollTimer);
      smoothScrollTimer = null;
    }
  }

  function isUserAtBottom() {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return true;
    return (feed.scrollHeight - feed.scrollTop - feed.clientHeight) <= 60;
  }

  function updateScrollButton() {
    const btn = document.getElementById('chat-scroll-btn');
    if (!btn) return;
    const show = !autoScrollEnabled && !isUserAtBottom();
    btn.classList.toggle('hidden', !show);
    btn.classList.toggle('flex', show);
  }

  function scrollToBottom(force = false) {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return;
    if (force) {
      cancelSmoothScroll();
      autoScrollEnabled = true;
    }
    if (autoScrollEnabled) {
      isProgrammaticScroll = true;
      feed.scrollTop = feed.scrollHeight;
      if (!smoothScrollTimer) {
        requestAnimationFrame(() => {
          if (!smoothScrollTimer) {
            isProgrammaticScroll = false;
          }
        });
      }
    }
    updateScrollButton();
  }

  function renderMessageUI(role, text, shouldScroll = true) {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return null;

    const wrap = document.createElement('div');
    if (role === 'user') {
      wrap.className = 'flex justify-end message-fade-in';
      wrap.innerHTML = `
        <div class="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-xs bg-surface border border-line text-primary text-sm sm:text-base leading-relaxed break-words shadow-xs">
          ${escapeHtml(text).replace(/\r?\n/g, '<br>')}
        </div>
      `;
      feed.appendChild(wrap);
    } else {
      wrap.className = 'flex items-start gap-3 message-fade-in';
      wrap.innerHTML = `
        <div class="shrink-0 w-8 h-8 rounded-lg bg-surface border border-line p-1 aspect-square flex items-center justify-center">
          <img src="/assets/icons/tongan-pixelart.png" alt="Tongan AI" class="w-full h-full object-contain [image-rendering:pixelated]" style="image-rendering: pixelated;" />
        </div>
        <div class="chat-bubble-container flex-1 min-w-0 max-w-[92%] sm:max-w-[88%] flex flex-col gap-1.5">
          <div class="chat-bubble-content px-4 py-3 rounded-lg bg-surface border border-line text-primary text-sm sm:text-base leading-relaxed break-words shadow-xs">
            ${renderMarkdown(text)}
          </div>
          <div class="msg-action-bar px-0.5"></div>
        </div>
      `;
      const actionBar = wrap.querySelector('.msg-action-bar');
      if (actionBar && text && text !== WELCOME_MESSAGE) {
        actionBar.appendChild(createCopyButton(text));
      }
      feed.appendChild(wrap);
      bindCodeBlockCopyButtons(wrap);
    }

    if (shouldScroll) {
      scrollToBottom(true);
    }
    return wrap.querySelector('.chat-bubble-content');
  }

  function rebuildFeed() {
    const feed = document.getElementById('chat-page-feed');
    if (!feed) return;
    feed.innerHTML = '';

    renderMessageUI('assistant', WELCOME_MESSAGE, false);

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (!m || typeof m !== 'object') continue;
      const text = m.content || (m.parts && m.parts[0] ? m.parts[0].text : '');
      if (text) renderMessageUI(m.role, text, false);
    }

    renderChips();
    scrollToBottom(true);
  }

  function renderChips() {
    const chipsBox = document.getElementById('chat-page-chips');
    if (!chipsBox) return;

    if (messages.length > 0) {
      chipsBox.classList.add('hidden');
      chipsBox.innerHTML = '';
      return;
    }

    chipsBox.classList.remove('hidden');
    chipsBox.innerHTML = `
      <p class="text-[11px] text-muted mb-1.5 font-medium select-none">Suggested questions</p>
      <div class="flex flex-wrap gap-2">
        ${SUGGESTED_QUESTIONS.map(q => `
          <button type="button" class="chat-chip cursor-pointer text-xs sm:text-sm px-3 py-1.5 rounded-md border border-line bg-surface hover:border-muted text-sub hover:text-primary transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
            ${q}
          </button>
        `).join('')}
      </div>
    `;

    chipsBox.querySelectorAll('.chat-chip').forEach(btn => {
      btn.addEventListener('click', function () {
        if (isGenerating) return;
        handleSend(this.textContent.trim());
      });
    });
  }

  function updateSendButtonState() {
    const sendBtn = document.getElementById('chat-page-send');
    const input = document.getElementById('chat-page-input');
    if (!sendBtn) return;

    if (isGenerating) {
      sendBtn.disabled = false;
      return;
    }

    if (input) {
      sendBtn.disabled = !input.value.trim();
    }
  }

  function setGeneratingState(generating) {
    isGenerating = generating;
    const sendBtn = document.getElementById('chat-page-send');
    const sendIcon = document.getElementById('chat-send-icon');
    const stopIcon = document.getElementById('chat-stop-icon');
    const chips = document.querySelectorAll('.chat-chip');

    chips.forEach(btn => {
      btn.disabled = generating;
    });

    if (!sendBtn) return;

    if (generating) {
      sendBtn.disabled = false;
      sendBtn.setAttribute('aria-label', 'Stop generating');
      sendBtn.setAttribute('title', 'Stop generating');
      sendBtn.classList.remove('bg-primary', 'text-[var(--color-base)]');
      sendBtn.classList.add('bg-surface', 'border', 'border-line', 'text-primary', 'hover:border-muted');
      if (sendIcon) sendIcon.classList.add('hidden');
      if (stopIcon) stopIcon.classList.remove('hidden');
    } else {
      sendBtn.setAttribute('aria-label', 'Send message');
      sendBtn.removeAttribute('title');
      sendBtn.classList.remove('bg-surface', 'border', 'border-line', 'text-primary', 'hover:border-muted');
      sendBtn.classList.add('bg-primary', 'text-[var(--color-base)]');
      if (sendIcon) sendIcon.classList.remove('hidden');
      if (stopIcon) stopIcon.classList.add('hidden');
      updateSendButtonState();
    }
  }

  function stopGeneration(discard = false) {
    if (!activeStream) {
      if (isGenerating) setGeneratingState(false);
      return;
    }

    const stream = activeStream;
    activeStream = null;

    if (discard) {
      stream.discardedByReset = true;
    } else {
      stream.abortedByUser = true;
    }

    if (stream.timer) {
      clearTimeout(stream.timer);
      stream.timer = null;
    }
    if (stream.renderRafId) {
      cancelAnimationFrame(stream.renderRafId);
      stream.renderRafId = null;
    }

    stream.controller.abort();

    if (!discard) {
      stream.finalizeOnStop();
    }

    setGeneratingState(false);
  }

  function autoResizeInput() {
    const input = document.getElementById('chat-page-input');
    if (!input) return;
    input.style.height = 'auto';
    const newH = Math.min(Math.max(input.scrollHeight, 42), 144);
    input.style.height = newH + 'px';
  }

  async function handleSend(text) {
    if (!text) return;
    if (isGenerating) {
      stopGeneration(false);
      return;
    }

    const input = document.getElementById('chat-page-input');
    if (input) {
      input.value = '';
      autoResizeInput();
      updateSendButtonState();
    }

    autoScrollEnabled = true;

    messages.push({ role: 'user', content: text });
    saveHistory();
    renderMessageUI('user', text);
    renderChips();

    setGeneratingState(true);

    const feed = document.getElementById('chat-page-feed');
    const wrap = document.createElement('div');
    wrap.className = 'flex items-start gap-3 message-fade-in';
    wrap.innerHTML = `
      <div class="shrink-0 w-8 h-8 rounded-lg bg-surface border border-line p-1 aspect-square flex items-center justify-center">
        <img src="/assets/icons/tongan-pixelart.png" alt="Tongan AI" class="w-full h-full object-contain [image-rendering:pixelated]" style="image-rendering: pixelated;" />
      </div>
      <div class="chat-bubble-container flex-1 min-w-0 max-w-[92%] sm:max-w-[88%] flex flex-col gap-1.5">
        <div class="chat-bubble-content px-4 py-3 rounded-lg bg-surface border border-line text-primary text-sm sm:text-base leading-relaxed break-words shadow-xs">
          <span class="inline-block w-[2px] h-[1.05em] bg-[var(--color-primary)] ml-[2px] align-[-0.12em] animate-pulse"></span>
        </div>
        <div class="msg-action-bar px-0.5"></div>
      </div>
    `;
    feed.appendChild(wrap);
    const bubble = wrap.querySelector('.chat-bubble-content');
    const actionBar = wrap.querySelector('.msg-action-bar');
    scrollToBottom(true);

    let fullResponse = '';
    const stream = {
      controller: new AbortController(),
      abortedByUser: false,
      discardedByReset: false,
      finalized: false,
      timer: null,
      renderRafId: null,
      finalizeOnStop: null
    };
    activeStream = stream;

    stream.timer = setTimeout(() => stream.controller.abort(), 25000);

    function finalizeOnce(fallbackOnEmpty = false) {
      if (stream.finalized || stream.discardedByReset) return;
      stream.finalized = true;

      if (stream.renderRafId) {
        cancelAnimationFrame(stream.renderRafId);
        stream.renderRafId = null;
      }

      if (fullResponse) {
        bubble.innerHTML = renderMarkdown(fullResponse);
        bindCodeBlockCopyButtons(wrap);
        if (actionBar) {
          actionBar.innerHTML = '';
          actionBar.appendChild(createCopyButton(fullResponse));
        }
        messages.push({ role: 'assistant', content: fullResponse });
        saveHistory();
      } else if (fallbackOnEmpty) {
        const fallback = "I am not sure how to respond to that, but feel free to reach out to me directly on Telegram [@tonganwashere](https://t.me/tonganwashere)!";
        bubble.innerHTML = renderMarkdown(fallback);
        messages.push({ role: 'assistant', content: fallback });
        saveHistory();
      } else {
        wrap.remove();
      }
      scrollToBottom();
    }

    stream.finalizeOnStop = () => finalizeOnce(false);

    function scheduleRender() {
      if (stream.renderRafId || stream.finalized || stream.discardedByReset) return;
      stream.renderRafId = requestAnimationFrame(() => {
        stream.renderRafId = null;
        if (stream.finalized || stream.discardedByReset) return;
        bubble.innerHTML = attachCursor(renderMarkdown(fullResponse));
        bindCodeBlockCopyButtons(wrap);
        scrollToBottom();
      });
    }

    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: stream.controller.signal,
        body: JSON.stringify({ messages: messages.slice(-6) })
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
            scheduleRender();
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
        if (stream.abortedByUser || stream.discardedByReset) break;
        clearTimeout(stream.timer);
        stream.timer = setTimeout(() => stream.controller.abort(), 20000);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          handleChatLine(lines[i].trim());
        }
      }

      clearTimeout(stream.timer);
      stream.timer = null;

      if (stream.abortedByUser || stream.discardedByReset) return;

      buffer += decoder.decode();
      if (buffer && buffer.trim()) {
        handleChatLine(buffer.trim());
      }

      finalizeOnce(true);
      if (activeStream === stream) {
        activeStream = null;
        setGeneratingState(false);
      }
    } catch (err) {
      clearTimeout(stream.timer);
      stream.timer = null;

      if (stream.discardedByReset || stream.abortedByUser) {
        return;
      }

      if (activeStream === stream) {
        activeStream = null;
        setGeneratingState(false);
      }

      if (err && err.name === 'AbortError' && fullResponse) {
        finalizeOnce(false);
        return;
      }

      if (stream.renderRafId) {
        cancelAnimationFrame(stream.renderRafId);
        stream.renderRafId = null;
      }
      stream.finalized = true;

      let displayError = "I am having a little trouble connecting right now. Please try again in a moment!";
      if (err && err.name === 'AbortError') {
        displayError = "The request timed out. Please try sending your message again in a moment!";
      } else if (err && err.message === 'OFFLINE') {
        displayError = "It looks like you're offline. Please check your internet connection and try again!";
      } else if (err && err.status === 429) {
        displayError = err.message || "I have reached my daily message limit for today! Feel free to reach out directly on Telegram [@tonganwashere](https://t.me/tonganwashere).";
      } else if (err && err.status === 503) {
        displayError = "Google AI service is currently experiencing high traffic. Please try again in a moment!";
      } else if (err && err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Request failed')) {
        displayError = err.message;
      }
      bubble.innerHTML = renderMarkdown(displayError);
      scrollToBottom();
    }
  }

  function init() {
    rebuildFeed();

    const feed = document.getElementById('chat-page-feed');
    const scrollBtn = document.getElementById('chat-scroll-btn');

    if (feed) {
      feed.addEventListener('wheel', function (e) {
        if (e.deltaY < 0) {
          cancelSmoothScroll();
          isProgrammaticScroll = false;
          autoScrollEnabled = false;
        } else if (isUserAtBottom()) {
          autoScrollEnabled = true;
        }
        updateScrollButton();
      }, { passive: true });

      let touchStartY = 0;
      feed.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches[0]) {
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      feed.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) {
          const touchY = e.touches[0].clientY;
          if (touchY > touchStartY + 8) {
            cancelSmoothScroll();
            isProgrammaticScroll = false;
            autoScrollEnabled = false;
          } else if (isUserAtBottom()) {
            autoScrollEnabled = true;
          }
        }
        updateScrollButton();
      }, { passive: true });

      feed.addEventListener('scroll', function () {
        if (isProgrammaticScroll) return;
        if (isUserAtBottom()) {
          autoScrollEnabled = true;
        } else {
          autoScrollEnabled = false;
        }
        updateScrollButton();
      }, { passive: true });
    }

    if (scrollBtn) {
      scrollBtn.addEventListener('click', function () {
        autoScrollEnabled = true;
        updateScrollButton();
        if (feed) {
          cancelSmoothScroll();
          isProgrammaticScroll = true;
          feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
          smoothScrollTimer = setTimeout(() => {
            smoothScrollTimer = null;
            isProgrammaticScroll = false;
            if (autoScrollEnabled) {
              feed.scrollTop = feed.scrollHeight;
            }
            updateScrollButton();
          }, 450);
        }
      });
    }

    const form = document.getElementById('chat-page-form');
    const input = document.getElementById('chat-page-input');
    const clearBtn = document.getElementById('chat-page-clear');

    if (input) {
      updateSendButtonState();

      input.addEventListener('input', function () {
        autoResizeInput();
        updateSendButtonState();
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isGenerating) {
          e.preventDefault();
          stopGeneration(false);
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          const text = input.value.trim();
          if (text && !isGenerating) {
            handleSend(text);
          }
        }
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (isGenerating) {
          stopGeneration(false);
          return;
        }
        if (input) {
          const text = input.value.trim();
          if (text) handleSend(text);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (isGenerating || activeStream) {
          stopGeneration(true);
        }
        messages = [];
        saveHistory();
        autoScrollEnabled = true;
        rebuildFeed();
        if (input) {
          input.value = '';
          autoResizeInput();
          updateSendButtonState();
          input.focus();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
