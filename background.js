chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && (tabs[0].url.includes('x.com') || tabs[0].url.includes('twitter.com'))) {
      chrome.tabs.sendMessage(tabs[0].id, { action: command });
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('x.com') || tab.url.includes('twitter.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'openPopup' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTab') {
    chrome.tabs.create({ url: message.url });
  }
});
