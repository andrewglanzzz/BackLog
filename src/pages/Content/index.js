import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

// Function to extract album information from the page
function extractAlbumInfo() {
  const titleElement = document.querySelector('title');
  const titleText = titleElement ? titleElement.textContent.trim() : '';

  // Extract album name and artist from the title
  const startIdx = titleText.lastIndexOf(' by ');
  const endIdx = titleText.lastIndexOf(' (');
  const albumName = titleText.slice(0, startIdx);
  const artist = titleText.slice(startIdx + 4, endIdx);

  // Use document.querySelector to select the <span> element with the class "avg_rating"
  const ratingElement = document.querySelector('.avg_rating');
  const rating = ratingElement ? ratingElement.textContent.trim() : '';

  // Use document.querySelectorAll to select all meta tags
  const metaTags = document.querySelectorAll('meta');

  // Loop through the meta tags to find the one with itemprop="genre"
  let genre = '';
  for (const metaTag of metaTags) {
    console.log('scanning for genre...');
    if (metaTag.getAttribute('itemprop') === 'genre') {
      genre = metaTag.getAttribute('content').trim();
      break; // Stop the loop once we find the genre
    }
  }

  return {
    artist: artist || '',
    albumName: albumName || '',
    rating: rating || '',
    genre: genre || '', // Add the genre to the return object
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getURL') {
    // Get the URL of the active tab
    const url = window.location.href;

    // Extract album information from RateYourMusic
    const { artist, albumName, rating, genre } = extractAlbumInfo(); // Include the genre in the extracted information

    // Send the URL, album name, artist, rating, and genre back to the popup
    chrome.runtime.sendMessage({
      action: 'sendURL',
      url: url,
      albumName: albumName,
      artist: artist,
      rating: rating,
      genre: genre, // Include the genre in the data sent back to the popup
    });
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
