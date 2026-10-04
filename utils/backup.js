export const importBacklogFile = async (file) => {
  const backup = JSON.parse(await file.text());
  if (
    !backup ||
    backup.format !== 'backlog-export' ||
    backup.version !== 1 ||
    !Array.isArray(backup.entries)
  ) {
    throw new Error('This is not a supported BackLog export file.');
  }

  const importedEntries = backup.entries.map((entry) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry) ||
      typeof entry.url !== 'string'
    ) {
      throw new Error('The file contains an invalid album entry.');
    }
    const albumUrl = new URL(entry.url);
    if (
      !['http:', 'https:'].includes(albumUrl.protocol) ||
      !(
        albumUrl.hostname === 'rateyourmusic.com' ||
        albumUrl.hostname.endsWith('.rateyourmusic.com')
      )
    ) {
      throw new Error('The file contains an invalid Rate Your Music URL.');
    }
    return entry;
  });

  const storedEntries = JSON.parse(localStorage.getItem('urlList') || '[]');
  if (
    !Array.isArray(storedEntries) ||
    storedEntries.some((entry) => !entry || typeof entry.url !== 'string')
  ) {
    throw new Error('Your current BackLog data could not be read.');
  }

  const mergedEntries = new Map(
    storedEntries.map((entry) => [entry.url, entry])
  );
  const importedByUrl = new Map(
    importedEntries.map((entry) => [entry.url, entry])
  );
  let updatedCount = 0;
  importedByUrl.forEach((entry, url) => {
    if (mergedEntries.has(url)) updatedCount += 1;
    mergedEntries.set(url, entry);
  });

  const entries = Array.from(mergedEntries.values());
  localStorage.setItem('urlList', JSON.stringify(entries));
  return {
    importedCount: importedByUrl.size,
    newCount: importedByUrl.size - updatedCount,
    updatedCount,
    entries,
  };
};
