# queue-alert agent notes

queue-alert tells a player's phone when their Overwatch 2 match is found, so
they can leave the PC while queueing. It is a Rust program for Windows.

## Account safety comes first

The player's Battle.net account is what we are protecting. Never add code that:

- opens a handle to the game process (`OpenProcess`), reads or writes its
  memory, injects a DLL, or hooks its functions;
- reads, intercepts or redirects the game's network traffic;
- sends keystrokes, clicks or window messages to the game.

Allowed inputs are the ones streaming and overlay tools use: the process list,
the window list, Windows Graphics Capture of the game window, system audio,
and shell notifications such as the taskbar flash. If a feature cannot be
built from those, it does not ship.

## Layout

- `src/tracker.rs`: pure state machine turning detector signals into alerts.
  All behaviour changes start with a test here.
- `src/screen_text.rs`: decides from OCR text whether the queue banner says
  searching or found.
- `src/config.rs`: `config.toml` in `%APPDATA%\queue-alert`.
- `src/notify.rs`: push through ntfy.
- `src/win/`: Windows-only detectors (game lookup, screen capture + OCR,
  taskbar flash).

## Checks

```sh
cargo test
cargo clippy --all-targets
cargo clippy --target x86_64-pc-windows-gnu
cargo build --release --target x86_64-pc-windows-gnu
```

Cross-compiling needs `rustup target add x86_64-pc-windows-gnu` and the
`gcc-mingw-w64-x86-64` package. Screen capture and OCR only run on real
Windows; nothing on Linux or Wine exercises them.
