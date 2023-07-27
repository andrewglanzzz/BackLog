import React from 'react';
import './Popup.css';
import Sticky from 'react-sticky-el';

const Popup = () => {
  const [activeTabData, setActiveTabData] = React.useState(null);
  const [urlList, setUrlList] = React.useState([]);
  const [showWarning, setShowWarning] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState('albumName');
  const [sortOrder, setSortOrder] = React.useState('asc');

  React.useEffect(() => {
    // Load the URL list from localStorage when the popup opens
    const storedUrlList = localStorage.getItem('urlList');
    if (storedUrlList) {
      setUrlList(JSON.parse(storedUrlList));
    }

    // Load the sorting preferences from localStorage
    const storedSortColumn = localStorage.getItem('sortColumn');
    const storedSortOrder = localStorage.getItem('sortOrder');
    if (storedSortColumn) {
      setSortColumn(storedSortColumn);
    }
    if (storedSortOrder) {
      setSortOrder(storedSortOrder);
    }

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'sendURL') {
        const { url, albumName, artist, rating } = message;
        setActiveTabData({ url, albumName, artist, rating });

        // Add the URL and album information to the URL list
        setUrlList((prevUrlList) => {
          const newUrlList = [
            ...prevUrlList,
            { url, albumName, artist, rating },
          ];
          // Save the updated URL list to localStorage
          localStorage.setItem('urlList', JSON.stringify(newUrlList));
          return newUrlList;
        });
      }
    });
  }, []);

  React.useEffect(() => {
    // Save the sorting preferences to localStorage whenever they change
    localStorage.setItem('sortColumn', sortColumn);
    localStorage.setItem('sortOrder', sortOrder);
  }, [sortColumn, sortOrder]);

  const handleClick = () => {
    // Send a message to the content script to retrieve the URL and album information
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const activeTab = tabs[0];
        const tabId = activeTab.id;

        // Send a message to the content script
        chrome.tabs.sendMessage(tabId, { action: 'getURL' }, (response) => {
          // Handle the response from the content script
          if (response) {
            const { url, albumName, artist, rating } = response;
            setActiveTabData({ url, albumName, artist, rating });

            // Add the URL and album information to the URL list
            setUrlList((prevUrlList) => {
              const newUrlList = [
                ...prevUrlList,
                { url, albumName, artist, rating },
              ];
              // Save the updated URL list to localStorage
              localStorage.setItem('urlList', JSON.stringify(newUrlList));
              return newUrlList;
            });
          }
        });
      }
    });
  };

  const handleDelete = (url) => {
    // Remove the URL from the URL list
    const updatedUrlList = urlList.filter((item) => item.url !== url);
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

  const handleSort = (column) => {
    // If the same column is clicked, toggle the sort order
    if (column === sortColumn) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, set the new sort column and default to ascending order
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') {
      return <span>&uarr;</span>; // Up arrow for ascending
    } else {
      return <span>&darr;</span>; // Down arrow for descending
    }
  };

  const sortedUrlList = React.useMemo(() => {
    // Clone the original URL list to avoid modifying it directly
    const sortedList = [...urlList];

    // Sort the list based on the selected column and sort order
    sortedList.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Sorting logic
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return sortedList;
  }, [urlList, sortColumn, sortOrder]);

  return (
    <div className="App">
      <Sticky scrollElement=".scrollarea">
        <h1 className="sticky-header">BackLog</h1>
      </Sticky>
      {!showWarning ? (
        <>
          <button
            className="button-backlog-album"
            onClick={handleClick}
            role="button"
          >
            BackLog this album!
          </button>
          <button
            className="button-backlog-clear"
            onClick={handleClear}
            role="button"
          >
            Clear All
          </button>
          <nav className="column-headers">
            <ul>
              {/* Render the column headers with sorting icons */}
              <li onClick={() => handleSort('albumName')}>
                Album Title {sortColumn === 'albumName' && getSortIcon()}
              </li>
              <li onClick={() => handleSort('artist')}>
                Artist {sortColumn === 'artist' && getSortIcon()}
              </li>
              <li onClick={() => handleSort('rating')}>
                Rating {sortColumn === 'rating' && getSortIcon()}
              </li>
            </ul>
          </nav>
          <nav>
            <ul>
              {/* Render the URL list with album information in the <ul> element */}
              {sortedUrlList.map((data) => (
                <li key={data.url}>
                  <a href={data.url} target="_blank" rel="noopener noreferrer">
                    {`${data.albumName} - ${data.artist}`}
                  </a>
                  {data.rating && <span>Rating: {data.rating}</span>}{' '}
                  {/* Display the album rating if available */}
                  {/* Add a button to delete the URL */}
                  <button onClick={() => handleDelete(data.url)}>X</button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <div className="warning-message">
          <p>Are you sure you want to clear your BackLog?</p>
          <button onClick={handleConfirmClear}>Yes</button>
          <button onClick={handleCancelClear}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Popup;
