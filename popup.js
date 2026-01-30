const STORAGE_KEY = 'x_highlighter_data';
const COLORS = ['#87CEEB80', '#98FB9880', '#FFFF0080', '#FFA50080', '#FF69B480'];

let allHighlights = [];
let filteredHighlights = [];
let selectedColorIndex = 0;

document.addEventListener('DOMContentLoaded', init);

function init() {
  setupTabs();
  setupColorPicker();
  setupSearch();
  setupActions();
  setupViewAllButton();
  loadData();
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
}

function setupColorPicker() {
  const picker = document.getElementById('color-picker');
  COLORS.forEach((color, index) => {
    const option = document.createElement('div');
    option.className = `color-option${index === 0 ? ' selected' : ''}`;
    option.style.backgroundColor = color;
    option.dataset.index = index;
    option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedColorIndex = index;
    });
    picker.appendChild(option);
  });

  document.getElementById('apply-color').addEventListener('click', () => {
    chrome.storage.local.set({ defaultColor: COLORS[selectedColorIndex] });
    showToast('Default color updated!');
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filteredHighlights = allHighlights.filter(h =>
      h.text.toLowerCase().includes(query) ||
      (h.url && h.url.toLowerCase().includes(query))
    );
    renderHighlightList();
  });
}

function setupActions() {
  document.getElementById('export-btn').addEventListener('click', exportHighlights);
  document.getElementById('import-btn').addEventListener('click', importHighlights);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllHighlights);
}

function setupViewAllButton() {
  const viewAllBtn = document.getElementById('view-all-btn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('highlights.html') });
    });
  }
}

function loadData() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    allHighlights = result[STORAGE_KEY] || [];
    filteredHighlights = [...allHighlights];
    updateStats();
    renderHighlightList();
  });

  chrome.storage.local.get(['defaultColor'], (result) => {
    if (result.defaultColor) {
      const index = COLORS.indexOf(result.defaultColor);
      if (index !== -1) {
        selectedColorIndex = index;
        document.querySelectorAll('.color-option').forEach((o, i) => {
          o.classList.toggle('selected', i === index);
        });
      }
    }
  });
}

function updateStats() {
  document.getElementById('stats').textContent = `${allHighlights.length} highlight${allHighlights.length !== 1 ? 's' : ''}`;
}

function renderHighlightList() {
  const list = document.getElementById('highlight-list');
  list.innerHTML = '';

  if (filteredHighlights.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11L12 14L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <p>No highlights yet.<br>Select text on X.com and press Ctrl+H to highlight!</p>
      </div>
    `;
    return;
  }

  filteredHighlights.forEach((highlight, index) => {
    const item = document.createElement('div');
    item.className = 'highlight-item';

    try {
      const url = new URL(highlight.url || 'https://x.com');
      const domain = url.hostname;
      const date = highlight.timestamp ? new Date(highlight.timestamp).toLocaleDateString() : '';

      item.innerHTML = `
        <div class="highlight-text">${escapeHtml(highlight.text || '')}</div>
        <div class="highlight-meta">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="highlight-color" style="background-color: ${highlight.color || COLORS[0]}"></span>
            <span class="highlight-url">${domain}</span>
          </div>
          <span>${date}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        if (highlight.url) {
          chrome.tabs.create({ url: highlight.url });
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHighlight(highlight.id);
      });

      const metaRow = item.querySelector('.highlight-meta');
      metaRow.style.display = 'flex';
      metaRow.style.justifyContent = 'space-between';
      metaRow.appendChild(deleteBtn);

    } catch (e) {
      console.error('Error rendering highlight:', e);
    }

    list.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function deleteHighlight(id) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    let highlights = result[STORAGE_KEY] || [];
    highlights = highlights.filter(h => h.id !== id);
    chrome.storage.local.set({ [STORAGE_KEY]: highlights }, () => {
      allHighlights = highlights;
      filteredHighlights = [...highlights];
      updateStats();
      renderHighlightList();
      showToast('Highlight deleted');

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && (tabs[0].url.includes('x.com') || tabs[0].url.includes('twitter.com'))) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadHighlights' });
        }
      });
    });
  });
}

function exportHighlights() {
  const data = JSON.stringify(allHighlights, null, 2);
  const textarea = document.getElementById('export-textarea');
  textarea.style.display = 'block';
  textarea.value = data;
  textarea.select();
  document.execCommand('copy');
  showToast('Highlights copied to clipboard!');
}

function importHighlights() {
  const textarea = document.getElementById('export-textarea');
  textarea.style.display = 'block';
  textarea.value = '';
  textarea.placeholder = 'Paste exported JSON data here...';
  textarea.focus();

  textarea.addEventListener('blur', function handler() {
    const data = textarea.value.trim();
    if (data) {
      try {
        const imported = JSON.parse(data);
        if (Array.isArray(imported)) {
          chrome.storage.local.get([STORAGE_KEY], (result) => {
            const existing = result[STORAGE_KEY] || [];
            const existingIds = new Set(existing.map(h => h.id));
            const newHighlights = imported.filter(h => !existingIds.has(h.id));
            const merged = [...existing, ...newHighlights];
            chrome.storage.local.set({ [STORAGE_KEY]: merged }, () => {
              allHighlights = merged;
              filteredHighlights = [...merged];
              updateStats();
              renderHighlightList();
              showToast(`Imported ${newHighlights.length} new highlights!`);
            });
          });
        }
      } catch (e) {
        showToast('Invalid JSON data');
      }
    }
    textarea.style.display = 'none';
    textarea.placeholder = 'Paste exported data here...';
    textarea.removeEventListener('blur', handler);
  });
}

function clearAllHighlights() {
  if (confirm('Are you sure you want to delete all highlights? This cannot be undone.')) {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      allHighlights = [];
      filteredHighlights = [];
      updateStats();
      renderHighlightList();
      showToast('All highlights cleared');

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && (tabs[0].url.includes('x.com') || tabs[0].url.includes('twitter.com'))) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadHighlights' });
        }
      });
    });
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
