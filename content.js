let debounceTimer;
let suggestionPopup = null;

// API endpoint (hardcoded)
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Create suggestion popup element
function createSuggestionPopup() {
  const popup = document.createElement('div');
  popup.className = 'suggestion-popup';
  popup.style.display = 'none';
  document.body.appendChild(popup);
  return popup;
}

// Show loading state in popup
function showLoading(popup) {
  popup.innerHTML = `
    <div class="suggestion-popup-header">Getting Suggestions</div>
    <div class="suggestion-loading">Loading</div>
  `;
  popup.style.display = 'block';
}

// Show error in popup
function showError(message) {
  if (!suggestionPopup) {
    suggestionPopup = createSuggestionPopup();
  }
  suggestionPopup.innerHTML = `
    <div class="suggestion-popup-header">Error</div>
    <div class="suggestion-item error">${message}</div>
  `;
  suggestionPopup.style.display = 'block';
}

// Show suggestions
function showSuggestions(suggestions, position, mode) {
  if (!suggestionPopup) {
    suggestionPopup = createSuggestionPopup();
  }

  // Set popup position
  suggestionPopup.style.left = `${position.x}px`;
  suggestionPopup.style.top = `${position.y}px`;

  // Create header based on mode
  let headerText = 'Suggestions';
  switch(mode) {
    case 'improve':
      headerText = 'Improved Versions';
      break;
    case 'formal':
      headerText = 'Formal Versions';
      break;
    case 'casual':
      headerText = 'Casual Versions';
      break;
    case 'shorten':
      headerText = 'Shorter Versions';
      break;
    case 'expand':
      headerText = 'Expanded Versions';
      break;
    case 'grammar':
      headerText = 'Grammar Corrections';
      break;
    case 'translation':
      headerText = 'Bangla Translation';
      break;
  }

  // Create popup content
  suggestionPopup.innerHTML = `
    <div class="suggestion-popup-header">${headerText}</div>
    ${suggestions.map((suggestion, index) => `
      <div class="suggestion-item" data-index="${index}">
        <div class="suggestion-item-icon">${index + 1}</div>
        <div class="suggestion-item-text">${suggestion}</div>
        <div class="suggestion-item-shortcut">${index + 1}</div>
      </div>
    `).join('')}
  `;

  // Add click handlers
  suggestionPopup.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const suggestion = item.querySelector('.suggestion-item-text').textContent;
      insertSuggestion(suggestion);
      suggestionPopup.style.display = 'none';
    });
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', function handleKeyPress(e) {
    if (!suggestionPopup || suggestionPopup.style.display === 'none') return;
    
    const num = parseInt(e.key);
    if (num >= 1 && num <= suggestions.length) {
      const suggestion = suggestions[num - 1];
      insertSuggestion(suggestion);
      suggestionPopup.style.display = 'none';
      document.removeEventListener('keydown', handleKeyPress);
    } else if (e.key === 'Escape') {
      suggestionPopup.style.display = 'none';
      document.removeEventListener('keydown', handleKeyPress);
    }
  });

  suggestionPopup.style.display = 'block';
}

// Insert suggestion at cursor position
function insertSuggestion(suggestion) {
  const activeElement = document.activeElement;
  
  if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
    // For input and textarea elements
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const text = activeElement.value;
    activeElement.value = text.substring(0, start) + suggestion + text.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd = start + suggestion.length;
  } else {
    // For contenteditable elements
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(suggestion));
    }
  }
}

// Get suggestions from API
async function getSuggestions(text, mode) {
  try {
    console.log('Getting suggestions for text:', text, 'mode:', mode);

    // Check if API is connected and get API key
    const config = await new Promise(resolve => {
      chrome.storage.sync.get(['apiConnected', 'apiKey'], resolve);
    });

    console.log('API Config:', { connected: config.apiConnected, hasKey: !!config.apiKey });

    if (!config.apiConnected) {
      console.log('API not connected. Please connect the API first.');
      showError('Please connect your API first');
      return [];
    }

    if (!config.apiKey) {
      console.error('API key not configured');
      showError('API key not configured');
      return [];
    }

    let prompt = '';
    switch(mode) {
      case 'improve':
        prompt = `Improve this text to make it more clear and engaging: "${text}"`;
        break;
      case 'formal':
        prompt = `Rewrite this text in a more formal and professional tone: "${text}"`;
        break;
      case 'casual':
        prompt = `Rewrite this text in a more casual and friendly tone: "${text}"`;
        break;
      case 'shorten':
        prompt = `Make this text shorter while keeping the main message: "${text}"`;
        break;
      case 'expand':
        prompt = `Expand this text with more details and examples: "${text}"`;
        break;
      case 'grammar':
        prompt = `Fix any grammar, spelling, or punctuation errors in this text: "${text}"`;
        break;
      case 'translation':
        prompt = `Translate this text to Bangla: "${text}"`;
        break;
      default:
        prompt = `Improve this text: "${text}"`;
    }

    console.log('Sending request with prompt:', prompt);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        store: true,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      showError(errorData.error?.message || `API request failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log('API Response data:', data);

    // Extract suggestions from the response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in API response');
      showError('No suggestions received from API');
      return [];
    }

    // Split content into suggestions and filter empty lines
    const suggestions = content.split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Extracted suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    showError('Error: ' + error.message);
    return [];
  }
}

// Handle typing in any text input
function handleTyping(event) {
  console.log('Typing event detected:', event.target.tagName);
  
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
    // Check if extension is enabled and API is connected
    chrome.storage.sync.get(['enabled', 'mode', 'apiConnected'], async function(result) {
      console.log('Extension state:', result);

      if (!result.enabled || !result.apiConnected) {
        console.log('Extension disabled or API not connected');
        return;
      }

      console.log('Current mode:', result.mode);

      const activeElement = document.activeElement;
      let text = '';
      let position = { x: 0, y: 0 };

      if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
        // For input and textarea elements
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        text = activeElement.value.substring(start, end);
        
        // If no text is selected, use the last word
        if (text.length === 0) {
          const words = activeElement.value.split(/\s+/);
          if (words.length > 0) {
            text = words[words.length - 1];
          }
        }
        
        // Get position for popup
        const rect = activeElement.getBoundingClientRect();
        position = {
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY
        };
        
        console.log('Textarea/Input text:', text);
      } else if (activeElement.isContentEditable) {
        // For contenteditable elements
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
          console.log('No selection found');
          return;
        }

        const range = selection.getRangeAt(0);
        text = range.toString();
        
        // Get position for popup
        const rect = range.getBoundingClientRect();
        position = {
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY
        };
      } else {
        console.log('No editable element found');
        return;
      }
      
      if (text.length > 0) {
        console.log('Getting suggestions for text:', text);
        
        // Show loading state
        if (!suggestionPopup) {
          suggestionPopup = createSuggestionPopup();
        }
        showLoading(suggestionPopup);
        suggestionPopup.style.left = `${position.x}px`;
        suggestionPopup.style.top = `${position.y}px`;
        
        const suggestions = await getSuggestions(text, result.mode);
        if (suggestions.length > 0) {
          showSuggestions(suggestions, position, result.mode);
        } else {
          console.log('No suggestions received');
          if (suggestionPopup) {
            suggestionPopup.style.display = 'none';
          }
        }
      } else {
        console.log('No text selected');
      }
    });
  }, 500);
}

// Initialize
function initialize() {
  try {
    // Add event listeners to all text inputs and contenteditable elements
    document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]').forEach(element => {
      console.log('Adding event listener to:', element.tagName);
      element.addEventListener('input', handleTyping);
      element.addEventListener('keyup', handleTyping);
    });
    console.log('Initialized text input handlers');
  } catch (error) {
    console.error('Error initializing:', error);
  }
}

// Start observing DOM changes to find new text inputs
function startObserving() {
  try {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          // Check for new text inputs
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              node.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]').forEach(element => {
                console.log('Adding event listener to new element:', element.tagName);
                element.addEventListener('input', handleTyping);
                element.addEventListener('keyup', handleTyping);
              });
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('Started observing DOM changes');
  } catch (error) {
    console.error('Error starting observer:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    startObserving();
  });
} else {
  initialize();
  startObserving();
}

// Content script for Smart Word Typing Suggestion
console.log('Smart Word Typing Suggestion content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSuggestions') {
    // Handle getting suggestions
    sendResponse({ success: true });
  }
}); 