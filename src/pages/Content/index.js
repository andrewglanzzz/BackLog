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
    if (metaTag.getAttribute('itemprop') === 'genre') {
      genre = metaTag.getAttribute('content').trim();
      break; // Stop the loop once we find the genre
    }
  }

  // Use document.querySelector to dynamically scrape album art.
  const albumShortcut = document.querySelector('.album_shortcut');
  const shortcutValue = albumShortcut ? albumShortcut.value.trim() : '';

  // Remove "Album" from the output and keep only the number
  const albumNumber = shortcutValue.replace('Album', '').slice(1, -1);

  // Construct the selector for cover art using the album number
  const coverArtDiv = document.querySelector(`.coverart_${albumNumber}`);

  let imageUrl = '';

  if (coverArtDiv) {
    const imgElement = coverArtDiv.querySelector('img');
    const srcsetValue = imgElement.getAttribute('srcset');

    if (srcsetValue) {
      // Extract the URL from srcset
      // imageURL needs HTTPS in the constructor for the e.snmc.io images or else it WILL NOT WORK!
      imageUrl = 'https:' + srcsetValue.split(', ')[0].split(' ')[0];
    } else {
      console.log('No srcset attribute found');
      imageUrl =
        'https://placehold.co/150x150?text=No+Image+Provided&font=roboto/';
    }
  } else {
    console.log(`Cover art element for album ${albumNumber} not found`);
    imageUrl =
      'https://placehold.co/150x150?text=No+Image+Provided&font=roboto/';
  }

  return {
    artist: artist || 'Album: N/A',
    albumName: albumName || 'Artist: N/A',
    rating: rating || '0 / No Ratings',
    genre: genre || 'Genre: N/A',
    imageUrl: imageUrl || '',
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getURL') {
    // Get the URL of the active tab
    const url = window.location.href;

    // Extract album information from RateYourMusic
    const { artist, albumName, rating, genre, imageUrl } = extractAlbumInfo(); // Include the genre in the extracted information

    // Send the URL, album name, artist, rating, and genre back to the popup
    chrome.runtime.sendMessage({
      action: 'sendURL',
      url: url,
      imageUrl: imageUrl,
      albumName: albumName,
      artist: artist,
      rating: rating,
      genre: genre, // Include the genre in the data sent back to the popup
    });
  }
});

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

// Add a listener for messages from the popup
chrome.runtime.onMessage.addListener(handleMessageFromContentScript);
