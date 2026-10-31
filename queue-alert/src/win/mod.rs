mod capture;
mod game;
mod taskbar;

use std::sync::mpsc::{self, RecvTimeoutError, Sender};
use std::thread;
use std::time::{Duration, Instant};

use windows::Win32::System::WinRT::{RO_INIT_MULTITHREADED, RoInitialize};

use crate::config::Config;
use crate::notify::{Notifier, message_for};
use crate::screen_text::classify;
use crate::tracker::{Alert, Signal, Tracker};
use capture::WindowReader;

pub fn run(config: &Config, notifier: &Notifier) -> Result<(), String> {
    let (signals, received) = mpsc::channel();

    let process_name = config.game.process_name.clone();
    let flash_signals = signals.clone();
    thread::spawn(move || {
        if let Err(e) = taskbar::listen(process_name, flash_signals) {
            eprintln!("Taskbar flash detection is off: {e}");
        }
    });

    let screen_config = config.clone();
    thread::spawn(move || watch_game(&screen_config, signals));

    println!(
        "Watching for {}. Leave this window open.",
        config.game.process_name
    );
    let mut tracker = Tracker::new(config.tracker());
    loop {
        let mut alerts = match received.recv_timeout(Duration::from_secs(1)) {
            Ok(signal) => tracker.handle(signal, Instant::now()),
            Err(RecvTimeoutError::Timeout) => Vec::new(),
            Err(RecvTimeoutError::Disconnected) => {
                return Err("the game watcher stopped".to_owned());
            }
        };
        alerts.extend(tracker.tick(Instant::now()));
        for alert in alerts {
            if alert == Alert::QueueStarted && !config.alerts.queue_started {
                continue;
            }
            let message = message_for(alert);
            println!("{}: {}", message.title, message.body);
            if let Err(e) = notifier.send(&message) {
                eprintln!("{e}");
            }
        }
    }
}

pub fn scan(config: &Config) -> Result<(), String> {
    init_winrt()?;
    let game = game::find(&config.game.process_name)
        .ok_or_else(|| format!("{} is not running", config.game.process_name))?;
    let window = game.window.ok_or("the game has no visible window")?;
    if game.is_minimized() {
        return Err("the game window is minimized; restore it and scan again".to_owned());
    }
    let mut reader = WindowReader::new(window)?;
    for _ in 0..5 {
        let Some(lines) = reader.read_text()? else {
            continue;
        };
        let region = config.screen.region;
        for line in &lines {
            let center_x = line.left + line.width / 2.0;
            let center_y = line.top + line.height / 2.0;
            let inside = (region.left..=region.right).contains(&center_x)
                && (region.top..=region.bottom).contains(&center_y);
            println!(
                "{} x={:.2} y={:.2}  {:?}",
                if inside { "[in region]" } else { "           " },
                center_x,
                center_y,
                line.text
            );
        }
        println!("Classified as: {:?}", classify(&lines, &config.screen));
        return Ok(());
    }
    Err("the game window produced no frames; make sure it is visible".to_owned())
}

fn watch_game(config: &Config, signals: Sender<Signal>) {
    if let Err(e) = init_winrt() {
        eprintln!("{e}");
        return;
    }
    let poll = Duration::from_secs(config.screen.poll_seconds);
    let mut reader: Option<WindowReader> = None;
    let mut was_running = None;
    let mut was_minimized = None;
    let mut last_error = None;
    let mut report = |error: String| {
        if last_error.as_ref() != Some(&error) {
            eprintln!("Screen reading: {error}");
            last_error = Some(error);
        }
    };
    loop {
        let found = game::find(&config.game.process_name);
        let running = found.is_some();
        if was_running != Some(running) {
            was_running = Some(running);
            if signals.send(Signal::GameRunning(running)).is_err() {
                return;
            }
        }
        if let Some(game) = found {
            let minimized = game.is_minimized();
            if was_minimized != Some(minimized) {
                was_minimized = Some(minimized);
                let _ = signals.send(Signal::Minimized(minimized));
            }
            if let (Some(window), false) = (game.window, minimized) {
                if reader.as_ref().map(WindowReader::window) != Some(window) {
                    reader = WindowReader::new(window).map_err(&mut report).ok();
                }
                if let Some(active) = reader.as_mut() {
                    match active.read_text() {
                        Ok(Some(lines)) => {
                            let _ = signals.send(Signal::Screen(classify(&lines, &config.screen)));
                        }
                        Ok(None) => {}
                        Err(e) => {
                            report(e);
                            reader = None;
                        }
                    }
                }
            }
        } else {
            reader = None;
            was_minimized = None;
        }
        thread::sleep(poll);
    }
}

fn init_winrt() -> Result<(), String> {
    unsafe { RoInitialize(RO_INIT_MULTITHREADED) }
        .map_err(|e| format!("initialising Windows Runtime: {e}"))
}
