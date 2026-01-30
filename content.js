let currentHighlightColor = '#87CEEB80';
const HIGHLIGHT_CLASS = 'x-highlighter-mark';
const STORAGE_KEY = 'x_highlighter_data';
const HIGHLIGHT_COLORS = ['#87CEEB80', '#98FB9880', '#FFFF0080', '#FFA50080', '#FF69B480'];
let currentColorIndex = 0;

let popup = null;
let optionsPopup = null;
let hoveredHighlight = null;
let highlightTimeout = null;

function init() {
  createPopup();
  createOptionsPopup();
  loadDefaultColor();
  loadHighlights();

  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeyboard);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        setTimeout(() => loadHighlights(), 100);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function createPopup() {
  popup = document.createElement('div');
  popup.id = 'x-highlighter-popup';
  popup.innerHTML = `
    <button id="highlight-btn" title="Highlight (Ctrl+H)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11L12 14L22 4"></path>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
    </button>
    <button id="color-btn" title="Change Color">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
  `;
  document.body.appendChild(popup);

  document.getElementById('highlight-btn').addEventListener('click', highlightSelection);
  document.getElementById('color-btn').addEventListener('click', cycleColor);
}

function createOptionsPopup() {
  optionsPopup = document.createElement('div');
  optionsPopup.id = 'x-highlighter-options';
  optionsPopup.innerHTML = `
    <div class="color-options">
      ${HIGHLIGHT_COLORS.map((color, i) => `
        <div class="color-option" data-color="${color}" style="background: ${color}"></div>
      `).join('')}
    </div>
    <button class="option-btn" id="copy-option">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy
    </button>
    <button class="option-btn" id="view-option">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
      View Tweet
    </button>
    <button class="option-btn danger" id="delete-option">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      Delete
    </button>
  `;
  document.body.appendChild(optionsPopup);

  optionsPopup.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => changeHighlightColor(opt.dataset.color));
  });

  optionsPopup.querySelector('#copy-option').addEventListener('click', copyHighlight);
  optionsPopup.querySelector('#view-option').addEventListener('click', viewTweet);
  optionsPopup.querySelector('#delete-option').addEventListener('click', deleteHighlight);
}

function loadDefaultColor() {
  chrome.storage.local.get(['defaultColor'], (result) => {
    if (result.defaultColor) {
      const index = HIGHLIGHT_COLORS.indexOf(result.defaultColor);
      if (index !== -1) {
        currentColorIndex = index;
        currentHighlightColor = result.defaultColor;
      }
    }
  });
}

function handleKeyboard(e) {
  if (e.ctrlKey && e.key === 'h') {
    e.preventDefault();
    highlightSelection();
  }
}

function handleTextSelection(e) {
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      popup.style.display = 'flex';
      popup.style.left = `${rect.left + window.scrollX + rect.width / 2 - 32}px`;
      popup.style.top = `${rect.top + window.scrollY - 44}px`;

      document.getElementById('color-btn').style.backgroundColor = currentHighlightColor;
    } else {
      popup.style.display = 'none';
    }
  }, 10);
}

function handleClickOutside(e) {
  if (!popup.contains(e.target) && !optionsPopup.contains(e.target)) {
    popup.style.display = 'none';
    hideOptionsPopup();
  }
}

function cycleColor() {
  currentColorIndex = (currentColorIndex + 1) % HIGHLIGHT_COLORS.length;
  currentHighlightColor = HIGHLIGHT_COLORS[currentColorIndex];
  document.getElementById('color-btn').style.backgroundColor = currentHighlightColor;
  chrome.storage.local.set({ defaultColor: currentHighlightColor });
}

function highlightSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  if (selectedText.length === 0) return;

  const highlightId = 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const span = document.createElement('span');
  span.classList.add(HIGHLIGHT_CLASS);
  span.dataset.highlightId = highlightId;
  span.style.backgroundColor = currentHighlightColor;

  const contents = range.extractContents();
  span.appendChild(contents);
  range.insertNode(span);

  span.animate([
    { transform: 'scale(1.02)', opacity: '0.8' },
    { transform: 'scale(1)', opacity: '1' }
  ], { duration: 150, easing: 'ease-out' });

  addHighlightHoverListeners(span);

  saveHighlight(highlightId, selectedText);
  selection.removeAllRanges();
  popup.style.display = 'none';
}

function addHighlightHoverListeners(element) {
  element.addEventListener('mouseenter', (e) => {
    clearTimeout(highlightTimeout);
    showOptionsPopup(e.target);
  });

  element.addEventListener('mouseleave', () => {
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(() => hideOptionsPopup(), 400);
  });
}

function showOptionsPopup(element) {
  hoveredHighlight = element;
  const rect = element.getBoundingClientRect();
  const highlightId = element.dataset.highlightId;

  optionsPopup.style.display = 'flex';
  optionsPopup.style.left = `${rect.left + window.scrollX + rect.width / 2 - 70}px`;
  optionsPopup.style.top = `${rect.bottom + window.scrollY - 4}px`;

  optionsPopup.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === element.style.backgroundColor);
  });

  optionsPopup.dataset.highlightId = highlightId;

  optionsPopup.onmouseenter = () => {
    clearTimeout(highlightTimeout);
  };

  optionsPopup.onmouseleave = () => {
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(() => hideOptionsPopup(), 300);
  };
}

function hideOptionsPopup() {
  optionsPopup.style.display = 'none';
  hoveredHighlight = null;
}

function changeHighlightColor(color) {
  if (hoveredHighlight) {
    hoveredHighlight.style.backgroundColor = color;
    const highlightId = hoveredHighlight.dataset.highlightId;
    updateHighlightColor(highlightId, color);

    optionsPopup.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.color === color);
    });
  }
}

function copyHighlight() {
  if (hoveredHighlight) {
    navigator.clipboard.writeText(hoveredHighlight.textContent.trim());
    hideOptionsPopup();
  }
}

function viewTweet() {
  if (hoveredHighlight) {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const highlights = result[STORAGE_KEY] || [];
      const highlight = highlights.find(h => h.id === hoveredHighlight.dataset.highlightId);
      if (highlight && highlight.url) {
        chrome.tabs.create({ url: highlight.url });
      }
      hideOptionsPopup();
    });
  }
}

function deleteHighlight() {
  if (hoveredHighlight && confirm('Delete this highlight?')) {
    const highlightId = hoveredHighlight.dataset.highlightId;
    const parent = hoveredHighlight.parentNode;
    while (hoveredHighlight.firstChild) {
      parent.insertBefore(hoveredHighlight.firstChild, hoveredHighlight);
    }
    parent.removeChild(hoveredHighlight);
    parent.normalize();
    removeHighlightFromStorage(highlightId);
    hideOptionsPopup();
  }
}

function saveHighlight(highlightId, text) {
  const highlightData = {
    id: highlightId,
    text: text,
    color: currentHighlightColor,
    url: window.location.href,
    timestamp: Date.now()
  };

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const highlights = result[STORAGE_KEY] || [];
    highlights.push(highlightData);
    chrome.storage.local.set({ [STORAGE_KEY]: highlights });
  });
}

function updateHighlightColor(highlightId, color) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    let highlights = result[STORAGE_KEY] || [];
    highlights = highlights.map(h => h.id === highlightId ? { ...h, color } : h);
    chrome.storage.local.set({ [STORAGE_KEY]: highlights });
  });
}

function removeHighlightFromStorage(highlightId) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    let highlights = result[STORAGE_KEY] || [];
    highlights = highlights.filter(h => h.id !== highlightId);
    chrome.storage.local.set({ [STORAGE_KEY]: highlights });
  });
}

function loadHighlights() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const highlights = result[STORAGE_KEY] || [];
    const currentUrl = window.location.href;

    highlights.forEach(highlight => {
      if (highlight.url === currentUrl) {
        restoreHighlight(highlight);
      }
    });
  });
}

function restoreHighlight(highlight) {
  try {
    const text = highlight.text;
    const highlightId = highlight.id;
    const color = highlight.color || currentHighlightColor;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          return node.textContent.trim() === text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const element = walker.nextNode();
    if (element && !element.dataset.highlightId) {
      const span = document.createElement('span');
      span.classList.add(HIGHLIGHT_CLASS);
      span.dataset.highlightId = highlightId;
      span.style.backgroundColor = color;

      const textNode = element.firstChild;
      if (textNode && textNode.textContent.includes(text)) {
        const index = textNode.textContent.indexOf(text);
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + text.length);

        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        addHighlightHoverListeners(span);
      }
    }
  } catch (e) {
    console.error('Failed to restore highlight:', e);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'reloadHighlights') {
    document.querySelectorAll(`[data-highlight-id]`).forEach(el => el.remove());
    loadHighlights();
    sendResponse({ success: true });
  } else if (message.action === 'highlight-selection') {
    highlightSelection();
    sendResponse({ success: true });
  }
  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
