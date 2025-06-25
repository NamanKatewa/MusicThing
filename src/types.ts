export interface SongInfo {
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
