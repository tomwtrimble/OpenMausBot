# queue-alert

Get a phone notification when your Overwatch 2 match is found, so you can
leave your PC while you queue.

## How it stays safe for your account

queue-alert never touches the game. It does not open the Overwatch process,
read its memory, inject anything, look at its network traffic, or press keys
for you. It only uses what streaming and overlay tools use:

- the Windows process and window lists, to know whether Overwatch is running;
- Windows Graphics Capture (the API behind OBS and the Xbox Game Bar) plus
  the OCR built into Windows, to read the queue banner off the game window;
- the taskbar flash Overwatch raises when a match is found.

It works with the game muted, because none of this depends on sound.

## Alerts

| Alert | When |
| --- | --- |
| Match found | The banner says the game was found, or Overwatch flashes in the taskbar while you are queued. Highest priority. |
| Watching your queue | A queue is first seen. Quiet; can be turned off. |
| Still queueing | Every 10 minutes in queue (configurable, or off). |
| Queue ended | The queue banner disappeared without a match being seen. |
| Overwatch is minimized | You minimized the game while queued. In fullscreen, Overwatch may not join the match until you tab back in, and queue-alert cannot read a minimized window. |
| Overwatch closed | The game exited while you were queued or after a match was found, which usually means a crash. |

## Setup

1. Install the [ntfy](https://ntfy.sh) app on your phone (Android or iPhone).
2. Run `queue-alert setup` on your PC. It creates
   `%APPDATA%\queue-alert\config.toml` with a random private topic and prints it.
3. In the ntfy app, tap + and subscribe to that topic.
4. Run `queue-alert test` and check that your phone buzzes.
5. Start Overwatch, then run `queue-alert`. Leave its window open.

Fullscreen and borderless windowed both work as long as the game stays on
screen. Do not minimize it while you queue.

### Tuning the screen reader

The words queue-alert looks for, and the part of the window it reads, are in
`config.toml` under `[screen]`. While queueing, run `queue-alert scan` to see
every piece of text it reads, where it is, and how it was classified. If the
banner text is outside the region or worded differently (for example, in
another game language), adjust `region`, `searching_keywords` or
`found_keywords`.

## Building

```sh
cargo build --release
```

On Linux you can cross-compile the Windows build with
`cargo build --release --target x86_64-pc-windows-gnu` after installing
`gcc-mingw-w64-x86-64` and running `rustup target add x86_64-pc-windows-gnu`.

## Not done yet

- Untested against the real game: the default keywords and region are
  guesses that `queue-alert scan` on a real queue should confirm.
- Listening for the match-found sound, as a third signal when the screen
  cannot be read.
- A tray icon and an installer instead of a console window.
- A queue-alert phone app and push service, so users do not need ntfy.
