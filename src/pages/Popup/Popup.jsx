import React from 'react';
import './Popup.css';
import Sticky from 'react-sticky-el';

const Popup = () => {
  const [activeTabData, setActiveTabData] = React.useState(null);
  const [urlList, setUrlList] = React.useState([]);
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    // Load the URL list from localStorage when the popup opens
    const storedUrlList = localStorage.getItem('urlList');
    if (storedUrlList) {
      setUrlList(JSON.parse(storedUrlList));
    }

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'sendURL') {
        const { url, albumName, artist } = message;
        setActiveTabData({ url, albumName, artist });

        // Add the URL to the URL list
        setUrlList((prevUrlList) => {
          const newUrlList = [...prevUrlList, { url, albumName, artist }];
          // Save the updated URL list to localStorage
          localStorage.setItem('urlList', JSON.stringify(newUrlList));
          return newUrlList;
        });
      }
    });
  }, []);

  const handleClick = () => {
    // Send a message to the content script to retrieve the URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const activeTab = tabs[0];
        const tabId = activeTab.id;

        // Send a message to the content script
        chrome.tabs.sendMessage(tabId, { action: 'getURL' });
      }
    });
  };

  const handleDelete = (index) => {
    // Remove the URL from the URL list
    const updatedUrlList = urlList.filter((_, i) => i !== index);
    setUrlList(updatedUrlList);

    // Save the updated URL list to localStorage
    localStorage.setItem('urlList', JSON.stringify(updatedUrlList));
  };

  const handleClear = () => {
    // Show a warning message before clearing the URL list
    setShowWarning(true);
  };

  const handleConfirmClear = () => {
    // Clear the URL list and localStorage
    setUrlList([]);
    localStorage.removeItem('urlList');
    // Hide the warning message after the URLs are cleared
    setShowWarning(false);
  };

  const handleCancelClear = () => {
    // Hide the warning message if the user cancels clearing
    setShowWarning(false);
  };

  return (
    <div className="App">
      <Sticky scrollElement=".scrollarea">
        <h1 className="sticky-header">BackLog</h1>
      </Sticky>
      {!showWarning ? (
        <>
          <button
            className="button-backlog"
            onClick={handleClick}
            role="button"
          >
            BackLog this album!
          </button>
          <button
            className="button-backlog"
            onClick={handleClear}
            role="button"
          >
            Clear All
          </button>
          <nav>
            <ul>
              {/* Render the URL list in the <ul> element */}
              {urlList.map((data, index) => (
                <li key={index}>
                  <a href={data.url} target="_blank" rel="noopener noreferrer">
                    {`${data.albumName} - ${data.artist}`}
                  </a>
                  {/* Add a button to delete the URL */}
                  <button onClick={() => handleDelete(index)}>X</button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <div className="warning-message">
          <p>Are you sure you want to clear all URLs?</p>
          <button onClick={handleConfirmClear}>Yes</button>
          <button onClick={handleCancelClear}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Popup;
