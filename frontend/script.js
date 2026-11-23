/* =========================================================
   HealthBridge AI — script.js
   Vanilla JS: theme persistence, mobile sidebar, counters,
   toast notifications, and the Chat Assistant engine.
   ========================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------
     THEME (Light / Dark) — persisted in localStorage
  --------------------------------------------------- */
  const THEME_KEY = 'healthbridge-theme';
  const SETTINGS_THEME_KEY = 'healthbridge_settings_theme';

  function applyTheme(theme) {
    const effectiveTheme = (theme === 'system')
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.body.setAttribute('data-theme', effectiveTheme);

    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    document.querySelectorAll('#themeToggle, .theme-toggle').forEach(toggle => {
      toggle.setAttribute('aria-checked', effectiveTheme === 'dark' ? 'true' : 'false');
      if (effectiveTheme === 'dark') {
        toggle.classList.add('is-dark', 'active');
      } else {
        toggle.classList.remove('is-dark', 'active');
      }
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(SETTINGS_THEME_KEY);
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(preferred);
  }

  function toggleTheme(e) {
    if (e && e.preventDefault) e.preventDefault();
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    localStorage.setItem(SETTINGS_THEME_KEY, next);
    applyTheme(next);
    if (typeof showToast === 'function') {
      showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'fa-circle-check');
    }
  }

  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;

  // Global event delegation for theme toggles
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('#themeToggle, .theme-toggle');
    if (toggle) {
      toggleTheme(e);
    }
  });


  /* ---------------------------------------------------
     MOBILE SIDEBAR
  --------------------------------------------------- */
  const SIDEBAR_KEY = 'healthbridge-sidebar';

  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggle = document.getElementById('menuToggle');
    const appContainer = document.querySelector('.app');
    if (!sidebar || !toggle || !appContainer) return;

    // Inject dynamic topbar title
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('topbarDynamicTitle')) {
      const titleEl = document.createElement('div');
      titleEl.id = 'topbarDynamicTitle';
      titleEl.className = 'topbar-dynamic-title';
      titleEl.innerHTML = '<i class="fa-solid fa-heart-pulse"></i> HealthBridge AI';
      toggle.insertAdjacentElement('afterend', titleEl);
    }

    if (localStorage.getItem(SIDEBAR_KEY) === 'collapsed' && window.innerWidth > 900) {
      appContainer.classList.add('sidebar-collapsed');
    }

    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
    toggle.addEventListener('click', () => {
      // If mobile view, slide overlay drawer; else collapse to icons for desktop
      if (window.innerWidth <= 900) {
        sidebar.classList.contains('open') ? close() : open();
      } else {
        const isCollapsed = appContainer.classList.toggle('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_KEY, isCollapsed ? 'collapsed' : 'open');
      }
    });
    overlay.addEventListener('click', close);
    sidebar.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => { if (window.innerWidth <= 900) close(); });
    });
  }

  /* ---------------------------------------------------
     TOAST NOTIFICATIONS
  --------------------------------------------------- */
  let toastTimer = null;
  let toastHideTimer = null;
  function showToast(message, icon) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = `<i class="fa-solid ${icon || 'fa-circle-info'}" aria-hidden="true"></i><span>${message}</span>`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.classList.remove('hide');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hide');
      toastHideTimer = setTimeout(() => toast.classList.remove('show', 'hide'), 260);
    }, 2600);
  }
  // Exposed so other modules can trigger the same toast
  window.showToast = showToast;

  /* ---------------------------------------------------
     COUNTER ANIMATION for stat cards
  --------------------------------------------------- */
  function animateCounters() {
    const counters = document.querySelectorAll('.count-up');
    counters.forEach(el => {
      // Guard so a counter never re-plays if this ever gets called twice
      if (el.dataset.counted === 'true') return;
      el.dataset.counted = 'true';

      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 900;
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const suffix = el.dataset.suffix || '';
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------------------------------------------------
     STAGGERED CARD REVEAL
  --------------------------------------------------- */
  function staggerReveal() {
    document.querySelectorAll('.reveal').forEach((card, i) => {
      card.style.animationDelay = `${i * 60}ms`;
    });
  }

  /* ---------------------------------------------------
     RIPPLE CLICK EFFECT
     Applies to icon buttons, the "Notify Me" button, and
     Quick Access cards — all already position:relative with
     overflow:hidden in style.css, so no markup changes needed.
  --------------------------------------------------- */
  function initRipple() {
    const selector = '.icon-btn, .fp-notify-btn, .quick-item';
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', (e) => {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;
        const dot = document.createElement('span');
        dot.className = 'ripple-dot';
        if (el.classList.contains('quick-item') || el.classList.contains('icon-btn')) {
          dot.classList.add('ripple-dark');
        }
        dot.style.width = dot.style.height = `${size}px`;
        dot.style.left = `${e.clientX - rect.left - size / 2}px`;
        dot.style.top = `${e.clientY - rect.top - size / 2}px`;
        el.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove());
      });
    });
  }

  /* ---------------------------------------------------
     NOTIFICATION BELL — gentle ring every 20 seconds
  --------------------------------------------------- */
  function initBellRing() {
    const bell = document.getElementById('notifBell');
    if (!bell) return;
    setInterval(() => {
      bell.classList.add('ring');
      setTimeout(() => bell.classList.remove('ring'), 700);
    }, 20000);
  }

  /* =====================================================
     CHAT ASSISTANT ENGINE
  ===================================================== */

  const KNOWLEDGE_BASE = [
    {
      keys: ['dengue'],
      reply: `<strong>Dengue Fever — Key Facts</strong>
        <ul>
          <li><i class="fa-solid fa-check"></i>Spread by Aedes mosquito bites, usually in the daytime</li>
          <li><i class="fa-solid fa-check"></i>Symptoms: high fever, severe headache, joint &amp; muscle pain, rash</li>
          <li><i class="fa-solid fa-check"></i>Drink plenty of fluids and rest — avoid aspirin/ibuprofen</li>
          <li><i class="fa-solid fa-check"></i>Seek care immediately for bleeding, severe belly pain, or persistent vomiting</li>
        </ul>`
    },
    {
      keys: ['fever', 'bukhar'],
      reply: `<strong>About your fever</strong>
        <p>Fever with body ache can come from a viral infection, dengue, or a common cold. It usually settles with rest and fluids.</p>
        <ul>
          <li><i class="fa-solid fa-check"></i>Drink plenty of water and take light, nutritious meals</li>
          <li><i class="fa-solid fa-check"></i>Paracetamol can help if needed</li>
          <li><i class="fa-solid fa-check"></i>Rest and monitor your temperature every few hours</li>
        </ul>
        <p style="margin-top:8px;">⚠️ If fever lasts more than 2–3 days or worsens, please visit your nearest health centre.</p>`
    },
    {
      keys: ['malaria'],
      reply: `<strong>Preventing Malaria</strong>
        <ul>
          <li><i class="fa-solid fa-check"></i>Sleep under an insecticide-treated mosquito net</li>
          <li><i class="fa-solid fa-check"></i>Remove stagnant water around your home — mosquito breeding sites</li>
          <li><i class="fa-solid fa-check"></i>Use repellents and wear full-sleeve clothing at dusk</li>
          <li><i class="fa-solid fa-check"></i>Get tested quickly if fever with chills appears</li>
        </ul>`
    },
    {
      keys: ['ors', 'diarrhea', 'diarrhoea'],
      reply: `<strong>ORS (Oral Rehydration Solution)</strong>
        <p>ORS replaces the fluids and salts lost during diarrhoea or vomiting, and is safe for both children and adults.</p>
        <ul>
          <li><i class="fa-solid fa-check"></i>Mix one ORS packet with 1 litre of clean, boiled water</li>
          <li><i class="fa-solid fa-check"></i>Sip small amounts frequently rather than drinking fast</li>
          <li><i class="fa-solid fa-check"></i>Continue normal feeding alongside ORS</li>
          <li><i class="fa-solid fa-check"></i>Seek medical help if symptoms persist beyond 2 days</li>
        </ul>`
    },
    {
      keys: ['vaccine', 'vaccination', 'tika'],
      reply: `<strong>Vaccination Guidance</strong>
        <p>Staying on schedule with vaccines is one of the most effective ways to prevent serious disease.</p>
        <ul>
          <li><i class="fa-solid fa-check"></i>Check the Vaccination tab for upcoming doses in your area</li>
          <li><i class="fa-solid fa-check"></i>Carry your vaccination card to every visit</li>
          <li><i class="fa-solid fa-check"></i>Mild soreness or low fever after a shot is normal</li>
        </ul>`
    },
    {
      keys: ['child', 'baby', 'infant', 'bachcho'],
      reply: `<strong>Fever in Children</strong>
        <p>A child's fever becomes concerning if it crosses 102°F (39°C), lasts more than 2 days, or comes with rash, breathlessness, or refusal to feed.</p>
        <ul>
          <li><i class="fa-solid fa-check"></i>Keep the child hydrated with water, ORS, or breast milk</li>
          <li><i class="fa-solid fa-check"></i>Use a light sponge bath with lukewarm water to ease discomfort</li>
          <li><i class="fa-solid fa-check"></i>Consult a doctor promptly for infants under 3 months with any fever</li>
        </ul>`
    },
    {
      keys: ['cholera'],
      reply: `<strong>Cholera Awareness</strong>
        <ul>
          <li><i class="fa-solid fa-check"></i>Drink only boiled or safely treated water</li>
          <li><i class="fa-solid fa-check"></i>Wash hands with soap before eating and after using the toilet</li>
          <li><i class="fa-solid fa-check"></i>Start ORS immediately if watery diarrhoea begins</li>
          <li><i class="fa-solid fa-check"></i>Visit the nearest health centre for severe dehydration</li>
        </ul>`
    },
    {
      keys: ['nearby', 'center', 'centre', 'hospital'],
      reply: `<strong>Nearby Health Centres</strong>
        <p>I found 8 verified health centres within 10 km of Bhubaneswar, Odisha. Open the <strong>Nearby Centers</strong> tab from Quick Access to view them on the map with directions and contact numbers.</p>`
    },
    {
      keys: ['emergency', 'help', 'ambulance'],
      reply: `<strong>Emergency Assistance</strong>
        <p>If this is a medical emergency, please call your local emergency number immediately or use the <strong>Emergency Help</strong> quick action to connect with nearby services right away.</p>`
    },
    {
      keys: ['thank', 'thanks', 'dhanyavad'],
      reply: `You're welcome! 🙏 Stay safe and don't hesitate to ask if you have more health questions.`
    }
  ];

  const DEFAULT_REPLY = `I don't have a specific answer for that yet, but here's what I can help with: symptoms &amp; fevers, disease prevention (dengue, malaria, cholera), ORS &amp; hydration, vaccination schedules, and nearby health centres. Could you tell me a bit more?`;

  function findReply(userText) {
    const lower = userText.toLowerCase();
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.keys.some(k => lower.includes(k))) return entry.reply;
    }
    return DEFAULT_REPLY;
  }

  function timeNow() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollChatToBottom(container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------------------------------------------
     LIGHTWEIGHT MARKDOWN RENDERER
     Supports: **bold**, bullet lists, numbered lists,
     fenced code blocks, inline `code`, and pipe tables.
     Input may already contain the hand-authored HTML used
     in KNOWLEDGE_BASE (headings/uls), so this pass is
     applied to plain-markdown bot text only.
  --------------------------------------------------- */
  function renderMarkdown(raw) {
    // Pull out fenced code blocks first so their contents aren't touched
    const codeBlocks = [];
    let text = raw.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
      codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
      return `\u0000CODEBLOCK${codeBlocks.length - 1}\u0000`;
    });

    const lines = text.split('\n');
    let html = '';
    let inUl = false, inOl = false, inTable = false, tableRows = [];

    function closeLists() {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    }
    function flushTable() {
      if (!inTable) return;
      const [headerLine, , ...bodyLines] = tableRows;
      const headers = headerLine.split('|').map(s => s.trim()).filter(Boolean);
      html += '<table><thead><tr>' + headers.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>';
      bodyLines.forEach(r => {
        const cells = r.split('|').map(s => s.trim()).filter(Boolean);
        html += '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
      });
      html += '</tbody></table>';
      inTable = false; tableRows = [];
    }
    function inline(str) {
      return str
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
    }

    lines.forEach(line => {
      const trimmed = line.trim();

      if (/^\|.*\|$/.test(trimmed)) {
        if (!inTable) { inTable = true; tableRows = []; }
        tableRows.push(trimmed.replace(/^\||\|$/g, ''));
        return;
      } else if (inTable) {
        flushTable();
      }

      if (/^[-•*]\s+/.test(trimmed)) {
        if (!inUl) { closeLists(); html += '<ul>'; inUl = true; }
        html += `<li><i class="fa-solid fa-check"></i>${inline(trimmed.replace(/^[-•*]\s+/, ''))}</li>`;
        return;
      }
      if (/^\d+[\.\)]\s+/.test(trimmed)) {
        if (!inOl) { closeLists(); html += '<ol>'; inOl = true; }
        html += `<li>${inline(trimmed.replace(/^\d+[\.\)]\s+/, ''))}</li>`;
        return;
      }
      closeLists();

      if (trimmed === '') return;
      if (/^\u0000CODEBLOCK\d+\u0000$/.test(trimmed)) {
        html += trimmed;
        return;
      }
      html += `<p>${inline(trimmed)}</p>`;
    });
    closeLists();
    flushTable();

    codeBlocks.forEach((block, i) => {
      html = html.replace(`\u0000CODEBLOCK${i}\u0000`, block);
    });

    return html;
  }

  function appendUserMessage(container, text) {
    const row = document.createElement('div');
    row.className = 'msg-row user';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', `You said: ${text}`);
    row.innerHTML = `
      <div class="msg-avatar" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
      <div class="msg-bubble">
        <span>${escapeHtml(text)}</span>
        <span class="msg-time">${timeNow()} <i class="fa-solid fa-check-double" style="font-size:9px;" aria-hidden="true"></i></span>
      </div>`;
    container.appendChild(row);
    scrollChatToBottom(container);
  }

  function buildActionsRow() {
    const wrap = document.createElement('div');
    wrap.className = 'msg-actions';
    wrap.innerHTML = `
      <button class="msg-action-btn action-copy" title="Copy" aria-label="Copy response"><i class="fa-regular fa-copy"></i></button>
      <button class="msg-action-btn action-regen" title="Regenerate" aria-label="Regenerate response"><i class="fa-solid fa-rotate-right"></i></button>
      <button class="msg-action-btn action-up" title="Good response" aria-label="Thumbs up"><i class="fa-regular fa-thumbs-up"></i></button>
      <button class="msg-action-btn action-down" title="Bad response" aria-label="Thumbs down"><i class="fa-regular fa-thumbs-down"></i></button>
    `;
    return wrap;
  }

  function wireActions(actionsEl, bubbleEl, container, sourceText) {
    const copyBtn = actionsEl.querySelector('.action-copy');
    const regenBtn = actionsEl.querySelector('.action-regen');
    const upBtn = actionsEl.querySelector('.action-up');
    const downBtn = actionsEl.querySelector('.action-down');

    copyBtn.addEventListener('click', () => {
      const text = bubbleEl.innerText.replace(/\n{2,}/g, '\n').trim();
      navigator.clipboard?.writeText(text).catch(() => {});
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      showToast('Response copied', 'fa-copy');
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 1600);
    });

    upBtn.addEventListener('click', () => {
      upBtn.classList.toggle('active-up');
      downBtn.classList.remove('active-down');
      if (upBtn.classList.contains('active-up')) showToast('Thanks for your feedback', 'fa-thumbs-up');
    });

    downBtn.addEventListener('click', () => {
      downBtn.classList.toggle('active-down');
      upBtn.classList.remove('active-up');
      if (downBtn.classList.contains('active-down')) showToast('Thanks — we\'ll use this to improve', 'fa-thumbs-down');
    });

    regenBtn.addEventListener('click', () => {
      const row = actionsEl.closest('.msg-row');
      if (!row) return;
      row.remove();
      streamBotReply(container, sourceText);
    });
  }

  function formatQuickChipsInReply(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('➔') || trimmed.startsWith('->') || trimmed.startsWith('▶')) {
        const chipLabel = trimmed.replace(/^(➔|->|▶)\s*/, '').trim();
        return `<button type="button" class="quick-chip-btn" data-query="${chipLabel}">${chipLabel}</button>`;
      }
      return line;
    });
    return formattedLines.join('\n');
  }

  /* ---------------------------------------------------
     STREAMED BOT REPLY
     ••• typing indicator → word-by-word reveal of the
     markdown-rendered reply → action row fades in once done.
  --------------------------------------------------- */
  async function streamBotReply(container, userText) {
    const typingRow = document.createElement('div');
    typingRow.className = 'msg-row bot';
    typingRow.innerHTML = `
      <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="msg-bubble">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>`;
    container.appendChild(typingRow);
    scrollChatToBottom(container);

    let rawReply = '';
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "session_web_ui",
          channel: "web",
          user_id: "web_user",
          message: userText,
          language: "auto"
        })
      });
      if (res.ok) {
        const data = await res.json();
        rawReply = data.message || '';
      }
    } catch (err) {
      console.warn("Backend API unavailable, using fallback knowledge base:", err);
    }

    if (!rawReply) {
      rawReply = findReply(userText);
    }

    rawReply = formatQuickChipsInReply(rawReply);
    typingRow.remove();

    const looksLikeHtml = /<\w+/.test(rawReply);
    const finalHtml = looksLikeHtml ? rawReply : renderMarkdown(rawReply);


      const row = document.createElement('div');
      row.className = 'msg-row bot';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', 'HealthBridge AI response');
      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      const contentSpan = document.createElement('span');
      contentSpan.className = 'stream-content';
      bubble.appendChild(contentSpan);
      row.innerHTML = `<div class="msg-avatar" aria-hidden="true"><i class="fa-solid fa-robot"></i></div>`;
      row.appendChild(bubble);
      container.appendChild(row);

      // Split the rendered HTML into text-node words vs. tags, so tags
      // stream in whole and only word tokens fade in individually.
      const temp = document.createElement('div');
      temp.innerHTML = finalHtml;

      const tokens = [];
      (function walk(node, target) {
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const words = child.textContent.split(/(\s+)/).filter(w => w.length);
            words.forEach(w => tokens.push({ type: 'text', value: w, parent: target }));
          } else {
            const clone = document.createElement(child.tagName);
            Array.from(child.attributes || []).forEach(a => clone.setAttribute(a.name, a.value));
            tokens.push({ type: 'open', el: clone, parent: target });
            walk(child, clone);
          }
        });
      })(temp, contentSpan);

      let i = 0;
      function revealNext() {
        if (i >= tokens.length) {
          const time = document.createElement('span');
          time.className = 'msg-time';
          time.textContent = timeNow();
          bubble.appendChild(time);

          const disclaimer = document.createElement('span');
          disclaimer.className = 'msg-disclaimer';
          disclaimer.textContent = 'Information is generated for awareness purposes only and should not replace professional medical advice.';
          bubble.appendChild(disclaimer);

          const actions = buildActionsRow();
          bubble.appendChild(actions);
          requestAnimationFrame(() => actions.classList.add('settled'));
          wireActions(actions, bubble, container, userText);

          bubble.querySelectorAll('.quick-chip-btn').forEach(chip => {
            chip.addEventListener('click', () => {
              const input = document.getElementById('chatInput');
              if (input) {
                input.value = chip.dataset.query || chip.textContent;
                document.getElementById('sendBtn')?.click();
              }
            });
          });

          scrollChatToBottom(container);
          return;

        }
        const tok = tokens[i++];
        if (tok.type === 'open') {
          tok.parent.appendChild(tok.el);
        } else {
          if (/^\s+$/.test(tok.value)) {
            tok.parent.appendChild(document.createTextNode(tok.value));
          } else {
            const span = document.createElement('span');
            span.className = 'stream-word';
            span.textContent = tok.value;
            tok.parent.appendChild(span);
          }
        }
        scrollChatToBottom(container);
        setTimeout(revealNext, /^\s+$/.test(tok.value || '') ? 0 : 22 + Math.random() * 28);
      }
      revealNext();
  }


  function hideWelcome(container) {
    const welcome = container.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
  }

  function showWelcome(container) {
    const welcome = document.createElement('div');
    welcome.className = 'chat-welcome';
    welcome.innerHTML = `
      <div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>
      <h4>How can I help today?</h4>
      <p>Try asking:</p>
      <div class="chat-welcome-list">
        <button class="chat-welcome-item" data-question="What are the symptoms of Dengue?">What are the symptoms of Dengue?</button>
        <button class="chat-welcome-item" data-question="How can I prevent Malaria?">How can I prevent Malaria?</button>
        <button class="chat-welcome-item" data-question="Explain ORS.">Explain ORS.</button>
        <button class="chat-welcome-item" data-question="Where is my nearest vaccination centre?">Where is my nearest vaccination centre?</button>
      </div>`;
    container.appendChild(welcome);
    welcome.querySelectorAll('.chat-welcome-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('chatInput');
        if (input) { input.value = btn.dataset.question; }
        document.getElementById('sendBtn')?.click();
      });
    });
  }

  function initChat() {
    const container = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearChatBtn');
    const micBtn = document.querySelector('.mic-btn');
    if (!container || !input || !sendBtn) return;

    let isGenerating = false;
    const sendIconMarkup = sendBtn.innerHTML;

    function setGenerating(state) {
      isGenerating = state;
      sendBtn.disabled = state;
      input.disabled = state;
      sendBtn.innerHTML = state ? '<i class="fa-solid fa-circle-notch"></i>' : sendIconMarkup;
    }

    function handleSend() {
      if (isGenerating) return;
      const text = input.value.trim();
      if (!text) return;
      hideWelcome(container);
      appendUserMessage(container, text);
      input.value = '';
      setGenerating(true);

      streamBotReply(container, text);

      // Re-enable input once the newest bot bubble has finished streaming
      const observer = new MutationObserver(() => {
        const rows = container.querySelectorAll('.msg-row.bot .msg-actions.settled');
        if (rows.length) {
          observer.disconnect();
          setGenerating(false);
        }
      });
      observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSend();
    });

    document.querySelectorAll('.suggested-item').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.question;
        handleSend();
      });
    });

    document.querySelectorAll('.qa-item[data-question]').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.question;
        handleSend();
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        container.innerHTML = '';
        showWelcome(container);
        showToast('Chat cleared', 'fa-trash');
      });
    }

    if (micBtn) {
      let micTimer = null;
      function stopListening() {
        clearTimeout(micTimer);
        micBtn.classList.remove('listening');
        micBtn.querySelector('.listening-chip')?.remove();
        micBtn.setAttribute('aria-label', 'Voice input');
      }
      micBtn.addEventListener('click', () => {
        if (micBtn.classList.contains('listening')) { stopListening(); return; }
        micBtn.classList.add('listening');
        micBtn.setAttribute('aria-label', 'Listening… click to stop');
        const chip = document.createElement('div');
        chip.className = 'listening-chip';
        chip.setAttribute('aria-hidden', 'true');
        chip.innerHTML = '<span class="dot"></span> Listening…';
        micBtn.appendChild(chip);
        micTimer = setTimeout(stopListening, 2400);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && micBtn.classList.contains('listening')) stopListening();
      });
    }
  }

  function initChatWelcome() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    // Replace the static "Namaste" starter bubble with the interactive
    // empty-state welcome (only runs when chat hasn't been used yet).
    container.innerHTML = '';
    showWelcome(container);
  }

  /* ---------------------------------------------------
     SKELETON LOADING → REAL CONTENT
     Every "section" on a page ships two markup blocks:
     a `.skeleton-block` shimmer placeholder and a matching
     `.real-content` block (initially `hidden`). After a
     short simulated fetch delay we swap them in, then run
     the reveal/counter animations on the now-visible content.
  --------------------------------------------------- */
  function staggerReveal() {
    document.querySelectorAll('.reveal').forEach((el, idx) => {
      setTimeout(() => el.classList.add('in'), idx * 50);
    });
  }

  function revealContent() {
    try {
      document.querySelectorAll('.skeleton-block').forEach(el => { el.hidden = true; el.style.display = 'none'; });
      document.querySelectorAll('.real-content').forEach(el => { el.hidden = false; el.style.display = 'block'; });
      if (document.body) document.body.classList.remove('is-loading');
      staggerReveal();
      if (typeof animateCounters === 'function') animateCounters();
    } catch (err) {
      console.warn("revealContent error handled:", err);
      if (document.body) document.body.classList.remove('is-loading');
    }
  }



  /* ---------------------------------------------------
     EMPTY STATES
     Reusable show/hide wiring for the "no data" fallback
     panels (illustration + heading + text + action button).
  --------------------------------------------------- */
  function initAlertsEmptyState() {
    const list = document.getElementById('alertList');
    const emptyState = document.getElementById('alertsEmptyState');
    const refreshBtn = document.getElementById('alertsRefreshBtn');
    if (!refreshBtn) return;
    refreshBtn.addEventListener('click', () => {
      if (emptyState) emptyState.hidden = true;
      if (list) list.hidden = false;
      showToast('Alerts refreshed', 'fa-rotate-right');
    });
  }

  function initSuggestedEmptyState() {
    const list = document.getElementById('suggestedList');
    const emptyState = document.getElementById('suggestedEmptyState');
    const refreshBtn = document.getElementById('suggestedRefreshBtn');
    if (!list || !emptyState) return;

    function checkEmpty() {
      const remaining = list.querySelectorAll('.suggested-item:not(.asked)');
      if (remaining.length === 0) {
        list.hidden = true;
        emptyState.hidden = false;
      }
    }

    list.querySelectorAll('.suggested-item').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.add('asked');
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.pointerEvents = 'none';
        checkEmpty();
      });
    });

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        list.querySelectorAll('.suggested-item').forEach(btn => {
          btn.classList.remove('asked');
          btn.disabled = false;
          btn.style.opacity = '';
          btn.style.pointerEvents = '';
        });
        emptyState.hidden = true;
        list.hidden = false;
        showToast('Suggested questions refreshed', 'fa-rotate-right');
      });
    }
  }

  /* ---------------------------------------------------
     SYMPTOM CHECKER
     Self-contained controller for the 4-step flow.
     No-ops immediately if the page's form isn't present.
  --------------------------------------------------- */
  function initSymptomChecker() {
    const form = document.getElementById('scForm');
    if (!form) return;

    const state = {
      description: '', symptoms: [], bodyAreas: [], duration: '', severity: '',
      warningSigns: [], conditions: '', medications: '', exposure: '', additionalInfo: ''
    };

    let currentStep = 1;

    const stepper = document.getElementById('scStepper');
    const stepBtns = stepper ? stepper.querySelectorAll('.sc-step-btn') : [];
    const stepListItems = stepper ? stepper.querySelectorAll('.sc-step') : [];
    const panels = form.querySelectorAll('.sc-step-panel');

    const descriptionEl = document.getElementById('scDescription');
    const charCountEl = document.getElementById('scCharCount');
    const symptomChipsWrap = document.getElementById('scSymptomChips');
    const areaChipsWrap = document.getElementById('scBodyAreaChips');
    const step1Error = document.getElementById('scStep1Error');
    const step2Error = document.getElementById('scStep2Error');
    const emergencyBanner = document.getElementById('scEmergencyBanner');
    const reviewList = document.getElementById('scReviewList');
    const causeGrid = document.getElementById('scCauseGrid');
    const nextStepEl = document.getElementById('scNextStep');
    const overallGuidanceEl = document.getElementById('scOverallGuidance');
    const restartBtn = document.getElementById('scRestartBtn');
    const howItWorksBtn = document.getElementById('scHowItWorksBtn');

    function clearStep1Error() { if (step1Error) step1Error.hidden = true; }
    function clearStep2Error() { if (step2Error) step2Error.hidden = true; }

    function wireChipGroup(wrap, list) {
      if (!wrap) return;
      wrap.querySelectorAll('.sc-chip').forEach(chip => {
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', () => {
          const val = chip.dataset.value;
          const idx = list.indexOf(val);
          if (idx > -1) {
            list.splice(idx, 1);
            chip.classList.remove('is-selected');
            chip.setAttribute('aria-pressed', 'false');
          } else {
            list.push(val);
            chip.classList.add('is-selected');
            chip.setAttribute('aria-pressed', 'true');
          }
          if (wrap === symptomChipsWrap) clearStep1Error();
        });
      });
    }
    wireChipGroup(symptomChipsWrap, state.symptoms);
    wireChipGroup(areaChipsWrap, state.bodyAreas);

    if (descriptionEl) {
      descriptionEl.addEventListener('input', () => {
        state.description = descriptionEl.value;
        if (charCountEl) charCountEl.textContent = String(descriptionEl.value.length);
        clearStep1Error();
      });
    }

    form.querySelectorAll('input[name="scDuration"]').forEach(input => {
      input.addEventListener('change', () => { state.duration = input.value; clearStep2Error(); });
    });
    form.querySelectorAll('input[name="scSeverity"]').forEach(input => {
      input.addEventListener('change', () => { state.severity = input.value; clearStep2Error(); });
    });

    const contextMap = { scConditions: 'conditions', scMedications: 'medications', scExposure: 'exposure', scAdditionalInfo: 'additionalInfo' };
    Object.keys(contextMap).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => { state[contextMap[id]] = el.value; });
    });

    const warningInputs = form.querySelectorAll('.sc-warning-chip input[type="checkbox"]');
    warningInputs.forEach(input => {
      input.addEventListener('change', () => {
        state.warningSigns = Array.from(warningInputs).filter(i => i.checked).map(i => i.value);
        if (emergencyBanner) emergencyBanner.hidden = state.warningSigns.length === 0;
      });
    });

    function renderStepper() {
      stepListItems.forEach(li => {
        const n = parseInt(li.dataset.step, 10);
        li.classList.toggle('is-current', n === currentStep);
        li.classList.toggle('is-complete', n < currentStep);
        const btn = li.querySelector('.sc-step-btn');
        if (btn) {
          btn.disabled = n > currentStep;
          if (n === currentStep) btn.setAttribute('aria-current', 'step');
          else btn.removeAttribute('aria-current');
        }
      });
    }

    function showStep(n) {
      currentStep = n;
      panels.forEach(panel => { panel.hidden = parseInt(panel.dataset.stepPanel, 10) !== n; });
      renderStepper();
      if (n === 3) renderReview();
      if (n === 4) renderResults();
      const main = form.closest('.sc-main');
      if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    stepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const goto = parseInt(btn.dataset.goto, 10);
        if (!btn.disabled) showStep(goto);
      });
    });

    form.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'next') {
        const from = parseInt(btn.dataset.from, 10);
        if (from === 1) {
          if (!state.description.trim() && state.symptoms.length === 0) {
            if (step1Error) step1Error.hidden = false;
            return;
          }
          showStep(2);
        } else if (from === 2) {
          if (state.warningSigns.length > 0) {
            if (emergencyBanner) emergencyBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('Please seek emergency care before continuing', 'fa-triangle-exclamation');
            return;
          }
          if (!state.duration || !state.severity) {
            if (step2Error) step2Error.hidden = false;
            return;
          }
          showStep(3);
        }
      } else if (action === 'back') {
        showStep(parseInt(btn.dataset.from, 10) - 1);
      } else if (action === 'analyze') {
        showStep(4);
      }
    });

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        state.description = ''; state.symptoms = []; state.bodyAreas = [];
        state.duration = ''; state.severity = ''; state.warningSigns = [];
        state.conditions = ''; state.medications = ''; state.exposure = ''; state.additionalInfo = '';

        if (descriptionEl) descriptionEl.value = '';
        if (charCountEl) charCountEl.textContent = '0';
        form.querySelectorAll('.sc-chip.is-selected').forEach(c => { c.classList.remove('is-selected'); c.setAttribute('aria-pressed', 'false'); });
        form.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
        form.querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = false; });
        form.querySelectorAll('.sc-context-item input').forEach(i => { i.value = ''; });
        if (emergencyBanner) emergencyBanner.hidden = true;
        if (step1Error) step1Error.hidden = true;
        if (step2Error) step2Error.hidden = true;

        showToast('Starting a new check', 'fa-rotate-left');
        showStep(1);
      });
    }

    if (howItWorksBtn) {
      howItWorksBtn.addEventListener('click', () => {
        showToast('Describe your symptoms, answer a few questions, then review before we suggest next steps', 'fa-circle-question');
      });
    }

    function renderReview() {
      if (!reviewList) return;
      const blocks = [];

      blocks.push(`
        <div class="sc-review-block">
          <div class="sc-review-block-head">
            <h4>Symptoms</h4>
            <button type="button" class="sc-edit-link" data-goto-edit="1"><i class="fa-solid fa-pen"></i> Edit</button>
          </div>
          ${state.description.trim() ? `<p>${escapeHtml(state.description.trim())}</p>` : ''}
          ${state.symptoms.length ? `<div class="sc-pill-list">${state.symptoms.map(s => `<span class="sc-pill">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
          ${(!state.description.trim() && !state.symptoms.length) ? '<p class="sc-review-empty">Not provided</p>' : ''}
        </div>
      `);

      blocks.push(`
        <div class="sc-review-block">
          <div class="sc-review-block-head">
            <h4>Affected Areas</h4>
            <button type="button" class="sc-edit-link" data-goto-edit="1"><i class="fa-solid fa-pen"></i> Edit</button>
          </div>
          ${state.bodyAreas.length ? `<div class="sc-pill-list">${state.bodyAreas.map(a => `<span class="sc-pill">${escapeHtml(a)}</span>`).join('')}</div>` : '<p class="sc-review-empty">Not specified</p>'}
        </div>
      `);

      blocks.push(`
        <div class="sc-review-block">
          <div class="sc-review-block-head">
            <h4>Duration &amp; Severity</h4>
            <button type="button" class="sc-edit-link" data-goto-edit="2"><i class="fa-solid fa-pen"></i> Edit</button>
          </div>
          <p>${escapeHtml(state.duration)} &middot; ${escapeHtml(state.severity)}</p>
        </div>
      `);

      const extras = [];
      if (state.conditions.trim()) extras.push(`<p><strong>Conditions:</strong> ${escapeHtml(state.conditions.trim())}</p>`);
      if (state.medications.trim()) extras.push(`<p><strong>Medications:</strong> ${escapeHtml(state.medications.trim())}</p>`);
      if (state.exposure.trim()) extras.push(`<p><strong>Exposure/Travel:</strong> ${escapeHtml(state.exposure.trim())}</p>`);
      if (state.additionalInfo.trim()) extras.push(`<p><strong>Other:</strong> ${escapeHtml(state.additionalInfo.trim())}</p>`);
      if (extras.length) {
        blocks.push(`
          <div class="sc-review-block">
            <div class="sc-review-block-head">
              <h4>Additional Information</h4>
              <button type="button" class="sc-edit-link" data-goto-edit="2"><i class="fa-solid fa-pen"></i> Edit</button>
            </div>
            ${extras.join('')}
          </div>
        `);
      }

      reviewList.innerHTML = blocks.join('');
      reviewList.querySelectorAll('[data-goto-edit]').forEach(btn => {
        btn.addEventListener('click', () => showStep(parseInt(btn.dataset.gotoEdit, 10)));
      });
    }

    const CAUSE_LIBRARY = [
      { match: ['Fever', 'Body Ache', 'Fatigue'], name: 'Common viral infection', why: 'Fever, fatigue and body aches are commonly associated with viral infections.' },
      { match: ['Cough', 'Sore Throat'], name: 'Upper respiratory infection', why: 'Cough and sore throat together may be associated with a cold or throat infection.' },
      { match: ['Nausea', 'Vomiting', 'Diarrhea'], name: 'Digestive upset', why: 'Nausea, vomiting and diarrhea can be related to a stomach infection or food-related upset.' },
      { match: ['Headache'], name: 'Tension headache or migraine', why: 'Headaches without other severe symptoms may be associated with tension or migraine.' },
      { match: ['Fever'], name: 'General infection', why: 'Fever alone could be related to a range of common infections.' }
    ];

    function computeCauses() {
      const found = [];
      for (const entry of CAUSE_LIBRARY) {
        let matchCount = 0;
        entry.match.forEach(sym => {
          if (state.symptoms.includes(sym)) matchCount++;
        });
        if (matchCount > 0) {
          // simple normalized matching: matchCount / max of entry length or user symptoms
          let score = Math.round((matchCount / Math.max(entry.match.length, state.symptoms.length)) * 100);
          if (score > 98) score = 98; // keep it below 100 to avoid looking diagnostic
          found.push({ ...entry, score });
        }
      }
      found.sort((a, b) => b.score - a.score);
      const topFound = found.slice(0, 3);
      if (topFound.length === 0) {
        topFound.push({ name: 'Non-specific symptoms', why: 'Your description doesn\u2019t closely match a common pattern in our reference list \u2014 a healthcare professional can assess this more accurately.', score: 0 });
      }
      return topFound;
    }

    function computeTier() {
      if (state.warningSigns.length > 0) return 'emergency';
      if (state.severity === 'Severe') return 'urgent';
      if (state.duration === 'More than a week' || state.duration === 'More than a month') return 'consult';
      if (state.severity === 'Moderate') return 'consult';
      return 'selfcare';
    }

    const TIER_INFO = {
      selfcare:  { icon: 'fa-house-medical', title: 'Self-care & monitor', text: 'Rest, stay hydrated, and monitor your symptoms. Consider seeing a doctor if things don\u2019t improve in a few days.' },
      consult:   { icon: 'fa-user-doctor', title: 'Consult a healthcare professional', text: 'Consider speaking with a doctor to review your symptoms, especially given how long they\u2019ve lasted or their severity.' },
      urgent:    { icon: 'fa-truck-medical', title: 'Seek urgent medical care', text: 'Your symptoms are severe enough that prompt medical attention is recommended \u2014 consider an urgent care visit today.' },
      emergency: { icon: 'fa-triangle-exclamation', title: 'Emergency care', text: 'Based on the warning signs you selected, please seek emergency medical attention immediately.' }
    };

    function renderResults() {
      if (overallGuidanceEl) {
        overallGuidanceEl.textContent = state.warningSigns.length > 0
          ? 'Because you selected one or more warning signs, please prioritize emergency care over this assessment.'
          : 'Based on the information provided, your symptoms may have several possible causes. This is general guidance, not a diagnosis.';
      }
      if (causeGrid) {
        causeGrid.innerHTML = computeCauses().map(c => {
          const scoreHtml = c.score > 0 ? `
            <div style="margin-bottom: 12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12.5px; font-weight:600; color:var(--text-primary);">
                <span>Symptom Match</span>
                <span>${c.score}%</span>
              </div>
              <div style="height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:${c.score}%; background:linear-gradient(90deg, var(--brand-teal-light), var(--brand-teal)); transition: width 1s ease-out; border-radius:3px;"></div>
              </div>
            </div>
          ` : '';
          const matchString = c.match ? c.match.join(' &bull; ') : '';
          const symptomsTextHtml = matchString ? `<p style="font-size:11.5px; margin-bottom:8px; font-weight:600; color:var(--text-primary);">${escapeHtml(matchString)}</p>` : '';
          
          return `
          <div class="sc-cause-card">
            <div class="sc-cause-card-head" style="margin-bottom:12px;">
              <h4 style="font-size:15px; color:var(--brand-teal-dark);">${escapeHtml(c.name)}</h4>
            </div>
            ${scoreHtml}
            ${symptomsTextHtml}
            <p>${escapeHtml(c.why)}</p>
          </div>
          `;
        }).join('');
      }
      if (nextStepEl) {
        const tier = computeTier();
        const info = TIER_INFO[tier];
        nextStepEl.className = `sc-next-step tier-${tier}`;
        nextStepEl.innerHTML = `
          <div class="sc-next-step-icon"><i class="fa-solid ${info.icon}"></i></div>
          <div><h4>${info.title}</h4><p>${info.text}</p></div>
        `;
      }
    }

    renderStepper();
  }

  /* ---------------------------------------------------
     EMERGENCY HELP
     No-ops immediately if the page's contact list isn't present.
     Contact numbers are kept in one small config array so they
     stay easy to correct/update — nothing here is invented.
  --------------------------------------------------- */
  function initEmergencyHelp() {
    const contactListEl = document.getElementById('ehContactList');
    if (!contactListEl) return;

    const EMERGENCY_CONTACTS = [
      { name: 'National Emergency Number', desc: 'All emergencies', number: '112', icon: 'fa-phone', color: 'red' },
      { name: 'Ambulance Service', desc: 'Emergency medical assistance', number: '108', icon: 'fa-truck-medical', color: 'blue' },
      { name: 'Police', desc: 'Law enforcement assistance', number: '100', icon: 'fa-shield-halved', color: 'green' },
      { name: 'Fire Service', desc: 'Fire and rescue emergencies', number: '101', icon: 'fa-fire', color: 'amber' },
      { name: 'Women Helpline', desc: '24/7 support and assistance', number: '1091', icon: 'fa-person-dress', color: 'purple' }
    ];

    contactListEl.innerHTML = EMERGENCY_CONTACTS.map(c => `
      <div class="eh-contact-item">
        <div class="eh-contact-icon sc-ic-${c.color}"><i class="fa-solid ${c.icon}"></i></div>
        <div class="eh-contact-body">
          <h4>${escapeHtml(c.name)}</h4>
          <p>${escapeHtml(c.desc)}</p>
        </div>
        <a href="tel:${c.number}" class="eh-contact-call c-${c.color}"><i class="fa-solid fa-phone"></i> Call ${c.number}</a>
      </div>
    `).join('');

    const EMERGENCY_SYMPTOMS = [
      { name: 'Chest Pain', desc: 'Tightness, pressure or discomfort', icon: 'fa-heart-pulse', color: 'red',
        guidance: 'Chest pain or pressure can be serious. Sit down, try to stay calm, and avoid physical exertion. Do not drive yourself — call for emergency help right away.' },
      { name: 'Breathing Difficulty', desc: 'Shortness of breath or struggle', icon: 'fa-lungs', color: 'blue',
        guidance: 'Sit upright if possible and loosen any tight clothing. Try to stay calm. If breathing doesn\u2019t improve quickly, this needs emergency care.' },
      { name: 'Severe Bleeding', desc: 'Heavy bleeding that won\u2019t stop', icon: 'fa-droplet', color: 'teal',
        guidance: 'Apply firm, direct pressure to the wound with a clean cloth if you can do so safely. Keep the person still and call for emergency help immediately.' },
      { name: 'Loss of Consciousness', desc: 'Fainting or unresponsiveness', icon: 'fa-user-injured', color: 'purple',
        guidance: 'Check if the person is breathing and call for emergency help immediately. Do not leave them alone, and don\u2019t give them food or water.' },
      { name: 'Severe Headache', desc: 'Sudden, intense head pain', icon: 'fa-head-side-virus', color: 'amber',
        guidance: 'A sudden, very severe headache needs urgent medical evaluation. Keep the person still in a quiet, dim space while help is on the way.' },
      { name: 'Accidents & Injuries', desc: 'Falls, burns or serious injuries', icon: 'fa-truck-medical', color: 'indigo',
        guidance: 'Keep the person still and avoid moving them if a neck or back injury is possible. Call for emergency help immediately.' }
    ];

    const symptomGrid = document.getElementById('ehSymptomGrid');
    const guidancePanel = document.getElementById('ehSymptomGuidance');

    if (symptomGrid) {
      symptomGrid.innerHTML = EMERGENCY_SYMPTOMS.map((s, i) => `
        <button type="button" class="eh-symptom-card" data-index="${i}" aria-expanded="false">
          <div class="eh-symptom-icon sc-ic-${s.color}"><i class="fa-solid ${s.icon}"></i></div>
          <div>
            <h4>${escapeHtml(s.name)}</h4>
            <p>${escapeHtml(s.desc)}</p>
          </div>
        </button>
      `).join('');

      symptomGrid.querySelectorAll('.eh-symptom-card').forEach(card => {
        card.addEventListener('click', () => {
          const alreadyOpen = card.getAttribute('aria-expanded') === 'true';
          symptomGrid.querySelectorAll('.eh-symptom-card').forEach(c => c.setAttribute('aria-expanded', 'false'));

          if (alreadyOpen) {
            if (guidancePanel) guidancePanel.hidden = true;
            return;
          }
          card.setAttribute('aria-expanded', 'true');
          const s = EMERGENCY_SYMPTOMS[parseInt(card.dataset.index, 10)];
          if (guidancePanel) {
            guidancePanel.innerHTML = `
              <h4><i class="fa-solid ${s.icon}"></i> ${escapeHtml(s.name)}</h4>
              <p>${escapeHtml(s.guidance)}</p>
              <a href="tel:112" class="eh-call-btn eh-call-btn-inline"><i class="fa-solid fa-phone"></i><span>Call Emergency<strong>112</strong></span></a>
            `;
            guidancePanel.hidden = false;
          }
        });
      });
    }

    /* ---- Share location / Enable location (geolocation only requested on click) ---- */
    function requestLocation(onDone) {
      if (!('geolocation' in navigator)) {
        showToast('Location services aren\u2019t available on this device', 'fa-triangle-exclamation');
        return;
      }
      showToast('Requesting location access…', 'fa-location-crosshairs');
      navigator.geolocation.getCurrentPosition(
        () => { showToast('Location captured — ready to share with emergency contacts', 'fa-location-dot'); onDone && onDone(); },
        () => { showToast('Location access was denied or unavailable', 'fa-triangle-exclamation'); },
        { timeout: 8000 }
      );
    }

    const shareLocationBtn = document.getElementById('ehShareLocationBtn');
    if (shareLocationBtn) shareLocationBtn.addEventListener('click', () => requestLocation());

    const enableLocationBtn = document.getElementById('ehEnableLocationBtn');
    if (enableLocationBtn) {
      enableLocationBtn.addEventListener('click', () => {
        requestLocation(() => showToast('Nearby hospital data will appear here once connected', 'fa-hospital'));
      });
    }

    /* ---- View / add emergency contacts (no personal contacts exist yet) ---- */
    const viewContactsBtn = document.getElementById('ehViewContactsBtn');
    const contactsEmpty = document.getElementById('ehContactsEmpty');
    if (viewContactsBtn && contactsEmpty) {
      viewContactsBtn.addEventListener('click', () => {
        const open = contactsEmpty.hidden;
        contactsEmpty.hidden = !open;
        viewContactsBtn.setAttribute('aria-expanded', String(open));
        if (open) contactsEmpty.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
    const addContactBtn = document.getElementById('ehAddContactBtn');
    if (addContactBtn) {
      addContactBtn.addEventListener('click', () => showToast('Saved emergency contacts are coming in a future update', 'fa-hourglass-half'));
    }

    /* ---- "Emergency Information" header button ---- */
    const infoBtn = document.getElementById('ehInfoBtn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        showToast('In a life-threatening emergency, always call 112 first — this page is guidance, not a replacement for emergency services', 'fa-circle-info');
      });
    }
  }

  /* =====================================================
     PROFILE
     Only runs on profile.html (guarded by element existence).
     No personal or medical data is stored or invented here —
     `profileState` mirrors exactly what's shown in the UI
     (currently all empty), and completeness is calculated
     from it rather than hardcoded, so the percentage stays
     accurate once real data is ever wired in.
  ===================================================== */
  function initProfile() {
    const ring = document.getElementById('pfRingProgress');
    const pctLabel = document.getElementById('pfCompletenessPct');
    const note = document.getElementById('pfCompletenessNote');
    if (!ring || !pctLabel) return; // not on this page

    let savedProfile = null;
    try { savedProfile = JSON.parse(localStorage.getItem('hb_profileState')); } catch(e) {}
    const profileState = savedProfile || {
      fullName: null,
      email: null,
      phone: null,
      location: null,
      bloodGroup: null,
      dob: null,
      height: null,
      weight: null,
      conditions: null,
      allergies: null,
      emergencyContacts: [] // empty array = none added
    };

    function computeCompleteness(state) {
      const fields = ['fullName', 'email', 'phone', 'location', 'bloodGroup', 'dob', 'height', 'weight', 'conditions', 'allergies'];
      let filled = 0;
      fields.forEach(key => {
        if (state[key] !== null && String(state[key]).trim() !== '') filled++;
      });
      if (Array.isArray(state.emergencyContacts) && state.emergencyContacts.length > 0) filled++;
      const total = fields.length + 1; // +1 for emergency contacts
      return Math.round((filled / total) * 100);
    }

    function renderCompleteness() {
      const pct = computeCompleteness(profileState);
      const circumference = 2 * Math.PI * 36; // matches r=36 on the SVG circle
      const offset = circumference - (pct / 100) * circumference;
      ring.style.strokeDashoffset = offset;
      pctLabel.textContent = `${pct}%`;

      if (note) {
        if (pct === 0) {
          note.textContent = 'Your profile is empty. Add your information to get more personalized guidance.';
        } else if (pct < 100) {
          note.textContent = `Your profile is ${pct}% complete. Keep adding details for better recommendations.`;
        } else {
          note.textContent = 'Great! Your profile is fully complete.';
        }
      }
    }

    /* ---------- Display rendering (profileState -> pf-field-value spans) ---------- */
    const FALLBACK_TEXT = {
      conditions: 'None provided',
      allergies: 'None provided'
    };

    function formatDobForDisplay(isoDate) {
      // isoDate is "YYYY-MM-DD" from <input type="date">
      const parts = isoDate.split('-');
      if (parts.length !== 3) return isoDate;
      const [y, m, d] = parts;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = Number(m) - 1;
      if (monthIdx < 0 || monthIdx > 11) return isoDate;
      return `${Number(d)} ${months[monthIdx]} ${y}`;
    }

    function renderProfileFields() {
      Object.keys(profileState).forEach(key => {
        if (key === 'emergencyContacts') return;
        const value = profileState[key];
        const hasValue = value !== null && String(value).trim() !== '';
        const displayText = hasValue
          ? (key === 'dob' ? formatDobForDisplay(value) : value)
          : (FALLBACK_TEXT[key] || 'Not provided');

        document.querySelectorAll(`[data-pf-field="${key}"]`).forEach(el => {
          el.textContent = displayText;
          el.classList.toggle('pf-empty-value', !hasValue);
        });
      });

      const pfAvatar = document.querySelector('.pf-avatar');
      if (pfAvatar) {
        if (profileState.fullName && profileState.fullName.trim() !== '') {
          const initials = profileState.fullName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          pfAvatar.innerHTML = `<span style="font-weight:700;font-size:22px;color:var(--brand-teal,#0d9488);">${initials}</span>`;
        } else {
          pfAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
        }
      }
    }

    async function syncAuthProfile() {
      const savedToken = localStorage.getItem('hb_jwt_token');
      if (!savedToken) return;

      try {
        const res = await fetch("http://localhost:8000/api/auth/me", {
          headers: { "Authorization": "Bearer " + savedToken }
        });
        if (res.ok) {
          const user = await res.json();
          let updated = false;
          if (user.full_name && profileState.fullName !== user.full_name) {
            profileState.fullName = user.full_name;
            updated = true;
          }
          if (user.email && profileState.email !== user.email) {
            profileState.email = user.email;
            updated = true;
          }
          if (user.phone && profileState.phone !== user.phone) {
            profileState.phone = user.phone;
            updated = true;
          }
          if (updated || !savedProfile) {
            try { localStorage.setItem('hb_profileState', JSON.stringify(profileState)); } catch(e) {}
            renderProfileFields();
            renderCompleteness();
          }
        }
      } catch (err) {
        console.warn("Could not sync profile with backend:", err);
      }
    }

    window.refreshProfileUI = syncAuthProfile;
    renderProfileFields();
    renderCompleteness();
    syncAuthProfile();

    /* ---------- Edit mode ---------- */
    const editBtn = document.getElementById('pfEditBtn');
    if (!editBtn) return; // edit UI not present

    const personalPanel = document.getElementById('pfPersonalPanel');
    const healthPanel = document.getElementById('pfHealthPanel');
    const editPanels = [personalPanel, healthPanel].filter(Boolean);
    const inputEls = document.querySelectorAll('[data-pf-input]');
    const actionRows = document.querySelectorAll('.pf-edit-actions');

    const REQUIRED_FIELDS = ['fullName', 'email'];
    let isEditing = false;
    let stateSnapshot = null;

    function getInputEl(key) {
      return document.querySelector(`[data-pf-input="${key}"]`);
    }

    function clearFieldError(key) {
      const errorEl = document.getElementById(`pfError${key.charAt(0).toUpperCase()}${key.slice(1)}`);
      const inputEl = getInputEl(key);
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
      if (inputEl) inputEl.classList.remove('pf-input-invalid');
    }

    function showFieldError(key, message) {
      const errorEl = document.getElementById(`pfError${key.charAt(0).toUpperCase()}${key.slice(1)}`);
      const inputEl = getInputEl(key);
      if (errorEl) { errorEl.hidden = false; errorEl.textContent = message; }
      if (inputEl) inputEl.classList.add('pf-input-invalid');
    }

    function clearAllErrors() {
      REQUIRED_FIELDS.forEach(clearFieldError);
    }

    function populateInputsFromState() {
      inputEls.forEach(input => {
        const key = input.dataset.pfInput;
        input.value = profileState[key] || '';
      });
    }

    function enterEditMode() {
      isEditing = true;
      stateSnapshot = Object.assign({}, profileState); // shallow copy is sufficient (all values are primitives)
      populateInputsFromState();
      clearAllErrors();

      editPanels.forEach(panel => {
        panel.classList.add('pf-editing');
        panel.querySelectorAll('[data-pf-field]').forEach(el => { el.hidden = true; });
      });
      inputEls.forEach(input => { input.hidden = false; });
      actionRows.forEach(row => { row.hidden = false; });

      editBtn.hidden = true;

      const firstInput = document.getElementById('pfInputFullName');
      if (firstInput) firstInput.focus();
    }

    function exitEditMode() {
      isEditing = false;
      stateSnapshot = null;

      editPanels.forEach(panel => {
        panel.classList.remove('pf-editing');
        panel.querySelectorAll('[data-pf-field]').forEach(el => { el.hidden = false; });
      });
      inputEls.forEach(input => { input.hidden = true; });
      actionRows.forEach(row => { row.hidden = true; });
      clearAllErrors();

      editBtn.hidden = false;
    }

    function validateEmail(value) {
      // Basic, deliberately permissive email shape check — not full RFC validation.
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validate() {
      clearAllErrors();
      let isValid = true;

      const fullNameInput = getInputEl('fullName');
      const fullName = fullNameInput ? fullNameInput.value.trim() : '';
      if (!fullName) {
        showFieldError('fullName', 'Full name is required.');
        isValid = false;
      }

      const emailInput = getInputEl('email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) {
        showFieldError('email', 'Email is required.');
        isValid = false;
      } else if (!validateEmail(email)) {
        showFieldError('email', 'Enter a valid email address.');
        isValid = false;
      }

      return isValid;
    }

    function saveChanges() {
      if (!validate()) return;

      inputEls.forEach(input => {
        const key = input.dataset.pfInput;
        const value = input.value.trim();
        profileState[key] = value === '' ? null : value;
      });

      renderProfileFields();
      renderCompleteness();
      try { localStorage.setItem('hb_profileState', JSON.stringify(profileState)); } catch(e) {}

      const savedToken = localStorage.getItem('hb_jwt_token');
      if (savedToken) {
        fetch("http://localhost:8000/api/auth/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + savedToken
          },
          body: JSON.stringify({
            full_name: profileState.fullName,
            phone: profileState.phone
          })
        }).then(res => {
          if (res.ok && typeof window.checkAuthStatus === 'function') {
            window.checkAuthStatus();
          }
        }).catch(err => console.warn("Failed to push profile update to backend:", err));
      }

      exitEditMode();
      showToast('Profile updated successfully', 'fa-circle-check');
    }

    function cancelChanges() {
      if (stateSnapshot) {
        Object.assign(profileState, stateSnapshot);
      }
      exitEditMode();
    }

    editBtn.addEventListener('click', enterEditMode);
    document.querySelectorAll('[data-pf-save]').forEach(btn => btn.addEventListener('click', saveChanges));
    document.querySelectorAll('[data-pf-cancel]').forEach(btn => btn.addEventListener('click', cancelChanges));

    // Clear a field's error the moment the user edits it again.
    const emailInputEl = getInputEl('email');
    const fullNameInputEl = getInputEl('fullName');
    if (fullNameInputEl) fullNameInputEl.addEventListener('input', () => clearFieldError('fullName'));
    if (emailInputEl) emailInputEl.addEventListener('input', () => clearFieldError('email'));
  }

  /* ---------------------------------------------------
     DASHBOARD PROFILE CARD
  --------------------------------------------------- */
  function initDashboardProfileCard() {
    const dashPct = document.getElementById('dashProfilePct');
    if (!dashPct) return;
    let savedProfile = null;
    try { savedProfile = JSON.parse(localStorage.getItem('hb_profileState')); } catch(e) {}
    const state = savedProfile || {};
    const fields = ['fullName', 'email', 'phone', 'location', 'bloodGroup', 'dob', 'height', 'weight', 'conditions', 'allergies'];
    let filled = 0;
    fields.forEach(key => {
      if (state[key] !== undefined && state[key] !== null && String(state[key]).trim() !== '') filled++;
    });
    if (Array.isArray(state.emergencyContacts) && state.emergencyContacts.length > 0) filled++;
    const pct = Math.round((filled / (fields.length + 1)) * 100);
    dashPct.dataset.target = pct;
  }

  /* ---------------------------------------------------
     DYNAMIC HEALTH TIPS ROTATION (DASHBOARD)
  --------------------------------------------------- */
  function initDynamicHealthTips() {
    const tipCard = document.getElementById('dashboardTipCard');
    if (!tipCard) return;

    const tips = [
      { category: 'Hydration', title: 'Stay Hydrated', description: 'Drinking enough clean water throughout the day helps support energy, concentration and overall wellbeing.', icon: 'fa-droplet', color: 'var(--info)' },
      { category: 'Sleep', title: 'Prioritize Quality Sleep', description: 'Consistent, restful sleep supports memory, mood and your body’s natural repair processes.', icon: 'fa-bed', color: '#a855f7' },
      { category: 'Nutrition', title: 'Eat a Balanced Diet', description: 'Including a mix of fruits, vegetables, whole grains and protein helps your body get the nutrients it needs.', icon: 'fa-utensils', color: 'var(--success)' },
      { category: 'Physical Activity', title: 'Move Throughout the Day', description: 'Regular movement, even short walks, supports heart health, energy and long-term wellbeing.', icon: 'fa-person-running', color: 'var(--warning)' },
      { category: 'Hand Hygiene', title: 'Wash Your Hands Often', description: 'Regular handwashing is one of the simplest ways to reduce the spread of common infections.', icon: 'fa-hand-sparkles', color: 'var(--brand-teal)' },
      { category: 'Mental Wellbeing', title: 'Take Time to Recharge', description: 'Short breaks and mindful moments during the day can help reduce stress and improve focus.', icon: 'fa-brain', color: '#a855f7' },
      { category: 'Preventive Healthcare', title: 'Keep Up with Checkups', description: 'Routine checkups can help catch potential health concerns early, when they’re often easier to manage.', icon: 'fa-shield-heart', color: 'var(--brand-teal)' },
      { category: 'Healthy Screen Habits', title: 'Take Screen Breaks', description: 'Stepping away from screens periodically can ease eye strain and give your body a chance to reset.', icon: 'fa-mobile-screen', color: '#6366f1' },
      { category: 'Sun Protection', title: 'Protect Your Skin Outdoors', description: 'Simple habits like sunscreen and seeking shade can help protect your skin during sun exposure.', icon: 'fa-sun', color: '#f97316' },
      { category: 'Balanced Meals', title: 'Plan Balanced Meals', description: 'Thoughtfully planned meals can help maintain steady energy and support overall nutrition.', icon: 'fa-bowl-food', color: 'var(--success)' }
    ];

    const iconEl = document.getElementById('dashboardTipIcon');
    const titleEl = document.getElementById('dashboardTipTitle');
    const descEl = document.getElementById('dashboardTipDesc');
    const counterEl = document.getElementById('dashboardTipCounter');
    const dotsContainer = document.getElementById('dashTipIndicators');
    const prevBtn = document.getElementById('dashTipPrev');
    const nextBtn = document.getElementById('dashTipNext');

    let currentIndex = 0;
    let timer = null;

    function renderDots() {
      if(!dotsContainer) return;
      dotsContainer.innerHTML = '';
      tips.forEach((_, i) => {
        const dot = document.createElement('span');
        if(i === currentIndex) dot.className = 'active';
        dotsContainer.appendChild(dot);
      });
    }

    function showTip(index) {
      const tip = tips[index];
      
      // fade out
      if(titleEl) titleEl.style.opacity = '0';
      if(descEl) descEl.style.opacity = '0';
      if(iconEl) iconEl.style.opacity = '0';
      
      setTimeout(() => {
        if(counterEl) counterEl.textContent = `Tip ${index + 1} of ${tips.length}`;
        if(iconEl) {
          iconEl.innerHTML = `<i class="fa-solid ${tip.icon}"></i>`;
          iconEl.style.color = tip.color;
          // Soft bg based on color
          iconEl.style.background = `rgba(20, 184, 166, 0.15)`; // Default fallback
          if(tip.color === 'var(--info)') iconEl.style.background = `rgba(14, 165, 233, 0.15)`;
          else if(tip.color === '#a855f7') iconEl.style.background = `rgba(168, 85, 247, 0.15)`;
          else if(tip.color === 'var(--success)') iconEl.style.background = `rgba(34, 197, 94, 0.15)`;
          else if(tip.color === 'var(--warning)') iconEl.style.background = `rgba(245, 158, 11, 0.15)`;
          else if(tip.color === '#6366f1') iconEl.style.background = `rgba(99, 102, 241, 0.15)`;
          else if(tip.color === '#f97316') iconEl.style.background = `rgba(249, 115, 22, 0.15)`;
        }
        
        if(titleEl) titleEl.textContent = tip.title;
        if(descEl) descEl.textContent = tip.description;
        
        // fade in
        if(titleEl) title(titleEl).style.opacity = '1';
        if(descEl) descEl.style.opacity = '1';
        if(iconEl) iconEl.style.opacity = '1';
        
        renderDots();
      }, 300);
    }
    
    function title(el) { return el; } // Quick polyfill for snippet error

    function nextTip() {
      currentIndex = (currentIndex + 1) % tips.length;
      showTip(currentIndex);
      resetAutoPlay();
    }

    function prevTip() {
      currentIndex = (currentIndex - 1 + tips.length) % tips.length;
      showTip(currentIndex);
      resetAutoPlay();
    }

    function resetAutoPlay() {
      clearInterval(timer);
      timer = setInterval(nextTip, 10000);
    }

    if(prevBtn) prevBtn.addEventListener('click', prevTip);
    if(nextBtn) nextBtn.addEventListener('click', nextTip);

    // initial display
    showTip(currentIndex);
    resetAutoPlay();
  }

  /* ---------------------------------------------------
     AUTHENTICATION LOGIC
  --------------------------------------------------- */
  function initAuth() {
    initSupabaseAuthUI();
    const authAccountInfo = document.getElementById('authAccountInfo');
    if (authAccountInfo) {
      authAccountInfo.addEventListener('click', () => {
        window.location.href = 'settings.html';
      });
    }
  }

  function initActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const effectivePage = (currentPath === '' || currentPath === 'index.html') ? 'dashboard.html' : currentPath;
    document.querySelectorAll('.nav-group .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === effectivePage || href === currentPath)) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ---------------------------------------------------
     INIT
  --------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initActiveNavLink();
    initChat();
    initChatWelcome();
    initRipple();
    initBellRing();
    initAlertsEmptyState();
    initSuggestedEmptyState();
    initSymptomChecker();
    initEmergencyHelp();
    initProfile();
    initDashboardProfileCard();
    initDynamicHealthTips();
    initAuth();
    initLanguageSwitcher();

    const DICTIONARY = {
      English: {},
      Hindi: {
        "Dashboard": "डैशबोर्ड",
        "Chat Assistant": "चैट सहायक",
        "Symptom Checker": "लक्षण चेकर",
        "Disease Awareness": "रोग जागरूकता",
        "Vaccination Tracker": "टीकाकरण ट्रैकर",
        "Health Alerts": "स्वास्थ्य अलर्ट",
        "Daily Health Tips": "दैनिक स्वास्थ्य टिप्स",
        "Emergency Help": "आपातकालीन सहायता",
        "Profile": "प्रोफ़ाइल",
        "Settings": "सेटिंग्स",
        "HealthBridge AI": "हेल्थब्रिज एआई",
        "Your AI Health Companion": "आपका एआई स्वास्थ्य साथी",
        "Namaste!": "नमस्ते!",
        "How can I help you with your health today?": "आज मैं आपके स्वास्थ्य में कैसे मदद कर सकता हूँ?",
        "Recent Alerts": "हाल के अलर्ट",
        "Quick Access": "त्वरित पहुँच",
        "Ask Questions": "प्रश्न पूछें",
        "Vaccination Schedule": "टीकाकरण अनुसूची",
        "Active Alerts": "सक्रिय अलर्ट",
        "In your district": "आपके जिले में",
        "Health Tips": "स्वास्थ्य टिप्स",
        "New tips today": "आज के नए टिप्स",
        "Vaccines Due": "टीके देय",
        "This month": "इस महीने",
        "Health Profile": "स्वास्थ्य प्रोफ़ाइल",
        "Profile Complete": "प्रोफ़ाइल पूर्ण",
        "Upcoming Vaccines": "आगामी टीके",
        "View all": "सभी देखें",
        "Daily Health Tip": "दैनिक स्वास्थ्य टिप",
        "New": "नया",
        "Live Disease Surveillance": "लाइव रोग निगरानी",
        "Search diseases, symptoms, vaccines…": "बीमारियां, लक्षण, टीके खोजें…"
      },
      Odia: {
        "Dashboard": "ଡ୍ୟାସବୋର୍ଡ",
        "Chat Assistant": "ଚାଟ୍ ସହାୟକ",
        "Symptom Checker": "ଲକ୍ଷଣ ଯାଞ୍ଚକାରୀ",
        "Disease Awareness": "ରୋଗ ସଚେତନତା",
        "Vaccination Tracker": "ଟୀକାକରଣ ଟ୍ରାକର୍",
        "Health Alerts": "ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା",
        "Daily Health Tips": "ଦୈନନ୍ଦିନ ସ୍ୱାସ୍ଥ୍ୟ ଟିପ୍ସ",
        "Emergency Help": "ଜରୁରୀକାଳୀନ ସହାୟତା",
        "Profile": "ପ୍ରୋଫାଇଲ୍",
        "Settings": "ସେଟିଂସମୂହ",
        "HealthBridge AI": "ହେଲ୍ଥ୍ ବ୍ରିଜ୍ ଏଆଇ",
        "Your AI Health Companion": "ଆପଣଙ୍କର ଏଆଇ ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ",
        "Namaste!": "ନମସ୍କାର!",
        "How can I help you with your health today?": "ଆଜି ମୁଁ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟରେ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
        "Recent Alerts": "ସାମ୍ପ୍ରତିକ ସତର୍କତା",
        "Quick Access": "ତ୍ୱରିତ ପ୍ରବେଶ",
        "Ask Questions": "ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ",
        "Vaccination Schedule": "ଟୀକାକରଣ ସୂଚୀ",
        "Active Alerts": "ସକ୍ରିୟ ସତର୍କତା",
        "In your district": "ଆପଣଙ୍କ ଜିଲ୍ଲାରେ",
        "Health Tips": "ସ୍ୱାସ୍ଥ୍ୟ ଟିପ୍ସ",
        "New tips today": "ଆଜି ନୂଆ ଟିପ୍ସ",
        "Vaccines Due": "ଟୀକା ଦେୟ",
        "This month": "ଏହି ମାସରେ",
        "Health Profile": "ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରୋଫାଇଲ୍",
        "Profile Complete": "ପ୍ରୋଫାଇଲ୍ ସମ୍ପୂର୍ଣ୍ଣ",
        "Upcoming Vaccines": "ଆସନ୍ତା ଟୀକା",
        "View all": "ସବୁ ଦେଖନ୍ତୁ",
        "Daily Health Tip": "ଦୈନନ୍ଦିନ ସ୍ୱାସ୍ଥ୍ୟ ଟିପ୍",
        "New": "ନୂଆ",
        "Live Disease Surveillance": "ଜୀବନ୍ତ ରୋଗ ନିରୀକ୍ଷଣ",
        "Search diseases, symptoms, vaccines…": "ରୋଗ, ଲକ୍ଷଣ, ଟିକା ଖୋଜନ୍ତୁ…"
      },
      Bengali: {
        "Dashboard": "ড্যাশবোর্ড",
        "Chat Assistant": "চ্যাট সহকারী",
        "Symptom Checker": "লক্ষণ পরীক্ষক",
        "Disease Awareness": "রোগ সচেতনতা",
        "Vaccination Tracker": "টিকা ট্র্যাকার",
        "Health Alerts": "স্বাস্থ্য সতর্কতা",
        "Daily Health Tips": "দৈনিক স্বাস্থ্য টিপস",
        "Emergency Help": "জরুরী সহায়তা",
        "Profile": "প্রোফাইল",
        "Settings": "সেটিংস",
        "HealthBridge AI": "হেলথব্রিজ এআই",
        "Your AI Health Companion": "আপনার এআই স্বাস্থ্য সঙ্গী",
        "Namaste!": "নমস্কার!",
        "How can I help you with your health today?": "আজ আমি আপনার স্বাস্থ্যে কীভাবে সাহায্য করতে পারি?",
        "Recent Alerts": "সাম্প্রতিক সতর্কতা",
        "Quick Access": "দ্রুত অ্যাক্সেস",
        "Ask Questions": "প্রশ্ন করুন",
        "Vaccination Schedule": "টিকা সময়সূচী",
        "Active Alerts": "সক্রিয় সতর্কতা",
        "In your district": "আপনার জেলায়",
        "Health Tips": "স্বাস্থ্য টিপস",
        "New tips today": "আজকের নতুন টিপস",
        "Vaccines Due": "টিকা বাকি",
        "This month": "এই মাসে",
        "Health Profile": "স্বাস্থ্য প্রোফাইল",
        "Profile Complete": "প্রোফাইল সম্পূর্ণ",
        "Upcoming Vaccines": "আসন্ন টিকা",
        "View all": "সব দেখুন",
        "Daily Health Tip": "দৈনিক স্বাস্থ্য টিপ",
        "New": "নতুন",
        "Live Disease Surveillance": "লাইভ রোগ নজরদারি",
        "Search diseases, symptoms, vaccines…": "রোগ, লক্ষণ, ভ্যাকসিন খুঁজুন…"
      },
      Telugu: {
        "Dashboard": "డ్యాష్‌బోర్డ్",
        "Chat Assistant": "చాట్ అసిస్టెంట్",
        "Symptom Checker": "లక్షణాల చెకర్",
        "Disease Awareness": "వ్యాధి అవగాహన",
        "Vaccination Tracker": "టీకా ట్రాకర్",
        "Health Alerts": "ఆరోగ్య హెచ్చరికలు",
        "Daily Health Tips": "రోజువారీ ఆరోగ్య చిట్కాలు",
        "Emergency Help": "అత్యవసర సహాయం",
        "Profile": "ప్రొఫైల్",
        "Settings": "సెట్టింగ్‌లు",
        "HealthBridge AI": "హెల్త్‌బ్రిడ్జ్ ఏఐ",
        "Your AI Health Companion": "మీ ఏఐ ఆరోగ్య సహచరుడు",
        "Namaste!": "నమస్తే!",
        "How can I help you with your health today?": "ఈ రోజు మీ ఆరోగ్యానికి నేను ఎలా సహాయపడగలను?",
        "Recent Alerts": "ఇటీవలి హెచ్చరికలు",
        "Quick Access": "త్వరిత ప్రాప్యత",
        "Ask Questions": "ప్రశ్నలు అడగండి",
        "Vaccination Schedule": "టీకా క్యాలెండర్",
        "Active Alerts": "క్రియాశీల హెచ్చరికలు",
        "In your district": "మీ జిల్లాలో",
        "Health Tips": "ఆరోగ్య చిట్కాలు",
        "New tips today": "ఈరోజు కొత్త చిట్కాలు",
        "Vaccines Due": "బకాయి ఉన్న టీకాలు",
        "This month": "ఈ నెలలో",
        "Health Profile": "ఆరోగ్య ప్రొఫైల్",
        "Profile Complete": "ప్రొఫైల్ పూర్తయింది",
        "Upcoming Vaccines": "రాబోయే టీకాలు",
        "View all": "అన్ని చూడండి",
        "Daily Health Tip": "రోజువారీ ఆరోగ్య చిట్కా",
        "New": "నవీకరించబడింది",
        "Live Disease Surveillance": "ప్రత్యక్ష వ్యాధి నిఘా",
        "Search diseases, symptoms, vaccines…": "వ్యాధులు, లక్షణాలు, టీకాలు శోధించండి…"
      }
    };

    function initLanguageSelector() {
      const topbarActions = document.querySelector('.topbar-actions');
      const avatar = topbarActions ? topbarActions.querySelector('.avatar') : null;
      const notifBell = document.getElementById('notifBell');
      
      const langWrap = document.createElement('div');
      langWrap.className = 'lang-select-wrap topbar-lang-wrap';
      langWrap.style.marginRight = '12px';
      langWrap.style.background = 'var(--surface-50)';
      langWrap.style.border = '1px solid var(--border)';
      langWrap.style.marginLeft = '8px';
      langWrap.innerHTML = `
        <i class="fa-solid fa-globe" style="color:var(--text-muted)"></i>
        <select class="lang-select" id="topLangSelect" aria-label="Select language" style="background:transparent; border:none; color:var(--text); font-family:inherit; font-weight:500; font-size:14px; outline:none; cursor:pointer;-webkit-appearance:none; padding:0 4px;margin-left:4px;">
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Odia">Odia</option>
          <option value="Bengali">Bengali</option>
          <option value="Telugu">Telugu</option>
        </select>
        <i class="fa-solid fa-chevron-down" style="font-size:10px; color:var(--text-muted); margin-left:4px;"></i>
      `;

      if (notifBell) {
        notifBell.insertAdjacentElement('beforebegin', langWrap);
      } else if (topbarActions) {
        topbarActions.insertBefore(langWrap, avatar);
      }

      const allTextNodes = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while(node = walk.nextNode()) {
        if (node.parentElement && ['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION'].includes(node.parentElement.tagName)) continue;
        const t = node.nodeValue.trim();
        if (t && /[a-zA-Z]/.test(t)) {
          allTextNodes.push({ node, original: t, current: t });
        }
      }
      
      const placeholders = Array.from(document.querySelectorAll('[placeholder]'));
      const currentLang = localStorage.getItem('hb_lang_hardcoded') || 'English';
      const topSelect = document.getElementById('topLangSelect');
      if (topSelect) topSelect.value = currentLang;

      function applyLanguage(lang) {
        localStorage.setItem('hb_lang_hardcoded', lang);
        if (topSelect && topSelect.value !== lang) topSelect.value = lang;
        
        const dict = DICTIONARY[lang] || {};
        
        // Translate text nodes dynamically
        allTextNodes.forEach(item => {
          const newVal = dict[item.original] || item.original;
          if (item.current !== newVal) {
            item.node.nodeValue = item.node.nodeValue.replace(item.current, newVal);
            item.current = newVal;
          }
        });

        // Translate placeholders
        placeholders.forEach(el => {
          const orig = el.getAttribute('data-orig-placeholder') || el.getAttribute('placeholder');
          if (!el.hasAttribute('data-orig-placeholder')) {
            el.setAttribute('data-orig-placeholder', orig);
          }
          const newVal = dict[orig] || orig;
          el.setAttribute('placeholder', newVal);
        });
      }

      if (topSelect) {
        topSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
      }
      applyLanguage(currentLang);
    }
    // Simulated fetch delay before swapping skeletons for real content
    setTimeout(revealContent, 650 + Math.random() * 250);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Quick access items without functional pages show a friendly toast
    document.querySelectorAll('[data-coming-soon]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        showToast(`"${el.dataset.comingSoon}" is coming soon in the next release`, 'fa-hourglass-half');
      });
    });

    // Notification bell demo toast
    const bell = document.getElementById('notifBell');
    if (bell) {
      bell.addEventListener('click', () => showToast('3 new health alerts in your district', 'fa-bell'));
    }

    initSupabaseAuthUI();
  });

  /* ---------------------------------------------------
     SUPABASE AUTH UI & BACKEND GATEWAY INTEGRATION
  --------------------------------------------------- */
  function initSupabaseAuthUI() {
    const unsignedEl = document.getElementById('authUnsigned');
    const signedInEl = document.getElementById('authSignedIn');
    const nameEl = document.getElementById('authAccountName');
    const avatarEl = document.getElementById('authAvatar');
    const btnSignUp = document.getElementById('btnAuthSignUp');
    const btnSignOut = document.getElementById('btnAuthSignOut');
    const btnGuest = document.getElementById('btnAuthGuest');

    async function checkAuthStatus() {
      const savedToken = localStorage.getItem('hb_jwt_token');
      if (!savedToken) {
        if (unsignedEl) unsignedEl.style.display = 'flex';
        if (signedInEl) signedInEl.style.display = 'none';
        return;
      }

      // Show cached user info immediately while we verify in the background
      const cachedName = localStorage.getItem('hb_user_name') || 'User';
      if (unsignedEl) unsignedEl.style.display = 'none';
      if (signedInEl) signedInEl.style.display = 'flex';
      if (nameEl) nameEl.textContent = cachedName;
      if (avatarEl) avatarEl.textContent = cachedName.substring(0, 2).toUpperCase();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const res = await fetch("http://localhost:8000/api/auth/me", {
          headers: { "Authorization": "Bearer " + savedToken },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const user = await res.json();
          if (unsignedEl) unsignedEl.style.display = 'none';
          if (signedInEl) signedInEl.style.display = 'flex';
          const displayName = user.full_name || (user.email ? user.email.split('@')[0] : "User");
          if (nameEl) nameEl.textContent = displayName;
          if (avatarEl) avatarEl.textContent = displayName.substring(0, 2).toUpperCase();
          // Cache the name for next load
          localStorage.setItem('hb_user_name', displayName);
        } else {
          // Token invalid — clear everything
          localStorage.removeItem('hb_jwt_token');
          localStorage.removeItem('hb_user_name');
          if (unsignedEl) unsignedEl.style.display = 'flex';
          if (signedInEl) signedInEl.style.display = 'none';
        }
      } catch (err) {
        // Network error or timeout: keep showing cached signed-in state
        // (do NOT hide the user name just because the backend is slow/down)
        console.warn('Auth check failed (backend unreachable), showing cached user:', cachedName);
      }
    }

    window.checkAuthStatus = checkAuthStatus;

    if (btnGuest) {
      btnGuest.addEventListener('click', () => {
        showToast('Browsing in Guest Mode', 'fa-user-clock');
      });
    }

    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        localStorage.removeItem('hb_jwt_token');
        localStorage.removeItem('hb_user_name');
        showToast('Signed out successfully', 'fa-arrow-right-from-bracket');
        checkAuthStatus();
      });
    }

    if (btnSignUp) {
      btnSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal();
      });
    }

    function openAuthModal() {
      let modal = document.getElementById('hbAuthModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'hbAuthModal';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px);';
        modal.innerHTML = `
          <div style="background:var(--surface, #ffffff);padding:28px;border-radius:16px;width:340px;max-width:90%;box-shadow:0 15px 35px rgba(0,0,0,0.2);border:1px solid var(--border, #e2e8f0);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
              <h3 id="authModalTitle" style="font-size:18px;font-weight:700;color:var(--brand-teal,#0d9488);">Sign In</h3>
              <button id="closeAuthModal" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-secondary,#64748b);">&times;</button>
            </div>
            <form id="authForm">
              <div id="fullNameGroup" style="display:none;margin-bottom:12px;">
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;color:var(--text-primary);">Full Name</label>
                <input type="text" id="authFullName" placeholder="John Doe" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border,#cbd5e1);font-size:13px;" />
              </div>
              <div style="margin-bottom:12px;">
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;color:var(--text-primary);">Email</label>
                <input type="email" id="authEmail" required placeholder="user@gmail.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border,#cbd5e1);font-size:13px;" />
              </div>
              <div style="margin-bottom:18px;">
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;color:var(--text-primary);">Password</label>
                <input type="password" id="authPassword" required placeholder="••••••••" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border,#cbd5e1);font-size:13px;" />
              </div>
              <button type="submit" id="authSubmitBtn" style="width:100%;background:var(--brand-teal,#0d9488);color:white;padding:11px;border-radius:8px;border:none;font-weight:600;font-size:14px;cursor:pointer;">Sign In</button>
            </form>
            <div style="margin-top:14px;text-align:center;font-size:12.5px;">
              <span id="authToggleText" style="color:var(--text-secondary);">Don't have an account? </span>
              <a href="#" id="authToggleLink" style="color:var(--brand-teal,#0d9488);font-weight:600;text-decoration:none;">Sign Up</a>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      } else {
        modal.style.display = 'flex';
      }

      const title = modal.querySelector('#authModalTitle');
      const fullNameGroup = modal.querySelector('#fullNameGroup');
      const submitBtn = modal.querySelector('#authSubmitBtn');
      const toggleLink = modal.querySelector('#authToggleLink');
      const toggleText = modal.querySelector('#authToggleText');
      const closeBtn = modal.querySelector('#closeAuthModal');
      const form = modal.querySelector('#authForm');

      let isSignUp = false;

      function updateMode() {
        if (isSignUp) {
          title.textContent = "Sign Up";
          fullNameGroup.style.display = "block";
          submitBtn.textContent = "Create Account";
          toggleText.textContent = "Already have an account? ";
          toggleLink.textContent = "Sign In";
        } else {
          title.textContent = "Sign In";
          fullNameGroup.style.display = "none";
          submitBtn.textContent = "Sign In";
          toggleText.textContent = "Don't have an account? ";
          toggleLink.textContent = "Sign Up";
        }
      }

      updateMode();

      toggleLink.onclick = (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        updateMode();
      };

      closeBtn.onclick = () => { modal.style.display = 'none'; };

      form.onsubmit = async (e) => {
        e.preventDefault();
        const email = modal.querySelector('#authEmail').value.trim();
        const password = modal.querySelector('#authPassword').value;
        const full_name = modal.querySelector('#authFullName').value.trim();

        const isSignUpMode = (title.textContent.trim() === "Sign Up");
        const endpoint = isSignUpMode ? "http://localhost:8000/api/auth/signup" : "http://localhost:8000/api/auth/signin";
        const body = isSignUpMode ? { email, password, full_name: full_name || "User", preferred_language: "en" } : { email, password };

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (data.access_token) {
              localStorage.setItem('hb_jwt_token', data.access_token);
            }
            // Cache the display name so topbar stays visible even if backend is slow later
            const displayName = data.full_name || (email ? email.split('@')[0] : (full_name || 'User'));
            localStorage.setItem('hb_user_name', displayName);
            showToast(data.message || "Success!", "fa-circle-check");
            modal.style.display = 'none';
            if (typeof window.checkAuthStatus === 'function') window.checkAuthStatus();
          } else {
            showToast(data.detail || data.message || "Auth Error", "fa-triangle-exclamation");
          }
        } catch (err) {
          showToast("Server connection error", "fa-triangle-exclamation");
        }
      };
    }

    window.openAuthModal = openAuthModal;
    checkAuthStatus();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btnAuthSignUp');
    if (btn) {
      e.preventDefault();
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal();
      }
    }
  });
})();

