import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface SongInfo {
  id?: number;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  duration: number;
  path: string;
  lyrics_path?: string;
  cover_art_base64?: string;
  album_artist?: string;
  year?: string;
  label?: string;
  track_number?: string;
}

interface Album {
  id: number;
  title: string;
  artist: string;
  year?: string;
  genre?: string;
  cover_art_base64?: string;
  song_count: number;
  total_duration: number;
  folder_path: string;
}

function App() {
  const [musicFolderPath, setMusicFolderPath] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumSongs, setAlbumSongs] = useState<SongInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [showNotification, setShowNotification] = useState(true);
  const [notificationMessage, setNotificationMessage] = useState(
    "Testing this toast notification"
  );

  const showTemporaryNotification = useCallback((message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    const timer = setTimeout(() => {
      setShowNotification(false);
      setNotificationMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial music folder path on component mount
  useEffect(() => {
    const fetchFolderPath = async () => {
      try {
        const path: string | null = await invoke("get_music_folder_path");
        setMusicFolderPath(path);
      } catch (error) {
        console.error("Failed to get music folder path:", error);
        showTemporaryNotification(`Error fetching folder path: ${error}`);
      }
    };
    fetchFolderPath();
  }, [showTemporaryNotification]);

  // Fetch albums when the component mounts or after a scan
  const fetchAlbums = useCallback(async () => {
    try {
      const fetchedAlbums: Album[] = await invoke("get_albums", {
        limit: 50,
        offset: 0,
      });
      setAlbums(fetchedAlbums);
    } catch (error) {
      console.error("Failed to fetch albums:", error);
      showTemporaryNotification(`Error fetching albums: ${error}`);
    }
  }, [showTemporaryNotification]);

  // Listen for scan progress and completion events
  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenComplete: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenProgress = await listen<number>("scan_progress", (event) => {
        setScanProgress(event.payload);
      });

      unlistenComplete = await listen<void>("scan_complete", async () => {
        setIsScanning(false);
        setScanProgress(100);
        showTemporaryNotification("Music library scan complete!");
        await fetchAlbums(); // Refresh albums after scan
      });
    };

    setupListeners();

    // Clean up listeners on component unmount
    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenComplete) unlistenComplete();
    };
  }, [showTemporaryNotification, fetchAlbums]);

  // Fetch scan status on component mount and periodically
  useEffect(() => {
    const fetchScanStatus = async () => {
      try {
        const [scanning, progress]: [boolean, number] = await invoke(
          "get_scan_status"
        );
        setIsScanning(scanning);
        setScanProgress(progress);
      } catch (error) {
        console.error("Failed to get scan status:", error);
      }
    };

    fetchScanStatus();
    const interval = setInterval(fetchScanStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Handle folder selection
  const selectMusicFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Select Music Folder",
      });
      if (selectedPath && typeof selectedPath === "string") {
        setMusicFolderPath(selectedPath);
        await invoke("set_music_folder_path", { path: selectedPath });
        showTemporaryNotification("Music folder path saved!");
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
      showTemporaryNotification(`Error selecting folder: ${error}`);
    }
  };

  // Handle scanning the music library
  const scanLibrary = async () => {
    if (!musicFolderPath) {
      showTemporaryNotification("Please select a music folder first.");
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    try {
      await invoke("scan_music_library", { folderPath: musicFolderPath });
      showTemporaryNotification("Music library scan started!");
    } catch (error) {
      console.error("Failed to start scan:", error);
      setIsScanning(false);
      showTemporaryNotification(`Error starting scan: ${error}`);
    }
  };

  // Handle rescanning the music library
  const rescanLibrary = async () => {
    if (!musicFolderPath) {
      showTemporaryNotification("No music folder path configured to rescan.");
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    try {
      await invoke("rescan_library");
      showTemporaryNotification("Music library rescan started!");
    } catch (error) {
      console.error("Failed to rescan library:", error);
      setIsScanning(false);
      showTemporaryNotification(`Error rescanning library: ${error}`);
    }
  };

  // Handle album click to view songs
  const handleAlbumClick = async (album: Album) => {
    setSelectedAlbum(album);
    try {
      const songs: SongInfo[] = await invoke("get_album_songs", {
        albumId: album.id,
      });
      setAlbumSongs(songs);
    } catch (error) {
      console.error("Failed to get album songs:", error);
      showTemporaryNotification(`Error fetching album songs: ${error}`);
    }
  };

  // Handle back to album list
  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setAlbumSongs([]);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Perform search
  const performSearch = useCallback(async () => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    try {
      const results: Album[] = await invoke("search_albums", {
        query: searchQuery,
        limit: 20,
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search albums:", error);
      showTemporaryNotification(`Error searching albums: ${error}`);
    }
  }, [searchQuery, showTemporaryNotification]);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch();
    }, 300); // Debounce search input
    return () => clearTimeout(handler);
  }, [searchQuery, performSearch]);

  return (
    <div className="app-container">
      {showNotification && (
        <div className="notification">{notificationMessage}</div>
      )}

      <h1 className="app-title">MusicThing</h1>

      <div className="card">
        <h2 className="section-title">Settings</h2>
        <div className="settings-controls">
          <input
            type="text"
            readOnly
            value={musicFolderPath || "No music folder selected"}
            className="folder-input"
          />
          <button onClick={selectMusicFolder} className="btn btn-folder">
            Select Folder
          </button>
          <button
            onClick={scanLibrary}
            disabled={isScanning || !musicFolderPath}
            className={`btn btn-scan ${isScanning ? "disabled" : ""}`}
          >
            {isScanning
              ? `Scanning... ${scanProgress.toFixed(1)}%`
              : "Scan Library"}
          </button>
          <button
            onClick={rescanLibrary}
            disabled={isScanning || !musicFolderPath}
            className={`btn btn-rescan ${isScanning ? "disabled" : ""}`}
          >
            Rescan Library
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Search Albums</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          placeholder="Search by album title or artist..."
        />
        {searchQuery.trim() !== "" && (
          <div className="album-grid">
            {searchResults.length > 0 ? (
              searchResults.map((album) => (
                <div
                  key={album.id}
                  className="album-card"
                  onClick={() => handleAlbumClick(album)}
                >
                  <img
                    src={
                      album.cover_art_base64
                        ? `data:image/jpeg;base64,${album.cover_art_base64}`
                        : `https://placehold.co/200x200/4A5568/CBD5E0?text=No+Cover`
                    }
                    alt={album.title}
                    className="album-cover"
                  />
                  <div className="album-info">
                    <h3>{album.title}</h3>
                    <div>
                      <p>{album.artist}</p>
                      <p className="album-year">{album.year}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">No albums found.</p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        {selectedAlbum ? (
          <>
            <button onClick={handleBackToAlbums} className="btn btn-back">
              ← Back to Albums
            </button>
            <div className="album-header">
              <img
                src={
                  selectedAlbum.cover_art_base64
                    ? `data:image/jpeg;base64,${selectedAlbum.cover_art_base64}`
                    : `https://placehold.co/150x150/4A5568/CBD5E0?text=No+Cover`
                }
                alt={selectedAlbum.title}
                className="album-detail-cover"
              />
              <div className="album-header-details">
                <h2>{selectedAlbum.title}</h2>
                <div>
                  <p>{selectedAlbum.artist}</p>
                  <p className="more">
                    <p> {selectedAlbum.year}</p>
                    <p>{selectedAlbum.song_count} songs</p>
                    <p>{(selectedAlbum.total_duration / 60).toFixed(1)} min</p>
                  </p>
                </div>
              </div>
            </div>
            <h3 className="section-title">Songs</h3>
            <div className="song-list">
              {albumSongs.length > 0 ? (
                albumSongs.map((song, index) => (
                  <div key={song.id || index} className="song-item">
                    <span className="song-index">
                      {song.track_number || index + 1}.
                    </span>
                    <div className="song-info">
                      <div>
                        <p className="song-title">{song.title}</p>
                        <p className="song-artist">{song.artist}</p>
                      </div>
                    </div>
                    <span className="song-duration">
                      {Math.floor(song.duration / 60)}:
                      {Math.floor(song.duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-message">No songs found for this album.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="section-title">All Albums</h2>
            {albums.length > 0 ? (
              <div className="album-grid">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="album-card"
                    onClick={() => handleAlbumClick(album)}
                  >
                    <img
                      src={
                        album.cover_art_base64
                          ? `data:image/jpeg;base64,${album.cover_art_base64}`
                          : `https://placehold.co/200x200/4A5568/CBD5E0?text=No+Cover`
                      }
                      alt={album.title}
                      className="album-cover"
                    />
                    <div className="album-info">
                      <h3>{album.title}</h3>
                      <div>
                        <p>{album.artist}</p>
                        <p className="album-year">{album.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">
                No albums found. Please select a music folder and scan your
                library.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
