// Background script for Smart Word Typing Suggestion
chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.sync.get(['enabled', 'mode', 'apiConnected', 'apiKey'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: false });
    }
    if (result.mode === undefined) {
      chrome.storage.sync.set({ mode: 'grammar' });
    }
    if (result.apiConnected === undefined) {
      chrome.storage.sync.set({ apiConnected: false });
    }
    if (result.apiKey === undefined) {
      chrome.storage.sync.set({ apiKey: '' });
    }
  });
}); 