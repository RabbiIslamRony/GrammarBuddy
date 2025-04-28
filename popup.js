document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const enableExtension = document.getElementById('enableExtension');
  const testText = document.getElementById('testText');
  const getSuggestionsButton = document.getElementById('getSuggestions');
  const regenerateButton = document.getElementById('regenerateSuggestions');
  const clearTextButton = document.getElementById('clearText');
  const testSuggestions = document.getElementById('testSuggestions');
  const apiKey = document.getElementById('apiKey');
  const connectApiButton = document.getElementById('connectApi');
  const apiStatusText = document.getElementById('apiStatusText');
  const apiStatus = document.getElementById('apiStatus');
  const toggleKeyButton = document.getElementById('toggleKey');
  const suggestionMode = document.getElementById('suggestionMode');
  const testArea = document.querySelector('.test-area');

  // Check if all required elements exist
  if (!enableExtension || !testText || !getSuggestionsButton || !regenerateButton || !clearTextButton || !testSuggestions || 
      !apiKey || !connectApiButton || !apiStatusText || !apiStatus || !toggleKeyButton || !suggestionMode || !testArea) {
    console.error('Required DOM elements not found');
    return;
  }

  // API endpoint (hardcoded)
  const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  // Load saved settings
  chrome.storage.sync.get(['enabled', 'mode', 'apiConnected', 'apiKey'], function(result) {
    enableExtension.checked = result.enabled ?? false;
    suggestionMode.value = result.mode ?? 'grammar';
    apiKey.value = result.apiKey ?? '';
    updateApiStatus(result.apiConnected ?? false);
    updateTestAreaState(result.enabled ?? false);
  });

  // Save settings when changed
  enableExtension.addEventListener('change', function() {
    const isEnabled = enableExtension.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateTestAreaState(isEnabled);
  });

  suggestionMode.addEventListener('change', function() {
    chrome.storage.sync.set({ mode: suggestionMode.value });
  });

  // Save API key when changed
  apiKey.addEventListener('change', function() {
    chrome.storage.sync.set({ 
      apiKey: apiKey.value,
      apiConnected: false 
    });
    updateApiStatus(false);
  });

  // Handle API connection
  connectApiButton.addEventListener('click', async function() {
    const isConnected = connectApiButton.classList.contains('connected');
    
    if (isConnected) {
      // Disconnect API
      chrome.storage.sync.set({ apiConnected: false });
      updateApiStatus(false);
    } else {
      // Connect API
      const key = apiKey.value;
      
      if (!key) {
        showStatus('Please enter your API key', 'error');
        return;
      }

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            store: true,
            messages: [
              {
                role: "user",
                content: "test connection"
              }
            ]
          })
        });

        if (response.ok) {
          chrome.storage.sync.set({ 
            apiConnected: true,
            apiKey: key
          });
          updateApiStatus(true);
          showStatus('API connected successfully!', 'success');
        } else {
          const errorData = await response.json();
          if (errorData.error?.message?.includes('quota')) {
            showStatus('API quota exceeded. Please check your billing details at https://platform.openai.com/account/billing', 'error');
          } else if (errorData.error?.message?.includes('billing')) {
            showStatus('Billing issue detected. Please set up billing at https://platform.openai.com/account/billing', 'error');
          } else {
            throw new Error(errorData.error?.message || 'API connection failed');
          }
        }
      } catch (error) {
        console.error('API Error:', error);
        if (error.message.includes('quota') || error.message.includes('billing')) {
          showStatus('API quota or billing issue. Please check your OpenAI account settings.', 'error');
        } else if (error.message.includes('CORS')) {
          showStatus('CORS error: Please check your API configuration', 'error');
        } else {
          showStatus('Error connecting to API: ' + error.message, 'error');
        }
      }
    }
  });

  // API Key Toggle
  toggleKeyButton.addEventListener('click', () => {
    if (apiKey.type === 'password') {
      apiKey.type = 'text';
      toggleKeyButton.textContent = 'Hide';
    } else {
      apiKey.type = 'password';
      toggleKeyButton.textContent = 'Show';
    }
  });

  // Clear text button functionality
  clearTextButton.addEventListener('click', function() {
    testText.value = '';
    testSuggestions.innerHTML = '';
    regenerateButton.disabled = true;
  });

  // Handle test suggestions
  async function getSuggestions() {
    // Check if extension is enabled
    const config = await new Promise(resolve => {
      chrome.storage.sync.get(['enabled', 'apiConnected', 'apiKey', 'mode'], resolve);
    });

    if (!config.enabled) {
      showTestError('Please enable the extension first');
      return;
    }

    const text = testText.value.trim();
    if (!text) {
      showTestError('Please enter some text to get suggestions');
      return;
    }

    if (!config.apiConnected) {
      showTestError('Please connect your API first');
      return;
    }

    if (!config.apiKey) {
      showTestError('API key not configured');
      return;
    }

    try {
      // Show loading state
      testSuggestions.innerHTML = '<div class="suggestion-loading">Getting suggestions...</div>';

      let prompt = '';
      switch(config.mode) {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No suggestions received from API');
      }

      // Split content into suggestions and filter empty lines
      const suggestions = content.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Show suggestions
      testSuggestions.innerHTML = suggestions.map((suggestion, index) => `
        <div class="suggestion-item" data-index="${index}">
          <div class="suggestion-item-icon">${index + 1}</div>
          <div class="suggestion-item-text">${suggestion}</div>
          <button class="copy-button" title="Copy to clipboard">
            <span>Copy</span>
          </button>
        </div>
      `).join('');

      // Add click handlers
      testSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const suggestion = item.querySelector('.suggestion-item-text').textContent;
          testText.value = suggestion;
        });
      });

      // Add copy button handlers
      testSuggestions.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation(); // Prevent suggestion click
          const suggestion = button.parentElement.querySelector('.suggestion-item-text').textContent;
          try {
            await navigator.clipboard.writeText(suggestion);
            button.innerHTML = '<span>Copied!</span>';
            button.classList.add('copied');
            setTimeout(() => {
              button.innerHTML = '<span>Copy</span>';
              button.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        });
      });

      // Enable regenerate button
      regenerateButton.disabled = false;

    } catch (error) {
      console.error('Error getting suggestions:', error);
      showTestError(error.message);
      regenerateButton.disabled = true;
    }
  }

  // Get suggestions button click
  getSuggestionsButton.addEventListener('click', getSuggestions);

  // Regenerate suggestions button click
  regenerateButton.addEventListener('click', getSuggestions);

  function updateApiStatus(connected) {
    if (connected) {
      apiStatusText.textContent = 'Connected';
      connectApiButton.textContent = 'Disconnect';
      connectApiButton.classList.remove('disconnected');
      connectApiButton.classList.add('connected');
    } else {
      apiStatusText.textContent = 'Not Connected';
      connectApiButton.textContent = 'Connect';
      connectApiButton.classList.remove('connected');
      connectApiButton.classList.add('disconnected');
    }
  }

  function updateTestAreaState(enabled) {
    if (enabled) {
      testArea.classList.remove('disabled');
      getSuggestionsButton.disabled = false;
      testText.disabled = false;
    } else {
      testArea.classList.add('disabled');
      getSuggestionsButton.disabled = true;
      regenerateButton.disabled = true;
      testText.disabled = true;
      testSuggestions.innerHTML = '';
    }
  }

  function showStatus(message, type) {
    apiStatus.textContent = message;
    apiStatus.className = 'status ' + type;
  }

  function showTestError(message) {
    testSuggestions.innerHTML = `
      <div class="suggestion-item error">${message}</div>
    `;
  }
}); 