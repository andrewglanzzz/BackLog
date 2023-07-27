import React from 'react';
import './Popup.css';
import Sticky from 'react-sticky-el';
import Fuse from 'fuse.js';

const Popup = () => {
  const [activeTabData, setActiveTabData] = React.useState(null);
  const [urlList, setUrlList] = React.useState([]);
  const [showWarning, setShowWarning] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState('albumName');
  const [sortOrder, setSortOrder] = React.useState('asc');
  const [searchQuery, setSearchQuery] = React.useState('');

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

        // Check if the URL is already present in localStorage
        const storedUrlList = JSON.parse(localStorage.getItem('urlList')) || [];
        const existingItem = storedUrlList.find((item) => item.url === url);

        if (!existingItem) {
          // If the URL is not present, add it along with the current timestamp
          const currentTime = new Date().getTime();
          const newItem = {
            url,
            albumName,
            artist,
            rating,
            timestamp: currentTime,
          };
          const newUrlList = [...storedUrlList, newItem];

          // Save the updated URL list to localStorage
          localStorage.setItem('urlList', JSON.stringify(newUrlList));
          setUrlList(newUrlList);
        } else {
          // If the URL is already present, update the timestamp
          existingItem.timestamp = new Date().getTime();

          // Save the updated URL list to localStorage
          localStorage.setItem('urlList', JSON.stringify(storedUrlList));
          setUrlList(storedUrlList);
        }
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

            // Check if the URL is already present in localStorage
            const storedUrlList =
              JSON.parse(localStorage.getItem('urlList')) || [];
            const existingItem = storedUrlList.find((item) => item.url === url);

            if (!existingItem) {
              // If the URL is not present, add it along with the current timestamp
              const currentTime = new Date().getTime();
              const newItem = {
                url,
                albumName,
                artist,
                rating,
                timestamp: currentTime,
              };
              const newUrlList = [...storedUrlList, newItem];

              // Save the updated URL list to localStorage
              localStorage.setItem('urlList', JSON.stringify(newUrlList));
              setUrlList(newUrlList);
            } else {
              // If the URL is already present, update the timestamp
              existingItem.timestamp = new Date().getTime();

              // Save the updated URL list to localStorage
              localStorage.setItem('urlList', JSON.stringify(storedUrlList));
              setUrlList(storedUrlList);
            }
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
    if (column === 'recentlyAdded') {
      setSortColumn(column);
      setSortOrder('desc'); // Set the default sort order to descending for recentlyAdded
    } else {
      if (column === sortColumn) {
        setSortOrder((prevSortOrder) =>
          prevSortOrder === 'asc' ? 'desc' : 'asc'
        );
      } else {
        setSortColumn(column);
        if (column === 'rating') {
          setSortOrder('desc'); // Set the default sort order to descending for rating
        } else {
          setSortOrder('asc'); // Set the default sort order to ascending for other columns
        }
      }
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn === column) {
      if (column === 'rating') {
        return sortOrder === 'desc' ? <span>&darr;</span> : <span>&uarr;</span>;
      } else {
        return sortOrder === 'asc' ? <span>&darr;</span> : <span>&uarr;</span>;
      }
    } else {
      return null;
    }
  };

  const fuseOptions = {
    keys: ['albumName', 'artist'], // The properties to search through
    includeScore: true, // This will include the search score in the results
    threshold: 0.2, // Set a lower threshold to include only higher-scoring results
    distance: 100, // Set a lower distance to limit edit distance between query and results
  };

  const fuse = new Fuse(urlList, fuseOptions);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const sortedUrlList = React.useMemo(() => {
    // Clone the original URL list to avoid modifying it directly
    const sortedList = [...urlList];

    // Sort the list based on the selected column and sort order
    sortedList.sort((a, b) => {
      if (sortColumn === 'recentlyAdded') {
        // Sort by recently added (timestamp)
        const aValue = a.timestamp;
        const bValue = b.timestamp;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Sort by other columns (albumName, artist, rating)
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === undefined || bValue === undefined) {
          // If column value is undefined, move it to the end for ascending sort, or beginning for descending sort
          return sortOrder === 'asc'
            ? aValue === undefined
              ? 1
              : -1
            : aValue === undefined
            ? -1
            : 1;
        }

        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    return sortedList;
  }, [urlList, sortColumn, sortOrder]);

  const displayList = searchQuery
    ? fuse.search(searchQuery).map((result) => result.item)
    : sortedUrlList;

  return (
    <div className="App">
      <h1 className="h1-backlog">BackLog</h1>
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
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for albums or artists..."
          />
          <nav className="column-headers">
            <ul>
              {/* Render the column headers with sorting icons */}
              <li onClick={() => handleSort('albumName')}>
                Album {getSortIcon('albumName')}
              </li>
              <li onClick={() => handleSort('artist')}>
                Artist {getSortIcon('artist')}
              </li>
              <li onClick={() => handleSort('rating')}>
                Rating {getSortIcon('rating')}
              </li>
              <li onClick={() => handleSort('timestamp')}>
                Added {getSortIcon('timestamp')}
              </li>
            </ul>
          </nav>
          <nav>
            <ul>
              {/* Render the URL list with album information in the <ul> element */}
              {displayList.map((data) => (
                <li key={data.url}>
                  <a href={data.url} target="_blank" rel="noopener noreferrer">
                    {`${data.albumName} - ${data.artist}`}
                  </a>
                  {data.rating && <span>Rating: {data.rating}</span>}{' '}
                  {/* Display the album rating if available */}
                  {/* Add a button to delete the URL */}
                  <button
                    className="button-delete"
                    onClick={() => handleDelete(data.url)}
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <div className="warning-message">
          <p>Are you sure you want to clear your BackLog?</p>
          <p>This action cannot be undone.</p>
          <button className="button-backlog-clear" onClick={handleConfirmClear}>
            Yes
          </button>
          <button className="button-backlog-cancel" onClick={handleCancelClear}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Popup;
