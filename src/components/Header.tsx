import React from 'react';

interface HeaderProps {
  musicFolderPath: string | null;
  isScanning: boolean;
  scanProgress: number;
  onSelectFolder: () => void;
  onScan: () => void;
  onRescan: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  musicFolderPath,
  isScanning,
  scanProgress,
  onSelectFolder,
  onScan,
  onRescan 
}) => {
  return (
    <div className="card">
      <h2 className="section-title">Settings</h2>
      <div className="settings-controls">
        <input
          type="text"
          readOnly
          value={musicFolderPath || "No music folder selected"}
          className="folder-input"
        />
        <button onClick={onSelectFolder} className="btn btn-folder">
          Select Folder
        </button>
        <button
          onClick={onScan}
          disabled={isScanning || !musicFolderPath}
          className={`btn btn-scan ${isScanning ? "disabled" : ""}`}
        >
          {isScanning
            ? `Scanning... ${scanProgress.toFixed(1)}%`
            : "Scan Library"}
        </button>
        <button
          onClick={onRescan}
          disabled={isScanning || !musicFolderPath}
          className={`btn btn-rescan ${isScanning ? "disabled" : ""}`}
        >
          Rescan Library
        </button>
      </div>
    </div>
  );
};

export default Header;
