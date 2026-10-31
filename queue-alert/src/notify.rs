use std::time::Duration;

use crate::config::Config;
use crate::tracker::Alert;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Message {
    pub title: &'static str,
    pub body: String,
    /// ntfy priority, 1 (min) to 5 (max). 5 overrides Do Not Disturb on
    /// Android when the user allows it in the ntfy app.
    pub priority: u8,
    pub tags: &'static str,
}

pub fn message_for(alert: Alert) -> Message {
    match alert {
        Alert::MatchFound => Message {
            title: "Match found",
            body: "Your Overwatch match is ready. Get back to your PC.".to_owned(),
            priority: 5,
            tags: "rotating_light",
        },
        Alert::QueueStarted => Message {
            title: "Watching your queue",
            body: "queue-alert sees you queueing and will push when a match is found.".to_owned(),
            priority: 2,
            tags: "eyes",
        },
        Alert::QueueEnded => Message {
            title: "Queue ended",
            body: "The queue banner disappeared without a match being seen. A match may have started, or the queue was cancelled.".to_owned(),
            priority: 4,
            tags: "warning",
        },
        Alert::LongQueue { minutes } => Message {
            title: "Still queueing",
            body: format!("You have been in queue for {minutes} minutes."),
            priority: 3,
            tags: "hourglass_flowing_sand",
        },
        Alert::MinimizedWhileQueueing => Message {
            title: "Overwatch is minimized",
            body: "In fullscreen mode Overwatch may not join your match until you tab back in, and queue-alert cannot read a minimized window. Leave the game on screen, or use borderless windowed mode.".to_owned(),
            priority: 4,
            tags: "warning",
        },
        Alert::GameClosed { while_queueing } => Message {
            title: "Overwatch closed",
            body: if while_queueing {
                "Overwatch closed while you were in queue. It may have crashed.".to_owned()
            } else {
                "Overwatch closed after your match was found. It may have crashed.".to_owned()
            },
            priority: 5,
            tags: "skull",
        },
    }
}

pub fn test_message() -> Message {
    Message {
        title: "queue-alert test",
        body: "If you can read this, phone alerts work.".to_owned(),
        priority: 3,
        tags: "white_check_mark",
    }
}

pub struct Notifier {
    agent: ureq::Agent,
    url: String,
}

impl Notifier {
    pub fn new(config: &Config) -> Self {
        let agent = ureq::Agent::config_builder()
            .timeout_global(Some(Duration::from_secs(15)))
            .build()
            .into();
        Self {
            agent,
            url: config.subscribe_url(),
        }
    }

    pub fn send(&self, message: &Message) -> Result<(), String> {
        self.agent
            .post(&self.url)
            .header("Title", message.title)
            .header("Priority", message.priority.to_string())
            .header("Tags", message.tags)
            .send(message.body.as_str())
            .map(drop)
            .map_err(|e| format!("sending \"{}\" to ntfy: {e}", message.title))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn match_found_is_the_loudest_alert() {
        assert_eq!(message_for(Alert::MatchFound).priority, 5);
        assert!(message_for(Alert::QueueStarted).priority < 3);
    }

    #[test]
    fn titles_are_ascii_because_they_travel_as_http_headers() {
        let alerts = [
            Alert::QueueStarted,
            Alert::MatchFound,
            Alert::QueueEnded,
            Alert::LongQueue { minutes: 12 },
            Alert::MinimizedWhileQueueing,
            Alert::GameClosed {
                while_queueing: true,
            },
        ];
        for alert in alerts {
            assert!(message_for(alert).title.is_ascii(), "{alert:?}");
        }
    }
}
