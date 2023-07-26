import React from 'react';
import './Popup.css';
import Sticky from 'react-sticky-el';

const Popup = () => {
  const [activeTabUrl, setActiveTabUrl] = React.useState('');
  const [urlList, setUrlList] = React.useState([]);

  React.useEffect(() => {
    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'sendURL') {
        const url = message.url;
        setActiveTabUrl(url);

        // Add the URL to the URL list
        setUrlList((prevUrlList) => [...prevUrlList, url]);
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

  return (
    <div className="App">
      <Sticky scrollElement=".scrollarea">
        <h1 className="sticky-header">BackLog</h1>
      </Sticky>
      <button className="button-backlog" onClick={handleClick} role="button">
        BackLog this album!
      </button>
      <nav>
        <ul>
          {/* Render the URL list in the <ul> element */}
          {urlList.map((url, index) => (
            <li key={index}>{url}</li>
          ))}
        </ul>
      </nav>
      {activeTabUrl && <p>Active Tab URL: {activeTabUrl}</p>}
    </div>
  );
};

export default Popup;
