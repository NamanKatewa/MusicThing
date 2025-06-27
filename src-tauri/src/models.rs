use serde::Serialize;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Serialize, Clone, Debug)]
pub struct SongInfo {
    pub id: Option<i64>,
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
            id: None,
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

#[derive(Serialize, Clone, Debug)]
pub struct Album {
    pub id: i64,
    pub title: String,
    pub artist: String,
    pub year: Option<String>,
    pub genre: Option<String>,
    pub cover_art_base64: Option<String>,
    pub song_count: u32,
    pub total_duration: f32,
    pub folder_path: String,
}

#[derive(Clone)]
pub struct AppState {
    pub db_pool: SqlitePool,
    pub is_scanning: Arc<RwLock<bool>>,
    pub scan_progress: Arc<RwLock<f32>>,
}

#[derive(Serialize)]
pub struct ScanProgress {
    pub is_scanning: bool,
    pub progress: f32,
    pub current_file: Option<String>,
    pub total_files: Option<u32>,
    pub processed_files: Option<u32>,
}
