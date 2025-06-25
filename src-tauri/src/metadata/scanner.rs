use crate::models::SongInfo;
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use lofty::prelude::*;
use lofty::{picture::PictureType, read_from_path};
use std::fs;
use walkdir::WalkDir;

#[tauri::command]
pub fn scan_music_folder(folder_path: String) -> Vec<SongInfo> {
    let mut songs = vec![];

    for entry in WalkDir::new(folder_path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.path().extension().map(|s| s == "flac").unwrap_or(false))
    {
        let path = entry.path();
        let tagged_file = read_from_path(path).ok();

        let mut info = SongInfo::default();
        info.path = path.display().to_string();

        if let Ok(file) = read_from_path(path) {
            info.duration = file.properties().duration().as_secs_f32();
        }

        if let Some(tagged) = tagged_file {
            if let Some(tag) = tagged.primary_tag() {
                info.title = tag.title().unwrap_or_else(|| "Unknown".into()).to_string();
                info.artist = tag.artist().unwrap_or_else(|| "Unknown".into()).to_string();
                info.album = tag.album().unwrap_or_else(|| "Unknown".into()).to_string();
                info.genre = tag.genre().map(|g| g.to_string());

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

                if let Some(picture) = tag
                    .pictures()
                    .iter()
                    .find(|p| p.pic_type() == PictureType::CoverFront)
                {
                    info.cover_art_base64 = Some(STANDARD.encode(picture.data()));
                }

                if info.cover_art_base64.is_none() {
                    if let Some(parent_dir) = path.parent() {
                        let cover_path = parent_dir.join("cover.jpg");

                        if cover_path.exists() {
                            match fs::read(&cover_path) {
                                Ok(bytes) => {
                                    info.cover_art_base64 = Some(STANDARD.encode(&bytes));
                                }
                                Err(e) => {
                                    eprintln!(
                                        "Error reading cover.jpg at {}: {}",
                                        cover_path.display(),
                                        e
                                    );
                                }
                            }
                        }
                    }
                }
            } else {
                eprintln!("--- No primary tag found for: {} ---", path.display());
            }
        } else {
            eprintln!(
                "--- Could not read file or no tags found for: {} ---",
                path.display()
            );
        }

        let lrc_path = path.with_extension("lrc");
        if lrc_path.exists() {
            info.lyrics_path = Some(lrc_path.display().to_string());
        }

        songs.push(info);
    }

    songs
}
