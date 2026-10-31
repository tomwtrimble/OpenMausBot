//! Locates the game using only the process list and the window list.
//!
//! Security invariant: nothing here may open a handle to the game process,
//! read its memory or send it input. Anti-cheat treats those as cheating;
//! listing processes and windows is what every task manager does.

use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM};
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, PROCESSENTRY32W, Process32FirstW, Process32NextW, TH32CS_SNAPPROCESS,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GW_OWNER, GetWindow, GetWindowThreadProcessId, IsIconic, IsWindowVisible,
};
use windows::core::BOOL;

#[derive(Debug, Clone, Copy)]
pub struct Game {
    pub window: Option<HWND>,
}

impl Game {
    pub fn is_minimized(&self) -> bool {
        self.window
            .is_some_and(|window| unsafe { IsIconic(window) }.as_bool())
    }
}

pub fn find(process_name: &str) -> Option<Game> {
    let pid = find_pid(process_name)?;
    Some(Game {
        window: main_window(pid),
    })
}

pub fn find_pid(process_name: &str) -> Option<u32> {
    let snapshot = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) }.ok()?;
    let mut entry = PROCESSENTRY32W {
        dwSize: size_of::<PROCESSENTRY32W>() as u32,
        ..Default::default()
    };
    let mut found = None;
    let mut more = unsafe { Process32FirstW(snapshot, &mut entry) }.is_ok();
    while more {
        let len = entry
            .szExeFile
            .iter()
            .position(|&c| c == 0)
            .unwrap_or(entry.szExeFile.len());
        let name = String::from_utf16_lossy(&entry.szExeFile[..len]);
        if name.eq_ignore_ascii_case(process_name) {
            found = Some(entry.th32ProcessID);
            break;
        }
        more = unsafe { Process32NextW(snapshot, &mut entry) }.is_ok();
    }
    let _ = unsafe { CloseHandle(snapshot) };
    found
}

pub fn window_pid(window: HWND) -> u32 {
    let mut pid = 0;
    unsafe { GetWindowThreadProcessId(window, Some(&mut pid)) };
    pid
}

fn main_window(pid: u32) -> Option<HWND> {
    struct Search {
        pid: u32,
        found: Option<HWND>,
    }

    unsafe extern "system" fn visit(window: HWND, lparam: LPARAM) -> BOOL {
        let search = unsafe { &mut *(lparam.0 as *mut Search) };
        let is_top_level = unsafe { GetWindow(window, GW_OWNER) }.is_err();
        let visible = unsafe { IsWindowVisible(window) }.as_bool();
        if visible && is_top_level && window_pid(window) == search.pid {
            search.found = Some(window);
            return false.into();
        }
        true.into()
    }

    let mut search = Search { pid, found: None };
    let _ = unsafe { EnumWindows(Some(visit), LPARAM(&mut search as *mut Search as isize)) };
    search.found
}
