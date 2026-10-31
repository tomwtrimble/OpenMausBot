use crate::config::{Region, ScreenConfig};
use crate::tracker::ScreenState;

/// One line of recognised text, with its bounding box as fractions of the
/// captured frame (0.0 = left/top edge, 1.0 = right/bottom edge).
#[derive(Debug, Clone)]
pub struct TextLine {
    pub text: String,
    pub left: f32,
    pub top: f32,
    pub width: f32,
    pub height: f32,
}

impl TextLine {
    fn is_inside(&self, region: &Region) -> bool {
        let center_x = self.left + self.width / 2.0;
        let center_y = self.top + self.height / 2.0;
        (region.left..=region.right).contains(&center_x)
            && (region.top..=region.bottom).contains(&center_y)
    }
}

pub fn classify(lines: &[TextLine], config: &ScreenConfig) -> ScreenState {
    let texts: Vec<String> = lines
        .iter()
        .filter(|line| line.is_inside(&config.region))
        .map(|line| normalize(&line.text))
        .collect();
    let mentions_any = |keywords: &[String]| {
        keywords
            .iter()
            .map(|keyword| normalize(keyword))
            .any(|keyword| !keyword.is_empty() && texts.iter().any(|text| text.contains(&keyword)))
    };
    if mentions_any(&config.found_keywords) {
        ScreenState::MatchFound
    } else if mentions_any(&config.searching_keywords) {
        ScreenState::Searching
    } else {
        ScreenState::Other
    }
}

fn normalize(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .flat_map(char::to_uppercase)
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn line(text: &str, left: f32, top: f32) -> TextLine {
        TextLine {
            text: text.to_owned(),
            left,
            top,
            width: 0.1,
            height: 0.02,
        }
    }

    #[test]
    fn searching_text_in_the_region_means_searching() {
        let config = ScreenConfig::default();
        let lines = [line("Searching...", 0.45, 0.05), line("0:42", 0.48, 0.08)];
        assert_eq!(classify(&lines, &config), ScreenState::Searching);
    }

    #[test]
    fn found_text_wins_over_searching_text() {
        let config = ScreenConfig::default();
        let lines = [
            line("searching", 0.45, 0.05),
            line("GAME  FOUND!", 0.45, 0.08),
        ];
        assert_eq!(classify(&lines, &config), ScreenState::MatchFound);
    }

    #[test]
    fn text_outside_the_region_is_ignored() {
        let config = ScreenConfig::default();
        let lines = [line("searching for my keys lol", 0.02, 0.9)];
        assert_eq!(classify(&lines, &config), ScreenState::Other);
    }

    #[test]
    fn empty_keywords_never_match() {
        let config = ScreenConfig {
            searching_keywords: vec![String::new(), " ".to_owned()],
            ..ScreenConfig::default()
        };
        let lines = [line("anything", 0.45, 0.05)];
        assert_eq!(classify(&lines, &config), ScreenState::Other);
    }
}
