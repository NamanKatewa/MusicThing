// src/App.tsx
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";
import { SongInfo } from "./types";

function App() {
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");

  const handleScanMusic = async () => {
    setLoading(true);
    setError(null);
    setSongs([]);

    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Select your music folder",
      });

      if (selectedPath) {
        const path = Array.isArray(selectedPath)
          ? selectedPath[0]
          : (selectedPath as string);
        setFolderPath(path);

        const scannedSongs = await invoke<SongInfo[]>("scan_music_folder", {
          folderPath: path,
        });

        setSongs(scannedSongs);
      } else {
        setError("No folder selected.");
      }
    } catch (e) {
      console.error("Error scanning music folder:", e);
      setError(`Failed to scan folder: ${(e as Error).message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Music Player</h1>

      <button onClick={handleScanMusic} disabled={loading}>
        {loading
          ? "Scanning..."
          : `Scan Music Folder ${folderPath ? `(${folderPath})` : ""}`}
      </button>

      {error && <p className="error-message">Error: {error}</p>}

      {loading && <p>Loading songs...</p>}

      {!loading && songs.length === 0 && folderPath && !error && (
        <p>No FLAC songs found in the selected folder.</p>
      )}

      {songs.length > 0 && (
        <>
          <h2>Scanned Songs ({songs.length})</h2>
          <div className="song-list">
            {songs.map((song) => (
              <div key={song.path} className="song-item">
                <div className="cover-art">
                  {song.cover_art_base64 ? (
                    <img
                      src={`data:image/jpeg;base64,${song.cover_art_base64}`}
                      alt={`${song.title} album cover`}
                    />
                  ) : (
                    <div className="no-cover">No Cover</div>
                  )}
                </div>
                <div className="song-details">
                  <h3>{song.title}</h3>
                  <p>
                    <strong>Artist:</strong> {song.artist}
                  </p>
                  <p>
                    <strong>Album:</strong> {song.album}
                  </p>
                  {song.genre && (
                    <p>
                      <strong>Genre:</strong> {song.genre}
                    </p>
                  )}
                  {song.album_artist && (
                    <p>
                      <strong>Album Artist:</strong> {song.album_artist}
                    </p>
                  )}
                  {song.track_number && (
                    <p>
                      <strong>Track #:</strong> {song.track_number}
                    </p>
                  )}
                  {song.year && (
                    <p>
                      <strong>Year:</strong> {song.year}
                    </p>
                  )}
                  {song.label && (
                    <p>
                      <strong>Label:</strong> {song.label}
                    </p>
                  )}
                  <p>
                    <strong>Duration:</strong> {song.duration.toFixed(2)}s
                  </p>
                  <p>
                    <strong>Path:</strong> {song.path}
                  </p>
                  {song.lyrics_path && (
                    <p>
                      <strong>Lyrics:</strong>{" "}
                      <a
                        href={`file://${song.lyrics_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Lyrics
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
