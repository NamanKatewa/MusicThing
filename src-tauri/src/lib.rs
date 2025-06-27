pub mod metadata;
pub mod models;

use metadata::scanner::{initialize_database, scan_music_folder};
use models::{Album, AppState};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_store::{Store, StoreBuilder};
use tokio::sync::RwLock;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_handle: AppHandle<tauri::Wry> = app.handle().clone();

            tauri::async_runtime::block_on(async {
                let app_data_base_dir = app_handle.path().app_data_dir().map_err(|_| {
                    std::io::Error::new(
                        std::io::ErrorKind::Other,
                        "Could not get app data directory",
                    )
                })?;

                std::fs::create_dir_all(&app_data_base_dir)?;

                let settings_store_path = app_data_base_dir.join("settings.dat");
                let store = StoreBuilder::<tauri::Wry>::new(&app_handle, &settings_store_path)
                    .build()
                    .map_err(|e| {
                        std::io::Error::new(
                            std::io::ErrorKind::Other,
                            format!("Failed to build settings store: {}", e),
                        )
                    })?;

                if settings_store_path.exists() {
                    store.reload().map_err(|e| {
                        std::io::Error::new(
                            std::io::ErrorKind::Other,
                            format!("Failed to reload settings store: {}", e),
                        )
                    })?;
                }

                let db_path = app_data_base_dir.join("music.db");
                if let Some(parent) = db_path.parent() {
                    std::fs::create_dir_all(parent)?;
                }

                let db_pool = initialize_database(&db_path).await?;
                let app_state = AppState {
                    db_pool,
                    is_scanning: Arc::new(RwLock::new(false)),
                    scan_progress: Arc::new(RwLock::new(0.0)),
                };

                app.manage(store);
                app.manage(app_state);

                Ok(())
            })
            .map_err(
                |e: Box<dyn std::error::Error + Send + Sync>| -> Box<dyn std::error::Error> { e },
            )
        })
        .invoke_handler(tauri::generate_handler![
            get_music_folder_path,
            set_music_folder_path,
            scan_music_library,
            get_albums,
            get_album_songs,
            get_scan_status,
            rescan_library,
            search_albums,
            get_album_by_id
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn get_music_folder_path(
    settings_store: State<'_, Store<tauri::Wry>>,
) -> Result<Option<String>, String> {
    let value = settings_store.inner().get("music_folder_path".to_string());
    Ok(value.and_then(|v| v.as_str().map(|s| s.to_string())))
}

#[tauri::command]
async fn set_music_folder_path(
    path: String,
    settings_store: State<'_, Store<tauri::Wry>>,
) -> Result<(), String> {
    settings_store.inner().set(
        "music_folder_path".to_string(),
        serde_json::Value::String(path),
    );

    settings_store.inner().save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn scan_music_library(
    folder_path: String,
    app_state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    {
        let is_scanning = app_state.is_scanning.read().await;
        if *is_scanning {
            return Err("Scan already in progress".to_string());
        }
    }

    {
        let mut is_scanning = app_state.is_scanning.write().await;
        *is_scanning = true;
        let mut progress = app_state.scan_progress.write().await;
        *progress = 0.0;
    }

    let db_pool = app_state.db_pool.clone();
    let is_scanning = app_state.is_scanning.clone();
    let scan_progress = app_state.scan_progress.clone();

    tokio::spawn(async move {
        let result =
            scan_music_folder(folder_path, db_pool, scan_progress.clone(), app_handle).await;

        {
            let mut scanning = is_scanning.write().await;
            *scanning = false;
        }

        if let Err(e) = result {
            eprintln!("Scan error: {}", e);
        }
    });

    Ok(())
}

/// Get all albums from database
#[tauri::command]
async fn get_albums(
    app_state: State<'_, AppState>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<Album>, String> {
    use sqlx::Row;

    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let query = r#"
        SELECT 
            id, title, artist, year, genre, cover_art_base64, 
            song_count, total_duration, folder_path
        FROM albums 
        ORDER BY artist, title 
        LIMIT ? OFFSET ?
    "#;

    let rows = sqlx::query(query)
        .bind(limit)
        .bind(offset)
        .fetch_all(&app_state.db_pool)
        .await
        .map_err(|e| e.to_string())?;

    let albums = rows
        .into_iter()
        .map(|row| Album {
            id: row.get("id"),
            title: row.get("title"),
            artist: row.get("artist"),
            year: row.get("year"),
            genre: row.get("genre"),
            cover_art_base64: row.get("cover_art_base64"),
            song_count: row.get("song_count"),
            total_duration: row.get("total_duration"),
            folder_path: row.get("folder_path"),
        })
        .collect();

    Ok(albums)
}

/// Get songs for a specific album
#[tauri::command]
async fn get_album_songs(
    album_id: i64,
    app_state: State<'_, AppState>,
) -> Result<Vec<crate::models::SongInfo>, String> {
    use sqlx::Row;

    let query = r#"
        SELECT 
            id, title, artist, album, genre, duration, path, 
            lyrics_path, album_artist, year, label, track_number
        FROM songs 
        WHERE album_id = ? 
        ORDER BY track_number, title
    "#;

    let rows = sqlx::query(query)
        .bind(album_id)
        .fetch_all(&app_state.db_pool)
        .await
        .map_err(|e| e.to_string())?;

    let songs = rows
        .into_iter()
        .map(|row| crate::models::SongInfo {
            id: Some(row.get("id")),
            title: row.get("title"),
            artist: row.get("artist"),
            album: row.get("album"),
            genre: row.get("genre"),
            duration: row.get("duration"),
            path: row.get("path"),
            lyrics_path: row.get("lyrics_path"),
            cover_art_base64: None, // Don't load cover art for individual songs
            album_artist: row.get("album_artist"),
            year: row.get("year"),
            label: row.get("label"),
            track_number: row.get("track_number"),
        })
        .collect();

    Ok(songs)
}

/// Get current scan status
#[tauri::command]
async fn get_scan_status(app_state: State<'_, AppState>) -> Result<(bool, f32), String> {
    let is_scanning = *app_state.is_scanning.read().await;
    let progress = *app_state.scan_progress.read().await;
    Ok((is_scanning, progress))
}

/// Rescan the music library
#[tauri::command]
async fn rescan_library(
    app_state: State<'_, AppState>,
    settings_store: State<'_, Store<tauri::Wry>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Get the saved folder path
    let folder_path = match settings_store.inner().get("music_folder_path".to_string()) {
        Some(value) => value.as_str().map(|s| s.to_string()),
        None => None,
    };

    match folder_path {
        Some(path) => scan_music_library(path, app_state, app_handle).await,
        None => Err("No music folder path configured".to_string()),
    }
}

/// Search albums by title or artist
#[tauri::command]
async fn search_albums(
    query: String,
    app_state: State<'_, AppState>,
    limit: Option<u32>,
) -> Result<Vec<Album>, String> {
    use sqlx::Row;

    let limit = limit.unwrap_or(20);
    let search_query = format!("%{}%", query);

    let sql = r#"
        SELECT 
            id, title, artist, year, genre, cover_art_base64, 
            song_count, total_duration, folder_path
        FROM albums 
        WHERE title LIKE ? OR artist LIKE ?
        ORDER BY artist, title 
        LIMIT ?
    "#;

    let rows = sqlx::query(sql)
        .bind(&search_query)
        .bind(&search_query)
        .bind(limit)
        .fetch_all(&app_state.db_pool)
        .await
        .map_err(|e| e.to_string())?;

    let albums = rows
        .into_iter()
        .map(|row| Album {
            id: row.get("id"),
            title: row.get("title"),
            artist: row.get("artist"),
            year: row.get("year"),
            genre: row.get("genre"),
            cover_art_base64: row.get("cover_art_base64"),
            song_count: row.get("song_count"),
            total_duration: row.get("total_duration"),
            folder_path: row.get("folder_path"),
        })
        .collect();

    Ok(albums)
}

/// Get a specific album by ID
#[tauri::command]
async fn get_album_by_id(
    album_id: i64,
    app_state: State<'_, AppState>,
) -> Result<Option<Album>, String> {
    use sqlx::Row;

    let query = r#"
        SELECT 
            id, title, artist, year, genre, cover_art_base64, 
            song_count, total_duration, folder_path
        FROM albums 
        WHERE id = ?
    "#;

    let row = sqlx::query(query)
        .bind(album_id)
        .fetch_optional(&app_state.db_pool)
        .await
        .map_err(|e| e.to_string())?;

    let album = row.map(|row| Album {
        id: row.get("id"),
        title: row.get("title"),
        artist: row.get("artist"),
        year: row.get("year"),
        genre: row.get("genre"),
        cover_art_base64: row.get("cover_art_base64"),
        song_count: row.get("song_count"),
        total_duration: row.get("total_duration"),
        folder_path: row.get("folder_path"),
    });

    Ok(album)
}
