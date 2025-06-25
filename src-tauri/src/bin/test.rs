use musicthing_lib::metadata::scanner::scan_music_folder;

fn main() {
    let songs = scan_music_folder("C:/Users/naman/Music".into());

    for song in songs {
        println!("--- Song Info ---");
        println!("Title: {}", song.title);
        println!("Artist: {}", song.artist);
        println!("Album: {}", song.album);
        println!("Genre: {:?}", song.genre);
        println!("Duration: {} seconds", song.duration);
        println!("Path: {}", song.path);
        println!("Lyrics Path: {:?}", song.lyrics_path);

        if song.cover_art_base64.is_some() {
            println!("Cover Art: Present (Base64 data omitted for brevity)");
            println!(
                "Cover Art Length: {:?}",
                song.cover_art_base64.as_ref().map(|s| s.len())
            );
            println!(
                "Cover Art Start: {:.20}...",
                song.cover_art_base64.as_ref().unwrap()
            );
        } else {
            println!("Cover Art: Not found");
        }

        println!("Album Artist: {:?}", song.album_artist);
        println!("Year: {:?}", song.year);
        println!("Label: {:?}", song.label);
        println!("Track Number: {:?}", song.track_number);
        println!("-----------------\n");
    }
}
