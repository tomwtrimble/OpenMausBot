use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use serde::Deserialize;

use crate::tracker::TrackerConfig;

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct Config {
    pub ntfy: NtfyConfig,
    pub alerts: AlertConfig,
    pub game: GameConfig,
    pub screen: ScreenConfig,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct NtfyConfig {
    /// Base URL of the ntfy server that relays pushes to the phone.
    pub server: String,
    /// Topic the phone subscribes to. Anyone who knows it can read the
    /// alerts and send fake ones, so it must stay long and random.
    pub topic: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct AlertConfig {
    /// Push a quiet confirmation when a queue is first seen.
    pub queue_started: bool,
    /// Push a reminder every this many minutes of queueing; 0 turns it off.
    pub long_queue_minutes: u64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct GameConfig {
    /// Executable name of the game, matched case-insensitively.
    pub process_name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct ScreenConfig {
    /// Seconds between screen reads.
    pub poll_seconds: u64,
    /// Part of the game window where the queue banner appears, as fractions
    /// of the window size.
    pub region: Region,
    /// Text that shows the game is still searching, case-insensitive.
    pub searching_keywords: Vec<String>,
    /// Text that shows a match was found, case-insensitive. Checked first.
    pub found_keywords: Vec<String>,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Region {
    pub left: f32,
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
}

impl Default for NtfyConfig {
    fn default() -> Self {
        Self {
            server: "https://ntfy.sh".to_owned(),
            topic: String::new(),
        }
    }
}

impl Default for AlertConfig {
    fn default() -> Self {
        Self {
            queue_started: true,
            long_queue_minutes: 10,
        }
    }
}

impl Default for GameConfig {
    fn default() -> Self {
        Self {
            process_name: "Overwatch.exe".to_owned(),
        }
    }
}

impl Default for ScreenConfig {
    fn default() -> Self {
        Self {
            poll_seconds: 2,
            region: Region {
                left: 0.25,
                top: 0.0,
                right: 0.75,
                bottom: 0.25,
            },
            searching_keywords: vec!["SEARCHING".to_owned()],
            found_keywords: vec!["GAME FOUND".to_owned(), "MATCH FOUND".to_owned()],
        }
    }
}

impl Config {
    pub fn tracker(&self) -> TrackerConfig {
        TrackerConfig {
            long_queue_every: (self.alerts.long_queue_minutes > 0)
                .then(|| Duration::from_secs(self.alerts.long_queue_minutes * 60)),
            ..TrackerConfig::default()
        }
    }

    pub fn subscribe_url(&self) -> String {
        format!(
            "{}/{}",
            self.ntfy.server.trim_end_matches('/'),
            self.ntfy.topic
        )
    }
}

pub fn path() -> Result<PathBuf, String> {
    dirs::config_dir()
        .map(|dir| dir.join("queue-alert").join("config.toml"))
        .ok_or_else(|| "could not find the user config folder".to_owned())
}

pub struct Loaded {
    pub config: Config,
    pub path: PathBuf,
    pub created: bool,
}

pub fn load_or_create() -> Result<Loaded, String> {
    let path = path()?;
    let created = !path.exists();
    if created {
        let dir = path.parent().expect("config path has a parent folder");
        fs::create_dir_all(dir).map_err(|e| format!("creating {}: {e}", dir.display()))?;
        let text = template(&random_topic()?);
        fs::write(&path, text).map_err(|e| format!("writing {}: {e}", path.display()))?;
    }
    let text = fs::read_to_string(&path).map_err(|e| format!("reading {}: {e}", path.display()))?;
    let config = parse(&text).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(Loaded {
        config,
        path,
        created,
    })
}

pub fn parse(text: &str) -> Result<Config, String> {
    let config: Config = toml::from_str(text).map_err(|e| e.to_string())?;
    if config.ntfy.topic.len() < 16 {
        return Err("ntfy.topic must be at least 16 characters so nobody can guess it".to_owned());
    }
    let region = config.screen.region;
    let ordered = 0.0 <= region.left
        && region.left < region.right
        && region.right <= 1.0
        && 0.0 <= region.top
        && region.top < region.bottom
        && region.bottom <= 1.0;
    if !ordered {
        return Err(
            "screen.region must satisfy 0 <= left < right <= 1 and 0 <= top < bottom <= 1"
                .to_owned(),
        );
    }
    if config.screen.poll_seconds == 0 {
        return Err("screen.poll_seconds must be at least 1".to_owned());
    }
    Ok(config)
}

fn random_topic() -> Result<String, String> {
    const ALPHABET: &[u8] = b"abcdefghijkmnpqrstuvwxyz23456789";
    let mut bytes = [0u8; 24];
    getrandom::fill(&mut bytes).map_err(|e| format!("generating a topic: {e}"))?;
    let suffix: String = bytes
        .iter()
        .map(|b| ALPHABET[usize::from(*b) % ALPHABET.len()] as char)
        .collect();
    Ok(format!("queue-alert-{suffix}"))
}

fn template(topic: &str) -> String {
    let defaults = Config::default();
    let quoted = |words: &[String]| {
        words
            .iter()
            .map(|w| format!("{w:?}"))
            .collect::<Vec<_>>()
            .join(", ")
    };
    let region = defaults.screen.region;
    format!(
        r#"[ntfy]
# Server that relays alerts to your phone. Install the ntfy app and subscribe to the topic below.
server = "{server}"
# Keep this secret: anyone who knows it can read your alerts.
topic = "{topic}"

[alerts]
# Quiet push when a queue is first seen, so you know queue-alert is watching.
queue_started = {queue_started}
# Reminder every N minutes of queueing. 0 turns it off.
long_queue_minutes = {long_queue_minutes}

[game]
process_name = "{process_name}"

[screen]
poll_seconds = {poll_seconds}
# Part of the game window where the queue banner is, as fractions of the window.
# Run `queue-alert scan` while queueing to see what text is found where.
region = {{ left = {left}, top = {top}, right = {right}, bottom = {bottom} }}
searching_keywords = [{searching}]
found_keywords = [{found}]
"#,
        server = defaults.ntfy.server,
        queue_started = defaults.alerts.queue_started,
        long_queue_minutes = defaults.alerts.long_queue_minutes,
        process_name = defaults.game.process_name,
        poll_seconds = defaults.screen.poll_seconds,
        left = region.left,
        top = region.top,
        right = region.right,
        bottom = region.bottom,
        searching = quoted(&defaults.screen.searching_keywords),
        found = quoted(&defaults.screen.found_keywords),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_template_parses_to_the_defaults() {
        let topic = random_topic().unwrap();
        let config = parse(&template(&topic)).unwrap();
        assert_eq!(config.ntfy.topic, topic);
        assert_eq!(
            config.screen.found_keywords,
            ScreenConfig::default().found_keywords
        );
        assert_eq!(config.alerts.long_queue_minutes, 10);
    }

    #[test]
    fn random_topics_differ() {
        assert_ne!(random_topic().unwrap(), random_topic().unwrap());
    }

    #[test]
    fn short_topics_are_rejected() {
        assert!(parse("[ntfy]\ntopic = \"overwatch\"\n").is_err());
    }

    #[test]
    fn an_inverted_region_is_rejected() {
        let text = "[ntfy]\ntopic = \"queue-alert-abcdefghijkl\"\n[screen]\nregion = { left = 0.8, top = 0.0, right = 0.2, bottom = 0.3 }\n";
        assert!(parse(text).is_err());
    }

    #[test]
    fn zero_disables_long_queue_reminders() {
        let config = parse(
            "[ntfy]\ntopic = \"queue-alert-abcdefghijkl\"\n[alerts]\nlong_queue_minutes = 0\n",
        )
        .unwrap();
        assert!(config.tracker().long_queue_every.is_none());
    }
}
