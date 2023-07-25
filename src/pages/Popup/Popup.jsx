import React from 'react';
import './Popup.css';
import Sticky from 'react-sticky-el';

const Popup = () => {
  const [activeTabUrl, setActiveTabUrl] = React.useState('');

  React.useEffect(() => {
    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'sendURL') {
        const url = message.url;
        setActiveTabUrl(url);
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
          <li>Link 1</li>
          <li>Link 2</li>
          <li>Link 3</li>
          <li>Link 4</li>
          <li>Link 5</li>
          <li>Link 6</li>
        </ul>
      </nav>
      {activeTabUrl && <p>Active Tab URL: {activeTabUrl}</p>}
    </div>
  );
};

export default Popup;
