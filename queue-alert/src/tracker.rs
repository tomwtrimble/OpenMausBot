use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScreenState {
    Searching,
    MatchFound,
    Other,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Signal {
    GameRunning(bool),
    Minimized(bool),
    Screen(ScreenState),
    TaskbarFlash,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Alert {
    QueueStarted,
    MatchFound,
    QueueEnded,
    LongQueue { minutes: u64 },
    MinimizedWhileQueueing,
    GameClosed { while_queueing: bool },
}

#[derive(Debug, Clone)]
pub struct TrackerConfig {
    pub long_queue_every: Option<Duration>,
    pub searching_samples_to_start: u32,
    pub missing_samples_to_end: u32,
}

impl Default for TrackerConfig {
    fn default() -> Self {
        Self {
            long_queue_every: Some(Duration::from_secs(10 * 60)),
            searching_samples_to_start: 2,
            missing_samples_to_end: 3,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Phase {
    Idle,
    Queueing {
        since: Instant,
        next_long_queue: Option<Duration>,
        warned_minimized: bool,
        missing_samples: u32,
    },
    MatchFound,
}

pub struct Tracker {
    config: TrackerConfig,
    phase: Phase,
    searching_streak: u32,
}

impl Tracker {
    pub fn new(config: TrackerConfig) -> Self {
        Self {
            config,
            phase: Phase::Idle,
            searching_streak: 0,
        }
    }

    pub fn is_queueing(&self) -> bool {
        matches!(self.phase, Phase::Queueing { .. })
    }

    pub fn handle(&mut self, signal: Signal, now: Instant) -> Vec<Alert> {
        match signal {
            Signal::Screen(ScreenState::Searching) => self.on_searching(now),
            Signal::Screen(ScreenState::MatchFound) | Signal::TaskbarFlash => {
                self.searching_streak = 0;
                self.on_match_found()
            }
            Signal::Screen(ScreenState::Other) => {
                self.searching_streak = 0;
                self.on_queue_not_visible()
            }
            Signal::Minimized(true) => self.on_minimized(),
            Signal::Minimized(false) => Vec::new(),
            Signal::GameRunning(true) => Vec::new(),
            Signal::GameRunning(false) => self.on_game_closed(),
        }
    }

    pub fn tick(&mut self, now: Instant) -> Vec<Alert> {
        let Phase::Queueing {
            since,
            next_long_queue,
            ..
        } = &mut self.phase
        else {
            return Vec::new();
        };
        let (Some(due), Some(every)) = (*next_long_queue, self.config.long_queue_every) else {
            return Vec::new();
        };
        let waited = now.saturating_duration_since(*since);
        if waited < due {
            return Vec::new();
        }
        *next_long_queue = Some(due + every);
        vec![Alert::LongQueue {
            minutes: waited.as_secs() / 60,
        }]
    }

    fn on_searching(&mut self, now: Instant) -> Vec<Alert> {
        self.searching_streak += 1;
        if let Phase::Queueing {
            missing_samples, ..
        } = &mut self.phase
        {
            *missing_samples = 0;
            return Vec::new();
        }
        if self.searching_streak < self.config.searching_samples_to_start {
            return Vec::new();
        }
        self.phase = Phase::Queueing {
            since: now,
            next_long_queue: self.config.long_queue_every,
            warned_minimized: false,
            missing_samples: 0,
        };
        vec![Alert::QueueStarted]
    }

    fn on_match_found(&mut self) -> Vec<Alert> {
        if !self.is_queueing() {
            return Vec::new();
        }
        self.phase = Phase::MatchFound;
        vec![Alert::MatchFound]
    }

    fn on_queue_not_visible(&mut self) -> Vec<Alert> {
        let Phase::Queueing {
            missing_samples, ..
        } = &mut self.phase
        else {
            return Vec::new();
        };
        *missing_samples += 1;
        if *missing_samples < self.config.missing_samples_to_end {
            return Vec::new();
        }
        self.phase = Phase::Idle;
        vec![Alert::QueueEnded]
    }

    fn on_minimized(&mut self) -> Vec<Alert> {
        let Phase::Queueing {
            warned_minimized, ..
        } = &mut self.phase
        else {
            return Vec::new();
        };
        if *warned_minimized {
            return Vec::new();
        }
        *warned_minimized = true;
        vec![Alert::MinimizedWhileQueueing]
    }

    fn on_game_closed(&mut self) -> Vec<Alert> {
        let while_queueing = match self.phase {
            Phase::Idle => return Vec::new(),
            Phase::Queueing { .. } => true,
            Phase::MatchFound => false,
        };
        self.phase = Phase::Idle;
        self.searching_streak = 0;
        vec![Alert::GameClosed { while_queueing }]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SEARCHING: Signal = Signal::Screen(ScreenState::Searching);
    const FOUND: Signal = Signal::Screen(ScreenState::MatchFound);
    const OTHER: Signal = Signal::Screen(ScreenState::Other);

    fn queueing_tracker(start: Instant) -> Tracker {
        let mut tracker = Tracker::new(TrackerConfig::default());
        tracker.handle(SEARCHING, start);
        assert_eq!(tracker.handle(SEARCHING, start), vec![Alert::QueueStarted]);
        tracker
    }

    #[test]
    fn a_single_searching_sample_does_not_start_a_queue() {
        let mut tracker = Tracker::new(TrackerConfig::default());
        assert!(tracker.handle(SEARCHING, Instant::now()).is_empty());
        assert!(!tracker.is_queueing());
    }

    #[test]
    fn match_found_on_screen_alerts_once() {
        let now = Instant::now();
        let mut tracker = queueing_tracker(now);
        assert_eq!(tracker.handle(FOUND, now), vec![Alert::MatchFound]);
        assert!(tracker.handle(FOUND, now).is_empty());
        assert!(tracker.handle(Signal::TaskbarFlash, now).is_empty());
    }

    #[test]
    fn taskbar_flash_counts_as_match_found_only_while_queueing() {
        let now = Instant::now();
        let mut idle = Tracker::new(TrackerConfig::default());
        assert!(idle.handle(Signal::TaskbarFlash, now).is_empty());

        let mut tracker = queueing_tracker(now);
        assert_eq!(
            tracker.handle(Signal::TaskbarFlash, now),
            vec![Alert::MatchFound]
        );
    }

    #[test]
    fn queue_disappearing_without_a_match_reports_queue_ended() {
        let now = Instant::now();
        let mut tracker = queueing_tracker(now);
        assert!(tracker.handle(OTHER, now).is_empty());
        assert!(tracker.handle(OTHER, now).is_empty());
        assert_eq!(tracker.handle(OTHER, now), vec![Alert::QueueEnded]);
        assert!(!tracker.is_queueing());
    }

    #[test]
    fn a_brief_ocr_miss_does_not_end_the_queue() {
        let now = Instant::now();
        let mut tracker = queueing_tracker(now);
        tracker.handle(OTHER, now);
        tracker.handle(OTHER, now);
        tracker.handle(SEARCHING, now);
        assert!(tracker.handle(OTHER, now).is_empty());
        assert!(tracker.is_queueing());
    }

    #[test]
    fn long_queue_alerts_repeat_every_interval() {
        let start = Instant::now();
        let mut tracker = queueing_tracker(start);
        let minute = Duration::from_secs(60);
        assert!(tracker.tick(start + 9 * minute).is_empty());
        assert_eq!(
            tracker.tick(start + 10 * minute),
            vec![Alert::LongQueue { minutes: 10 }]
        );
        assert!(tracker.tick(start + 15 * minute).is_empty());
        assert_eq!(
            tracker.tick(start + 21 * minute),
            vec![Alert::LongQueue { minutes: 21 }]
        );
    }

    #[test]
    fn long_queue_alerts_can_be_disabled() {
        let start = Instant::now();
        let mut tracker = Tracker::new(TrackerConfig {
            long_queue_every: None,
            ..TrackerConfig::default()
        });
        tracker.handle(SEARCHING, start);
        tracker.handle(SEARCHING, start);
        assert!(tracker.tick(start + Duration::from_secs(3600)).is_empty());
    }

    #[test]
    fn minimizing_during_a_queue_warns_once() {
        let now = Instant::now();
        let mut tracker = queueing_tracker(now);
        assert_eq!(
            tracker.handle(Signal::Minimized(true), now),
            vec![Alert::MinimizedWhileQueueing]
        );
        assert!(tracker.handle(Signal::Minimized(true), now).is_empty());
    }

    #[test]
    fn game_closing_reports_whether_it_was_queueing() {
        let now = Instant::now();
        let mut tracker = queueing_tracker(now);
        assert_eq!(
            tracker.handle(Signal::GameRunning(false), now),
            vec![Alert::GameClosed {
                while_queueing: true
            }]
        );

        let mut tracker = queueing_tracker(now);
        tracker.handle(FOUND, now);
        assert_eq!(
            tracker.handle(Signal::GameRunning(false), now),
            vec![Alert::GameClosed {
                while_queueing: false
            }]
        );
        assert!(tracker.handle(Signal::GameRunning(false), now).is_empty());
    }

    #[test]
    fn requeueing_after_a_match_starts_a_new_queue() {
        let now = Instant::now();
        let mut tracker = queueing_tracker(now);
        tracker.handle(FOUND, now);
        tracker.handle(SEARCHING, now);
        assert_eq!(tracker.handle(SEARCHING, now), vec![Alert::QueueStarted]);
    }
}
