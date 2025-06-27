export interface SongInfo {
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

export interface Album {
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