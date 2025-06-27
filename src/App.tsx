import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import Welcome from "./components/Welcome";
import Header from "./components/Header";
import MusicLibrary from "./components/MusicLibrary";
import AlbumView from "./components/AlbumView";
import { Album, SongInfo } from "./types";
import "./App.css";

function App() {
  const [musicFolderPath, setMusicFolderPath] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumSongs, setAlbumSongs] = useState<SongInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const showTemporaryNotification = useCallback((message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    const timer = setTimeout(() => {
      setShowNotification(false);
      setNotificationMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchFolderPath = async () => {
      try {
        const path: string | null = await invoke("get_music_folder_path");
        setMusicFolderPath(path);
        if (path) {
          scanLibrary(path);
        }
      } catch (error) {
        console.error("Failed to get music folder path:", error);
        showTemporaryNotification(`Error fetching folder path: ${error}`);
      }
    };
    fetchFolderPath();
  }, [showTemporaryNotification]);

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
        await fetchAlbums();
      });
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenComplete) unlistenComplete();
    };
  }, [showTemporaryNotification, fetchAlbums]);

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
    const interval = setInterval(fetchScanStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

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
        scanLibrary(selectedPath);
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
      showTemporaryNotification(`Error selecting folder: ${error}`);
    }
  };

  const scanLibrary = async (path: string) => {
    setIsScanning(true);
    setScanProgress(0);
    try {
      await invoke("scan_music_library", { folderPath: path });
      showTemporaryNotification("Music library scan started!");
    } catch (error) {
      console.error("Failed to start scan:", error);
      setIsScanning(false);
      showTemporaryNotification(`Error starting scan: ${error}`);
    }
  };

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

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setAlbumSongs([]);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

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
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, performSearch]);

  return (
    <div className="app-container">
      {showNotification && (
        <div className="notification">{notificationMessage}</div>
      )}

      <h1 className="app-title">MusicThing</h1>

      {!musicFolderPath ? (
        <Welcome onFolderSelect={selectMusicFolder} />
      ) : (
        <>
          <Header 
            musicFolderPath={musicFolderPath}
            isScanning={isScanning}
            scanProgress={scanProgress}
            onSelectFolder={selectMusicFolder}
            onScan={() => scanLibrary(musicFolderPath)}
            onRescan={rescanLibrary}
          />
          {selectedAlbum ? (
            <AlbumView 
              selectedAlbum={selectedAlbum} 
              albumSongs={albumSongs} 
              onBack={handleBackToAlbums} 
            />
          ) : (
            <MusicLibrary 
              albums={albums} 
              onAlbumClick={handleAlbumClick} 
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              searchResults={searchResults}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
