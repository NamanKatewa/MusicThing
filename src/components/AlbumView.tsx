import React from 'react';
import { Album, SongInfo } from '../types';

interface AlbumViewProps {
  selectedAlbum: Album;
  albumSongs: SongInfo[];
  onBack: () => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ selectedAlbum, albumSongs, onBack }) => {
  return (
    <div className="card">
      <button onClick={onBack} className="btn btn-back">
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
    </div>
  );
};

export default AlbumView;
