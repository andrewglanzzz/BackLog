import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getURL') {
    // Get the URL of the active tab
    const url = window.location.href;

    // Send the URL back to the popup
    chrome.runtime.sendMessage({ action: 'sendURL', url: url });
  }
});

// Optional: If you want to send messages from the content script to the popup, you can do it like this:
// Function to handle messages sent from the content script to the popup
function handleMessageFromContentScript(message, sender, sendResponse) {
  // Process the message as needed
  if (message.action === 'someAction') {
    // Do something with the message data
    console.log('Received message from content script:', message.data);

    // If you want to send a response back to the content script, you can use the sendResponse function
    sendResponse({ success: true, response: 'Message received successfully' });
  }
}

// Add a listener for messages from the popup (if needed)
chrome.runtime.onMessage.addListener(handleMessageFromContentScript);
