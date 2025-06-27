use crate::models::{Album, SongInfo};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use lofty::prelude::*;
use lofty::{picture::PictureType, read_from_path};
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;
use walkdir::WalkDir;

pub async fn initialize_database(
    db_path: &Path,
) -> Result<SqlitePool, Box<dyn std::error::Error + Send + Sync>> {
    let db_url = format!("sqlite:{}", db_path.display());

    println!("Initializing database at: {}", db_url);

    // Create the database file if it doesn't exist
    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        println!("Creating new database file");
        Sqlite::create_database(&db_url).await?;
    }

    // Connect to the database
    let pool = SqlitePool::connect(&db_url).await?;

    // Create tables
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            year TEXT,
            genre TEXT,
            cover_art_base64 TEXT,
            song_count INTEGER DEFAULT 0,
            total_duration REAL DEFAULT 0.0,
            folder_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(title, artist, folder_path)
        );
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT NOT NULL,
            genre TEXT,
            duration REAL DEFAULT 0.0,
            path TEXT NOT NULL UNIQUE,
            lyrics_path TEXT,
            album_artist TEXT,
            year TEXT,
            label TEXT,
            track_number TEXT,
            file_modified_time INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(&pool)
    .await?;

    // Create indexes for better performance
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_albums_artist_title ON albums(artist, title);")
        .execute(&pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);")
        .execute(&pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_songs_path ON songs(path);")
        .execute(&pool)
        .await?;

    println!("Database initialized successfully");
    Ok(pool)
}

pub async fn scan_music_folder(
    folder_path: String,
    db_pool: SqlitePool,
    scan_progress: Arc<RwLock<f32>>,
    app_handle: AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Clear existing data for this folder path
    sqlx::query("DELETE FROM albums WHERE folder_path = ?")
        .bind(&folder_path)
        .execute(&db_pool)
        .await?;

    // Collect all FLAC files first for progress tracking
    let flac_files: Vec<_> = WalkDir::new(&folder_path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| {
            e.path()
                .extension()
                .map(|s| s.to_ascii_lowercase() == "flac")
                .unwrap_or(false)
        })
        .collect();

    let total_files = flac_files.len() as f32;

    // Group songs by album for efficient processing
    let mut albums_map: HashMap<String, (Album, Vec<SongInfo>)> = HashMap::new();

    for (index, entry) in flac_files.iter().enumerate() {
        let path = entry.path();

        // Update progress
        let processed_files = index as f32;
        let progress = if total_files > 0.0 {
            (processed_files / total_files) * 100.0
        } else {
            0.0
        };

        {
            let mut prog = scan_progress.write().await;
            *prog = progress;
        }

        // Emit progress event to frontend
        let _ = app_handle.emit("scan_progress", progress);

        let mut song_info = process_audio_file(path).await?;

        // Create album key (artist + album + folder)
        let album_folder = path.parent().unwrap_or(Path::new("")).display().to_string();
        let album_key = format!(
            "{}||{}||{}",
            song_info.album_artist.as_ref().unwrap_or(&song_info.artist),
            song_info.album,
            album_folder
        );

        // Add to albums map or update existing
        match albums_map.get_mut(&album_key) {
            Some((album, songs)) => {
                // Update album duration
                album.total_duration += song_info.duration;
                album.song_count += 1;

                // Use cover art from song if album doesn't have one
                if album.cover_art_base64.is_none() && song_info.cover_art_base64.is_some() {
                    album.cover_art_base64 = song_info.cover_art_base64.clone();
                }

                // Remove cover art from song to save space
                song_info.cover_art_base64 = None;
                songs.push(song_info);
            }
            None => {
                // Create new album
                let cover_art = song_info.cover_art_base64.clone();
                song_info.cover_art_base64 = None; // Remove from song to save space

                let album = Album {
                    id: 0, // Will be set when inserted
                    title: song_info.album.clone(),
                    artist: song_info
                        .album_artist
                        .clone()
                        .unwrap_or_else(|| song_info.artist.clone()),
                    year: song_info.year.clone(),
                    genre: song_info.genre.clone(),
                    cover_art_base64: cover_art,
                    song_count: 1,
                    total_duration: song_info.duration,
                    folder_path: album_folder,
                };

                albums_map.insert(album_key, (album, vec![song_info]));
            }
        }
    }

    // Insert albums and songs into database
    for (_, (mut album, songs)) in albums_map {
        // Insert album
        let album_id = sqlx::query(
            r#"
            INSERT INTO albums (title, artist, year, genre, cover_art_base64, song_count, total_duration, folder_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&album.title)
        .bind(&album.artist)
        .bind(&album.year)
        .bind(&album.genre)
        .bind(&album.cover_art_base64)
        .bind(album.song_count)
        .bind(album.total_duration)
        .bind(&album.folder_path)
        .execute(&db_pool)
        .await?
        .last_insert_rowid();

        album.id = album_id;

        // Insert songs for this album
        for song in songs {
            let file_modified_time = fs::metadata(&song.path)
                .ok()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64);

            sqlx::query(
                r#"
                INSERT OR REPLACE INTO songs (
                    album_id, title, artist, album, genre, duration, path, 
                    lyrics_path, album_artist, year, label, track_number, file_modified_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(album_id)
            .bind(&song.title)
            .bind(&song.artist)
            .bind(&song.album)
            .bind(&song.genre)
            .bind(song.duration)
            .bind(&song.path)
            .bind(&song.lyrics_path)
            .bind(&song.album_artist)
            .bind(&song.year)
            .bind(&song.label)
            .bind(&song.track_number)
            .bind(file_modified_time)
            .execute(&db_pool)
            .await?;
        }
    }

    // Final progress update
    {
        let mut prog = scan_progress.write().await;
        *prog = 100.0;
    }
    let _ = app_handle.emit("scan_complete", ());

    Ok(())
}

async fn process_audio_file(
    path: &Path,
) -> Result<SongInfo, Box<dyn std::error::Error + Send + Sync>> {
    let mut info = SongInfo::default();
    info.path = path.display().to_string();

    // Get file duration
    if let Ok(file) = read_from_path(path) {
        info.duration = file.properties().duration().as_secs_f32();

        if let Some(tag) = file.primary_tag() {
            // Handle Cow<str> types properly
            info.title = tag
                .title()
                .map(|t| t.to_string())
                .unwrap_or_else(|| "Unknown".to_string());
            info.artist = tag
                .artist()
                .map(|a| a.to_string())
                .unwrap_or_else(|| "Unknown".to_string());
            info.album = tag
                .album()
                .map(|a| a.to_string())
                .unwrap_or_else(|| "Unknown".to_string());
            info.genre = tag.genre().map(|g| g.to_string());

            // Process all tag items
            for item in tag.items() {
                if let Some(value_str) = item.value().text() {
                    match item.key() {
                        ItemKey::TrackArtist => info.artist = value_str.to_string(),
                        ItemKey::AlbumArtist => info.album_artist = Some(value_str.to_string()),
                        ItemKey::AlbumTitle => info.album = value_str.to_string(),
                        ItemKey::Genre => info.genre = Some(value_str.to_string()),
                        ItemKey::Year => info.year = Some(value_str.to_string()),
                        ItemKey::Label => info.label = Some(value_str.to_string()),
                        ItemKey::TrackNumber => info.track_number = Some(value_str.to_string()),
                        _ => {}
                    }
                }
            }

            // Extract cover art
            if let Some(picture) = tag
                .pictures()
                .iter()
                .find(|p| p.pic_type() == PictureType::CoverFront)
            {
                info.cover_art_base64 = Some(STANDARD.encode(picture.data()));
            }
        }
    }

    // Look for external cover art if not found in tags
    if info.cover_art_base64.is_none() {
        if let Some(parent_dir) = path.parent() {
            for cover_name in &["cover.jpg", "cover.png", "folder.jpg", "album.jpg"] {
                let cover_path = parent_dir.join(cover_name);
                if cover_path.exists() {
                    if let Ok(bytes) = fs::read(&cover_path) {
                        info.cover_art_base64 = Some(STANDARD.encode(&bytes));
                        break;
                    }
                }
            }
        }
    }

    // Look for lyrics file
    let lrc_path = path.with_extension("lrc");
    if lrc_path.exists() {
        info.lyrics_path = Some(lrc_path.display().to_string());
    }

    Ok(info)
}
