import React, { useState } from 'react';
import './Popup.css';
import Fuse from 'fuse.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import 'font-awesome/css/font-awesome.min.css';

const Popup = () => {
  const [activeTabData, setActiveTabData] = React.useState(null);
  const [urlList, setUrlList] = React.useState([]);
  const [showWarning, setShowWarning] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState('recentlyAdded');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isBackLogged, setIsBackLogged] = React.useState(false);
  const [initialUrlListLength, setInitialUrlListLength] = React.useState(0);
  const [displayList, setDisplayList] = React.useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);

  React.useEffect(() => {
    // Load the URL list from localStorage when the popup opens
    const storedUrlList = localStorage.getItem('urlList');
    if (storedUrlList) {
      setUrlList(JSON.parse(storedUrlList));
      setInitialUrlListLength(JSON.parse(storedUrlList).length);
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
        const { url, imageUrl, albumName, artist, genre, rating } = message;
        setActiveTabData({ url, imageUrl, albumName, artist, genre, rating });

        // Check if the URL is already present in localStorage
        const storedUrlList = JSON.parse(localStorage.getItem('urlList')) || [];
        const existingItem = storedUrlList.find((item) => item.url === url);

        if (!existingItem) {
          // If the URL is not present, add it along with the current timestamp
          const currentTime = new Date().getTime();
          const newItem = {
            url,
            imageUrl,
            albumName,
            artist,
            genre,
            rating,
            timestamp: currentTime,
          };
          const newUrlList = [...storedUrlList, newItem];

          // Save the updated URL list to localStorage
          localStorage.setItem('urlList', JSON.stringify(newUrlList));
          setUrlList(newUrlList);
          // Set "BackLogged" state to true if the URL list got larger
          if (newUrlList.length > initialUrlListLength) {
            setIsBackLogged(true);
          }
        } else {
          // If the URL is already present, update the timestamp
          existingItem.timestamp = new Date().getTime();

          // Save the updated URL list to localStorage
          localStorage.setItem('urlList', JSON.stringify(storedUrlList));
          setUrlList(storedUrlList);
        }
      }
    });
  }, [initialUrlListLength]);

  React.useEffect(() => {
    // Save the sorting preferences to localStorage whenever they change
    localStorage.setItem('sortColumn', sortColumn);
    localStorage.setItem('sortOrder', sortOrder);
  }, [sortColumn, sortOrder]);

  React.useEffect(() => {
    // Reset the "BackLogged" state after 5 seconds
    if (isBackLogged) {
      const timeoutId = setTimeout(() => {
        setIsBackLogged(false);
      }, 5000);

      return () => {
        // Clear the timeout to prevent it from triggering after component unmounts
        clearTimeout(timeoutId);
      };
    }
  }, [isBackLogged]);

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
            const { url, imageUrl, albumName, artist, genre, rating } =
              response;
            setActiveTabData({
              url,
              imageUrl,
              albumName,
              artist,
              genre,
              rating,
            });

            // Check if the URL is already present in localStorage
            const storedUrlList =
              JSON.parse(localStorage.getItem('urlList')) || [];
            const existingItem = storedUrlList.find((item) => item.url === url);

            if (!existingItem) {
              // If the URL is not present, add it along with the current timestamp
              const currentTime = new Date().getTime();
              const newItem = {
                url,
                imageUrl,
                albumName,
                artist,
                genre,
                rating,
                timestamp: currentTime,
              };
              const newUrlList = [...storedUrlList, newItem];

              // Save the updated URL list to localStorage
              localStorage.setItem('urlList', JSON.stringify(newUrlList));
              setUrlList(newUrlList);

              // Set "BackLogged" state to true if the URL list got larger
              if (newUrlList.length > initialUrlListLength) {
                setIsBackLogged(true);
              }
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

  const handleLucky = () => {
    // Ensure there are URLs in the list
    if (urlList.length > 0) {
      // Generate a random index within the range of urlList
      const randomIndex = Math.floor(Math.random() * urlList.length);

      // Get the URL at the random index
      const randomUrl = urlList[randomIndex].url;

      // Redirect the user to the selected URL
      window.open(randomUrl, '_blank');
    } else {
      // Handle the case when the URL list is empty
      console.log('No URLs to choose from.');
    }
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
        return sortOrder === 'desc' ? (
          <span className="absoluteArrow">&darr;</span>
        ) : (
          <span className="absoluteArrow">&uarr;</span>
        );
      } else {
        return sortOrder === 'asc' ? (
          <span className="absoluteArrow">&darr;</span>
        ) : (
          <span className="absoluteArrow">&uarr;</span>
        );
      }
    } else {
      return null;
    }
  };

  const fuseOptions = {
    keys: ['albumName', 'artist', 'genre'], // The properties to search through
    includeScore: true, // This will include the search score in the results
    threshold: 0.2, // Set a lower threshold to include only higher-scoring results
    distance: 100, // Set a lower distance to limit edit distance between query and results
  };

  const customSort = (a, b) => {
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

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);

    // Sort and update the displayList based on the search query
    const clonedList = [...urlList];
    const fuse = new Fuse(clonedList, fuseOptions);
    const searchResults = event.target.value
      ? fuse.search(event.target.value).map((result) => result.item)
      : urlList;
    const sortedList = [...searchResults];
    sortedList.sort(customSort);
    setDisplayList(sortedList);
  };

  React.useEffect(() => {
    // Save the sorting preferences to localStorage whenever they change
    localStorage.setItem('sortColumn', sortColumn);
    localStorage.setItem('sortOrder', sortOrder);
    // Sort and update the displayList based on the search query
    const clonedList = [...urlList];
    const fuse = new Fuse(clonedList, fuseOptions);
    const searchResults = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : urlList;
    const sortedList = [...searchResults];
    sortedList.sort(customSort);
    setDisplayList(sortedList);
  }, [sortColumn, sortOrder, urlList, searchQuery]);

  const sortedUrlList = React.useMemo(() => {
    // Clone the original URL list to avoid modifying it directly
    const sortedList = [...urlList];

    // Sort the list based on the selected column and sort order
    sortedList.sort(customSort);

    return sortedList;
  }, [urlList, sortColumn, sortOrder]);

  return (
    <div className="App">
      {/* Sticky header using CSS */}
      <h1
        className={`sticky-h1 h1-backlog ${isBackLogged ? 'backlogged' : ''}`}
      >
        {isBackLogged ? 'BackLogged!' : 'BackLog'}
      </h1>
      {!showWarning ? ( // <-- Hide everything behind warning message
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
          <div className="search-container">
            <input
              className="input-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
            />
            <div className="search-icon">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <button
              className="button-backlog-lucky"
              onClick={handleLucky}
              role="button"
            >
              I'm Feeling Lucky
            </button>
          </div>
          <nav className="column-headers">
            <ul>
              {/* Render the column headers with sorting icons */}
              <li onClick={() => handleSort('albumName')}>
                Album {getSortIcon('albumName')}
              </li>
              <li onClick={() => handleSort('artist')}>
                Artist {getSortIcon('artist')}
              </li>
              <li onClick={() => handleSort('genre')}>
                Genre {getSortIcon('genre')}
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
              <div className="grid-container">
                {/* Render the URL list with album information in the <ul> element */}
                {displayList.map((data) => (
                  <div
                    key={data.url}
                    className="grid-item"
                    onMouseEnter={() => setHoveredItem(data.url)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <a
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={data.imageUrl} height="150" width="150"></img>
                    </a>
                    <a
                      className="tall"
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {<span className="boldSpan">{data.albumName} </span>}
                    </a>
                    <a
                      className="tall"
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="italicsSpan">{data.artist}</span>
                    </a>
                    <a
                      className="tall"
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* Include the genre in the list item */}
                      {data.genre && <span>{data.genre}</span>}{' '}
                    </a>
                    <a
                      className="tall"
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* Display the album rating if available */}
                      {data.rating && (
                        <span className="removeTextDecoration">
                          Average: {data.rating}
                        </span>
                      )}{' '}
                    </a>
                    {/* Add a button to delete the URL */}
                    <button
                      className={`button-delete ${
                        hoveredItem === data.url ? 'show' : ''
                      }`}
                      onClick={() => handleDelete(data.url)}
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        style={{ color: '#FFFFFF' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
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
