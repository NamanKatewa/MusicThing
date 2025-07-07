# MusicThing

MusicThing is a desktop music player application built with Tauri, a framework for building cross-platform desktop applications using web technologies. It leverages a React frontend for the user interface and a Rust backend for handling music scanning, metadata extraction, and database management.

## Project Structure

The project is organized into two main parts:

-   **Frontend (`src/`):** Built with React and Vite, responsible for the user interface.
-   **Backend (`src-tauri/`):** Written in Rust, handles core application logic, including music library management, metadata processing, and interaction with the operating system.

```
C:/Users/naman/Documents/GitHub/MusicThing/
├───.gitattributes
├───.gitignore
├───index.html
├───package-lock.json
├───package.json             # Frontend dependencies and scripts
├───README.md                # This file
├───tsconfig.json
├───tsconfig.node.json
├───vite.config.ts
├───.git/
├───.vscode/
├───logs/
├───node_modules/
├───public/
│   ├───tauri.svg
│   └───vite.svg
├───src/                     # Frontend (React) source code
│   ├───App.css
│   ├───App.tsx
│   ├───main.tsx
│   ├───types.ts
│   ├───vite-env.d.ts
│   ├───assets/
│   │   └───react.svg
│   └───components/
│       ├───AlbumView.tsx
│       ├───Header.tsx
│       ├───MusicLibrary.tsx
│       └───Welcome.tsx
└───src-tauri/               # Rust backend (Tauri) source code
    ├───.gitignore
    ├───build.rs
    ├───Cargo.lock
    ├───Cargo.toml           # Rust dependencies and project metadata
    ├───tauri.conf.json      # Tauri application configuration
    ├───.settings/
    ├───capabilities/
    ├───gen/
    ├───icons/
    ├───src/                 # Rust source files
    │   ├───lib.rs
    │   ├───main.rs
    │   ├───models.rs
    │   └───metadata/
    │       ├───mod.rs
    │       └───scanner.rs
    └───target/
```

## Frontend (React with Vite)

The frontend is a standard React application bootstrapped with Vite.

-   **`package.json`**:
    -   `name`: `musicthing`
    -   `version`: `0.1.0`
    -   `type`: `module`
    -   **Scripts**:
        -   `dev`: Starts the Vite development server.
        -   `build`: Builds the React application for production.
        -   `preview`: Previews the production build.
        -   `tauri`: Executes Tauri CLI commands (e.g., `tauri dev` to run the app in development mode, `tauri build` to create a production build).
    -   **Dependencies**:
        -   `@tauri-apps/api`: Provides JavaScript utilities for interacting with the Tauri backend (e.g., invoking Rust commands, listening to events).
        -   `@tauri-apps/plugin-dialog`: Tauri plugin for native dialogs (e.g., file open/save dialogs).
        -   `@tauri-apps/plugin-opener`: Tauri plugin for opening URLs or files with default applications.
        -   `@tauri-apps/plugin-store`: Tauri plugin for persistent key-value storage.
        -   `react`, `react-dom`: Core React libraries.
    -   **Dev Dependencies**:
        -   `@tauri-apps/cli`: The Tauri command-line interface.
        -   `@types/react`, `@types/react-dom`: TypeScript type definitions for React.
        -   `@vitejs/plugin-react`: Vite plugin for React support.
        -   `typescript`: TypeScript compiler.
        -   `vite`: Fast build tool and development server.

## Backend (Rust with Tauri)

The backend is written in Rust and uses the Tauri framework to provide desktop-specific functionalities and interact with the operating system.

### `src-tauri/Cargo.toml`

This file defines the Rust project's metadata and dependencies.

-   **`[package]`**:
    -   `name`: `musicthing`
    -   `version`: `0.1.0`
    -   `description`: "A Tauri App"
    -   `authors`: ["you"]
    -   `edition`: `2021` (Rust edition)
    -   `default-run`: `musicthing` (specifies the default binary to run)
-   **`[lib]`**:
    -   `name`: `musicthing_lib`: This defines a library crate. The `_lib` suffix is used to avoid naming conflicts with the binary crate, especially on Windows.
    -   `crate-type`: `["staticlib", "cdylib", "rlib"]`: Specifies the types of library artifacts to produce.
        -   `staticlib`: A static library.
        -   `cdylib`: A C-compatible dynamic library (useful for FFI).
        -   `rlib`: A Rust library (default for Rust dependencies).
-   **`[build-dependencies]`**:
    -   `tauri-build`: Used for build-time operations specific to Tauri, such as generating code from `tauri.conf.json`.
-   **`[dependencies]`**:
    -   `tauri`: The core Tauri framework.
    -   `tauri-plugin-opener`: Rust counterpart for the `opener` plugin.
    -   `serde`: Serialization/deserialization framework. `features = ["derive"]` enables automatic `Serialize` and `Deserialize` trait implementations.
    -   `serde_json`: JSON serialization/deserialization.
    -   `rodio`: A Rust audio playback library.
    -   `symphonia`: A multimedia framework for decoding audio, with `flac` feature enabled for FLAC support.
    -   `walkdir`: For recursively walking a directory tree (used for scanning music files).
    -   `base64`: For Base64 encoding/decoding (used for cover art).
    -   `lofty`: A library for reading and writing audio metadata (tags) from various file formats.
    -   `tauri-plugin-dialog`: Rust counterpart for the `dialog` plugin.
    -   `tauri-plugin-store`: Rust counterpart for the `store` plugin.
    -   `sqlx`: An asynchronous SQL toolkit for Rust.
        -   `version = "0.8.6"`
        -   `features = ["runtime-tokio-rustls", "sqlite", "chrono", "migrate"]`:
            -   `runtime-tokio-rustls`: Specifies the Tokio runtime with Rustls for TLS.
            -   `sqlite`: Enables SQLite database support.
            -   `chrono`: Integrates with the `chrono` crate for date/time handling.
            -   `migrate`: Enables database migration capabilities.
    -   `tokio`: An asynchronous runtime for Rust. `features = ["full"]` enables all features, including I/O, networking, and time.

### `src-tauri/tauri.conf.json`

This file configures the Tauri application's behavior and build process.

-   `$schema`: Reference to the Tauri configuration schema.
-   `productName`: The name of the application.
-   `version`: Application version.
-   `identifier`: Unique application identifier (e.g., for macOS bundle ID, Windows AppUserModelID).
-   **`build`**:
    -   `beforeDevCommand`: Command to run before starting the development server (`npm run dev`).
    -   `devUrl`: URL of the frontend development server (`http://localhost:1420`).
    -   `beforeBuildCommand`: Command to run before building the application (`npm run build`).
    -   `frontendDist`: Path to the frontend's build output directory (`../dist`).
-   **`app`**:
    -   **`windows`**: Defines properties for application windows.
        -   `title`: Window title.
        -   `width`, `height`: Initial window dimensions.
    -   `security`:
        -   `csp`: Content Security Policy. `null` means no CSP is applied.
-   **`bundle`**: Configuration for bundling the application.
    -   `active`: Whether bundling is active.
    -   `targets`: Build targets (`all` for all supported platforms).
    -   `icon`: Paths to application icons for different sizes/formats.
-   **`plugins`**: Enables and configures Tauri plugins.
    -   `store`, `dialog`, `opener`: Enabled plugins.

### Rust Source Files (`src-tauri/src/`)

#### `src-tauri/src/main.rs`

This is the entry point for the Rust binary application.

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    musicthing_lib::run()
}
```

-   `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`: This attribute is a common Tauri idiom. In release builds (when `debug_assertions` is not enabled), it sets the `windows_subsystem` to `windows`, which prevents a console window from appearing alongside the GUI application on Windows.
-   `fn main()`: The main function, the application's starting point.
-   `musicthing_lib::run()`: Calls the `run` function from the `musicthing_lib` crate (defined in `src-tauri/src/lib.rs`), which contains the main Tauri application logic.

#### `src-tauri/src/models.rs`

This file defines the data structures (structs) used throughout the application, particularly for representing music information and application state.

```rust
use serde::Serialize;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::RwLock;

// Represents detailed information about a single song.
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
    pub cover_art_base64: Option<String>, // Base64 encoded cover art
    pub album_artist: Option<String>,
    pub year: Option<String>,
    pub label: Option<String>,
    pub track_number: Option<String>,
}

// Default implementation for SongInfo, providing initial values.
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

// Represents information about an album.
#[derive(Serialize, Clone, Debug)]
pub struct Album {
    pub id: i64,
    pub title: String,
    pub artist: String,
    pub year: Option<String>,
    pub genre: Option<String>,
    pub cover_art_base64: Option<String>, // Base64 encoded cover art
    pub song_count: u32,
    pub total_duration: f32,
    pub folder_path: String, // Path to the folder containing the album's songs
}

// Holds the shared application state, accessible across different parts of the backend.
pub struct AppState {
    pub db_pool: SqlitePool, // Connection pool for the SQLite database
    pub is_scanning: Arc<RwLock<bool>>, // Atomic boolean to track if a scan is in progress
    pub scan_progress: Arc<RwLock<f32>>, // Atomic float to track scan progress (0.0 - 100.0)
}

// Represents the current music scanning progress, sent to the frontend.
#[derive(Serialize)]
pub struct ScanProgress {
    pub is_scanning: bool,
    pub progress: f32,
    pub current_file: Option<String>,
    pub total_files: Option<u32>,
    pub processed_files: Option<u32>,
}
```

-   **`#[derive(Serialize, Clone, Debug)]`**: These derive macros automatically implement traits for the structs:
    -   `Serialize`: Allows the struct to be serialized into formats like JSON, which is essential for sending data from Rust to the JavaScript frontend via Tauri commands.
    -   `Clone`: Allows creating a deep copy of the struct.
    -   `Debug`: Allows printing the struct for debugging purposes.
-   **`SongInfo`**: Stores detailed metadata for each song. `Option<T>` is used for fields that might not always be present (e.g., genre, lyrics path). `cover_art_base64` stores the album art as a Base64 encoded string, suitable for embedding directly in web pages.
-   **`Album`**: Stores aggregated information for an album, including its total duration and song count.
-   **`AppState`**: This struct is crucial for managing shared, mutable state across different asynchronous tasks and Tauri commands.
    -   `db_pool: SqlitePool`: A connection pool to the SQLite database, allowing multiple parts of the application to interact with the database concurrently.
    -   `is_scanning: Arc<RwLock<bool>>`: An `Arc` (Atomic Reference Counted) pointer combined with an `RwLock` (Read-Write Lock). This allows multiple threads/tasks to safely read (`RwLock::read`) or exclusively write (`RwLock::write`) to the `is_scanning` boolean, indicating if a music scan is currently active. `Arc` enables shared ownership across threads.
    -   `scan_progress: Arc<RwLock<f32>>`: Similar to `is_scanning`, this uses `Arc<RwLock>` to safely share and update the current scan progress percentage.
-   **`ScanProgress`**: A simplified struct specifically for sending scan progress updates to the frontend.

#### `src-tauri/src/metadata/scanner.rs`

This file contains the core logic for scanning music files, extracting metadata, and populating the SQLite database.

```rust
use crate::models::{Album, SongInfo}; // Import data models
use base64::engine::general_purpose::STANDARD; // For Base64 encoding
use base64::Engine;
use lofty::prelude::*; // Lofty prelude for common traits/types
use lofty::{picture::PictureType, read_from_path}; // Lofty for reading audio metadata
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool}; // SQLx for database operations
use std::collections::HashMap; // For grouping songs by album
use std::fs; // File system operations
use std::path::Path; // Path manipulation
use std::sync::Arc; // Atomic Reference Counting for shared state
use tauri::{AppHandle, Emitter}; // Tauri application handle and event emitter
use tokio::sync::RwLock; // Read-Write Lock for shared mutable state
use walkdir::WalkDir; // For traversing directories

// Initializes the SQLite database, creating tables if they don't exist.
pub async fn initialize_database(
    db_path: &Path,
) -> Result<SqlitePool, Box<dyn std::error::Error + Send + Sync>> {
    let db_url = format!("sqlite:{}", db_path.display());

    println!("Initializing database at: {}", db_url);

    // Check if database exists, create if not
    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        println!("Creating new database file");
        Sqlite::create_database(&db_url).await?;
    }

    // Connect to the database
    let pool = SqlitePool::connect(&db_url).await?;

    // Create 'albums' table
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
            UNIQUE(title, artist, folder_path) // Ensures unique albums
        );
        "#,
    )
    .execute(&pool)
    .await?;

    // Create 'songs' table
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
            path TEXT NOT NULL UNIQUE, // Song path must be unique
            lyrics_path TEXT,
            album_artist TEXT,
            year TEXT,
            label TEXT,
            track_number TEXT,
            file_modified_time INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE CASCADE // Link to albums table
        );
        "#,
    )
    .execute(&pool)
    .await?;

    // Create indexes for performance
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

// Scans a specified music folder, processes audio files, and populates the database.
pub async fn scan_music_folder(
    folder_path: String,
    db_pool: SqlitePool,
    scan_progress: Arc<RwLock<f32>>, // Shared scan progress
    app_handle: AppHandle, // Tauri app handle for emitting events
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Clear existing data for the given folder path to prevent duplicates on rescan
    sqlx::query("DELETE FROM albums WHERE folder_path = ?")
        .bind(&folder_path)
        .execute(&db_pool)
        .await?;

    // Collect all FLAC files first to get a total count for progress tracking
    let flac_files: Vec<_> = WalkDir::new(&folder_path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| {
            e.path()
                .extension()
                .map(|s| s.to_ascii_lowercase() == "flac") // Only process FLAC files
                .unwrap_or(false)
        })
        .collect();

    let total_files = flac_files.len() as f32;

    // Use a HashMap to group songs by album for efficient insertion
    let mut albums_map: HashMap<String, (Album, Vec<SongInfo>)> = HashMap::new();

    for (index, entry) in flac_files.iter().enumerate() {
        let path = entry.path();

        // Update and emit progress to the frontend
        let processed_files = index as f32;
        let progress = if total_files > 0.0 {
            (processed_files / total_files) * 100.0
        } else {
            0.0
        };

        {
            let mut prog = scan_progress.write().await; // Acquire write lock
            *prog = progress;
        }

        let _ = app_handle.emit("scan_progress", progress); // Emit event

        let mut song_info = process_audio_file(path).await?; // Process individual file

        // Create a unique key for the album based on artist, album title, and folder path
        let album_folder = path.parent().unwrap_or(Path::new("")).display().to_string();
        let album_key = format!(
            "{}||{}||{}",
            song_info.album_artist.as_ref().unwrap_or(&song_info.artist),
            song_info.album,
            album_folder
        );

        // Add song to existing album or create a new album entry in the map
        match albums_map.get_mut(&album_key) {
            Some((album, songs)) => {
                // Update existing album's duration and song count
                album.total_duration += song_info.duration;
                album.song_count += 1;

                // If album doesn't have cover art, use the song's cover art
                if album.cover_art_base64.is_none() && song_info.cover_art_base64.is_some() {
                    album.cover_art_base64 = song_info.cover_art_base64.clone();
                }

                song_info.cover_art_base64 = None; // Remove cover art from song to save memory
                songs.push(song_info);
            }
            None => {
                // Create a new album entry
                let cover_art = song_info.cover_art_base64.clone();
                song_info.cover_art_base64 = None; // Remove from song

                let album = Album {
                    id: 0, // ID will be set by the database
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

    // Insert collected albums and their songs into the database
    for (_, (mut album, songs)) in albums_map {
        // Insert album and get its generated ID
        let album_id = sqlx::query(
            r#"
            INSERT INTO albums (title, artist, year, genre, cover_art_base64, song_count, total_duration, folder_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#
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

        album.id = album_id; // Update album struct with its new ID

        // Insert all songs belonging to this album
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
                "#
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

    // Final progress update and event emission
    {
        let mut prog = scan_progress.write().await;
        *prog = 100.0;
    }
    let _ = app_handle.emit("scan_complete", ());

    Ok(())
}

// Processes a single audio file, extracting its metadata.
async fn process_audio_file(
    path: &Path,
) -> Result<SongInfo, Box<dyn std::error::Error + Send + Sync>> {
    let mut info = SongInfo::default();
    info.path = path.display().to_string();

    // Use `lofty` to read file metadata
    if let Ok(file) = read_from_path(path) {
        info.duration = file.properties().duration().as_secs_f32(); // Get duration

        if let Some(tag) = file.primary_tag() {
            // Extract common tags
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

            // Iterate through all tag items for more specific fields
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
                        _ => {} // Ignore other tag items
                    }
                }
            }

            // Extract front cover art if available
            if let Some(picture) = tag
                .pictures()
                .iter()
                .find(|p| p.pic_type() == PictureType::CoverFront)
            {
                info.cover_art_base64 = Some(STANDARD.encode(picture.data()));
            }
        }
    }

    // Look for external cover art files (e.g., cover.jpg) if not found in tags
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

    // Look for associated lyrics file (.lrc)
    let lrc_path = path.with_extension("lrc");
    if lrc_path.exists() {
        info.lyrics_path = Some(lrc_path.display().to_string());
    }

    Ok(info)
}
```

-   **`initialize_database`**:
    -   Takes a `db_path` (where the SQLite database file will be).
    -   Checks if the database file exists; if not, it creates it.
    -   Connects to the SQLite database using `sqlx::SqlitePool::connect`.
    -   Executes `CREATE TABLE IF NOT EXISTS` statements for `albums` and `songs` tables.
    -   Defines table schemas, including primary keys, foreign keys (`album_id` in `songs` referencing `albums`), and `UNIQUE` constraints.
    -   Creates indexes (`idx_albums_artist_title`, `idx_songs_album_id`, `idx_songs_path`) for faster querying.
-   **`scan_music_folder`**:
    -   Takes `folder_path` (the directory to scan), `db_pool` (database connection), `scan_progress` (shared state for progress updates), and `app_handle` (for emitting events to the frontend).
    -   **Clears existing data**: Before scanning, it deletes existing album data associated with the `folder_path` to ensure a clean rescan.
    -   **File Collection**: Uses `walkdir` to recursively find all `.flac` files within the specified `folder_path`.
    -   **Progress Tracking**: Calculates and updates `scan_progress` (using `RwLock` for safe concurrent access) and emits `scan_progress` events to the frontend via `app_handle.emit`.
    -   **Album Grouping**: Uses a `HashMap` (`albums_map`) to group `SongInfo` objects by album. This is crucial for efficiently inserting albums and their associated songs into the database. The key for the map is a combination of album artist, album title, and folder path to ensure uniqueness.
    -   **`process_audio_file`**: Calls this helper function for each FLAC file to extract its metadata.
    -   **Database Insertion**: After processing all files, it iterates through the `albums_map`.
        -   Inserts each `Album` into the `albums` table, retrieving the `last_insert_rowid()` to get the newly generated `album_id`.
        -   Inserts all `SongInfo` objects associated with that album into the `songs` table, linking them to the `album_id`. It uses `INSERT OR REPLACE` to handle cases where a song might already exist (e.g., if the file was modified).
    -   **Final Progress**: Updates `scan_progress` to 100% and emits a `scan_complete` event.
-   **`process_audio_file`**:
    -   Takes a `path` to an audio file.
    -   Uses the `lofty` crate to read audio file properties and tags.
    -   Extracts common metadata fields like title, artist, album, genre, and duration.
    -   Iterates through `tag.items()` to extract more specific fields like `AlbumArtist`, `Year`, `Label`, and `TrackNumber`.
    -   **Cover Art Extraction**:
        -   Prioritizes extracting embedded front cover art from the audio file's tags.
        -   If no embedded cover art is found, it searches for common external cover art files (e.g., `cover.jpg`, `folder.jpg`) in the same directory as the audio file.
        -   Converts the image data to Base64 for easy display in the frontend.
    -   **Lyrics File**: Checks for an associated `.lrc` (lyrics) file in the same directory.

## How to Run

### Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run in Development Mode**:
    ```bash
    npm run tauri dev
    ```
    This will start the React development server and then launch the Tauri application, which will connect to the frontend.

### Building for Production

1.  **Build Frontend**:
    ```bash
    npm run build
    ```
2.  **Build Tauri Application**:
    ```bash
    npm run tauri build
    ```
    This will create a production-ready executable for your operating system in the `src-tauri/target/release` directory (or a platform-specific subdirectory).

## Key Concepts

-   **Tauri**: A framework that allows you to build desktop applications using web technologies (HTML, CSS, JavaScript) for the UI and Rust for the backend. It bundles your web application with a minimal Rust binary.
-   **Rust**: A systems programming language focused on safety, performance, and concurrency. It's used here for computationally intensive tasks like file scanning, metadata parsing, and database interactions.
-   **React**: A JavaScript library for building user interfaces.
-   **Vite**: A fast build tool that provides a quick development server and optimized builds for web projects.
-   **`sqlx`**: An asynchronous, compile-time checked SQL toolkit for Rust. It's used for interacting with the SQLite database, ensuring type safety and preventing common SQL injection vulnerabilities.
-   **`lofty`**: A Rust library for reading and writing audio metadata. It abstracts away the complexities of different audio file formats (e.g., FLAC, MP3) and their tagging systems.
-   **`tokio`**: An asynchronous runtime for Rust. It enables writing non-blocking code, which is essential for responsive applications, especially when dealing with I/O operations like file scanning and database queries.
-   **`Arc<RwLock<T>>`**: A common Rust pattern for safely sharing mutable data between multiple threads or asynchronous tasks.
    -   `Arc`: Atomic Reference Counted. Allows multiple owners of a piece of data. When the last `Arc` goes out of scope, the data is dropped.
    -   `RwLock`: Read-Write Lock. Allows multiple readers or a single writer at any given time, preventing data corruption in concurrent access scenarios.
-   **Tauri Commands**: Functions in the Rust backend that can be invoked directly from the JavaScript frontend. These are defined using the `#[tauri::command]` macro in Rust.
-   **Tauri Events**: A mechanism for the Rust backend to send messages or notifications to the JavaScript frontend. The frontend can listen for these events (e.g., `scan_progress`, `scan_complete`).

This `README.md` provides a detailed overview of your MusicThing application, emphasizing the Rust backend's role and the technologies used.