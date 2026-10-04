import React, { useState } from 'react';
import './Options.css';
import '../Popup/themes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { importBacklogFile } from '../../../utils/backup';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const [theme] = useState(
    () => localStorage.getItem('backlogTheme') || 'midnight'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const importFile = async (file: File) => {
    try {
      const result = await importBacklogFile(file);
      setStatus({
        message: `Imported ${result.importedCount} albums (${result.newCount} new, ${result.updatedCount} updated).`,
        type: 'success',
      });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : 'Could not import this file.',
        type: 'error',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) void importFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void importFile(file);
  };

  return (
    <main className="OptionsContainer">
      <div className="options-content">
        <header className="options-header">
          <p className="options-eyebrow">BACKLOG / DATA</p>
          <h1>{title}</h1>
        </header>
        <section
          className="backup-import-panel"
          aria-label="Import BackLog JSON"
        >
          <div
            className={`backup-import-dropzone ${
              isDragging ? 'drag-active' : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <FontAwesomeIcon icon={faUpload} />
            <h2>Import a backup</h2>
            <p>Choose a BackLog JSON file or drop it here.</p>
            <input
              ref={fileInputRef}
              id="backlog-backup-file"
              className="backup-import-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
            />
            <button
              className="backup-import-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose JSON file
            </button>
          </div>
          {status && (
            <p className={`backup-import-status ${status.type}`} role="status">
              {status.message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Options;
