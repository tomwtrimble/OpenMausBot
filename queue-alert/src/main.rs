use std::process::ExitCode;

use queue_alert::config;
use queue_alert::notify::{self, Notifier};
#[cfg(windows)]
use queue_alert::win;

const USAGE: &str = "\
queue-alert: phone alerts when your Overwatch match is found

Usage:
  queue-alert          watch the game and send alerts (same as `run`)
  queue-alert run      watch the game and send alerts
  queue-alert setup    show where the config is and how to connect your phone
  queue-alert test     send a test alert to your phone
  queue-alert scan     print the text queue-alert reads off the game window now
";

fn main() -> ExitCode {
    let command = std::env::args().nth(1);
    let result = match command.as_deref() {
        None | Some("run") => run(),
        Some("setup") => setup(),
        Some("test") => test(),
        Some("scan") => scan(),
        Some("-h" | "--help" | "help") => {
            print!("{USAGE}");
            Ok(())
        }
        Some(other) => Err(format!("unknown command {other:?}\n\n{USAGE}")),
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("queue-alert: {e}");
            ExitCode::FAILURE
        }
    }
}

fn setup() -> Result<(), String> {
    let loaded = config::load_or_create()?;
    if loaded.created {
        println!("Created {}", loaded.path.display());
    } else {
        println!("Config: {}", loaded.path.display());
    }
    println!();
    println!("To get alerts on your phone:");
    println!("  1. Install the ntfy app (Android or iPhone).");
    println!("  2. Tap + and subscribe to this topic:");
    println!("       {}", loaded.config.ntfy.topic);
    println!("     If you changed `server` in the config, enter that server in the app too.");
    println!("  3. Run `queue-alert test` and check that the alert arrives.");
    println!();
    println!("Keep the topic secret: anyone who knows it can read your alerts.");
    Ok(())
}

fn test() -> Result<(), String> {
    let loaded = config::load_or_create()?;
    Notifier::new(&loaded.config).send(&notify::test_message())?;
    println!("Sent a test alert to {}", loaded.config.ntfy.topic);
    Ok(())
}

#[cfg(windows)]
fn run() -> Result<(), String> {
    let loaded = config::load_or_create()?;
    if loaded.created {
        setup()?;
        println!();
    }
    win::run(&loaded.config, &Notifier::new(&loaded.config))
}

#[cfg(windows)]
fn scan() -> Result<(), String> {
    win::scan(&config::load_or_create()?.config)
}

#[cfg(not(windows))]
fn run() -> Result<(), String> {
    Err("watching the game only works on Windows; `setup` and `test` work everywhere".to_owned())
}

#[cfg(not(windows))]
fn scan() -> Result<(), String> {
    run()
}
