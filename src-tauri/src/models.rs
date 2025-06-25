use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct SongInfo {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub genre: Option<String>,
    pub duration: f32,
    pub path: String,
    pub lyrics_path: Option<String>,
    pub cover_art_base64: Option<String>,
    pub album_artist: Option<String>,
    pub year: Option<String>,
    pub label: Option<String>,
    pub track_number: Option<String>,
}

impl Default for SongInfo {
    fn default() -> Self {
        SongInfo {
            title: "Unknown".into(),
            artist: "Unknown".into(),
            album: "Unknown".into(),
            genre: None,
            duration: 0.0,
            path: String::new(),
            lyrics_path: None,
            cover_art_base64: None,
            album_artist: None,
            year: None,
            label: None,
            track_number: None,
        }
    }
}
