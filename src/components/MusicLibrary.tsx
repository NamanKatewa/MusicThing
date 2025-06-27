import React from 'react';
import { Album } from '../types';

interface MusicLibraryProps {
  albums: Album[];
  onAlbumClick: (album: Album) => void;
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: Album[];
}

const MusicLibrary: React.FC<MusicLibraryProps> = ({ 
  albums, 
  onAlbumClick,
  searchQuery,
  onSearchChange,
  searchResults
}) => {
  return (
    <div className="card">
      <h2 className="section-title">Search Albums</h2>
      <input
        type="text"
        value={searchQuery}
        onChange={onSearchChange}
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
                onClick={() => onAlbumClick(album)}
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

      {searchQuery.trim() === "" && (
        <>
          <h2 className="section-title">All Albums</h2>
          {albums.length > 0 ? (
            <div className="album-grid">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="album-card"
                  onClick={() => onAlbumClick(album)}
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
  );
};

export default MusicLibrary;
