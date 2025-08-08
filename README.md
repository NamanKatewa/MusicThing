# MusicThing

MusicThing is a lightweight, cross-platform desktop music player application built using the Tauri framework. The frontend is crafted with React and TypeScript, while the backend logic for music management and playback is handled by Rust. It allows users to scan their local music library, view albums, and play audio files.

## Technologies Used

This project leverages a modern stack for building desktop applications:

-   **Core Framework:**
    -   [Tauri](https://tauri.app/): A framework for building tiny, blazing fast binaries for all major desktop platforms.
-   **Frontend:**
    -   [React](https://reactjs.org/): A JavaScript library for building user interfaces.
    -   [TypeScript](https://www.typescriptlang.org/): A typed superset of JavaScript that compiles to plain JavaScript.
    -   [Vite](https://vitejs.dev/): A fast frontend build tool that provides a quicker and leaner development experience.
-   **Backend (Rust Crates):**
    -   [Rodio](https://crates.io/crates/rodio): Audio playback library.
    -   [Symphonia](https://crates.io/crates/symphonia): Audio decoding and media format demuxing library.
    -   [Lofty](https://crates.io/crates/lofty): A library for reading and writing audio metadata.
    -   [SQLx](https://crates.io/crates/sqlx): A modern, async-ready SQL toolkit for Rust.
    -   [Tokio](https://crates.io/crates/tokio): An asynchronous runtime for Rust.
    -   [Serde](https://crates.io/crates/serde): A framework for serializing and deserializing Rust data structures.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/naman1701/MusicThing.git
    cd MusicThing
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run tauri dev
    ```

## Available Scripts

-   `npm run dev`: Starts the Vite development server.
-   `npm run build`: Builds the application for production.
-   `npm run tauri dev`: Runs the application in development mode.
-   `npm run tauri build`: Builds the application for production.
