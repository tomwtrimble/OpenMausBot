//! Hears the taskbar flash Overwatch raises when a match is found while it is
//! not the focused window, through the shell hook Windows offers taskbar
//! replacements.

use std::cell::RefCell;
use std::sync::mpsc::Sender;

use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DefWindowProcW, DispatchMessageW, GetMessageW, HSHELL_HIGHBIT, HSHELL_REDRAW,
    MSG, RegisterClassW, RegisterShellHookWindow, RegisterWindowMessageW, TranslateMessage,
    WINDOW_EX_STYLE, WNDCLASSW, WS_OVERLAPPED,
};
use windows::core::w;

use super::game;
use crate::tracker::Signal;

const HSHELL_FLASH: usize = (HSHELL_REDRAW | HSHELL_HIGHBIT) as usize;

struct Listener {
    shell_message: u32,
    process_name: String,
    signals: Sender<Signal>,
}

thread_local! {
    static LISTENER: RefCell<Option<Listener>> = const { RefCell::new(None) };
}

/// Blocks the calling thread running a message loop.
pub fn listen(process_name: String, signals: Sender<Signal>) -> Result<(), String> {
    let instance = unsafe { GetModuleHandleW(None) }.map_err(|e| e.to_string())?;
    let class = WNDCLASSW {
        lpfnWndProc: Some(window_proc),
        hInstance: instance.into(),
        lpszClassName: w!("QueueAlertShellHook"),
        ..Default::default()
    };
    if unsafe { RegisterClassW(&class) } == 0 {
        return Err("registering the shell hook window class failed".to_owned());
    }
    // Shell hooks are only delivered to top-level windows, so this is a
    // hidden top-level window rather than a message-only one.
    let window = unsafe {
        CreateWindowExW(
            WINDOW_EX_STYLE::default(),
            w!("QueueAlertShellHook"),
            w!("queue-alert"),
            WS_OVERLAPPED,
            0,
            0,
            0,
            0,
            None,
            None,
            Some(instance.into()),
            None,
        )
    }
    .map_err(|e| format!("creating the shell hook window: {e}"))?;

    let shell_message = unsafe { RegisterWindowMessageW(w!("SHELLHOOK")) };
    LISTENER.with_borrow_mut(|listener| {
        *listener = Some(Listener {
            shell_message,
            process_name,
            signals,
        })
    });
    if !unsafe { RegisterShellHookWindow(window) }.as_bool() {
        return Err("registering for taskbar flashes failed".to_owned());
    }

    let mut message = MSG::default();
    while unsafe { GetMessageW(&mut message, None, 0, 0) }.as_bool() {
        unsafe {
            let _ = TranslateMessage(&message);
            DispatchMessageW(&message);
        }
    }
    Ok(())
}

unsafe extern "system" fn window_proc(
    window: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    LISTENER.with_borrow(|listener| {
        let Some(listener) = listener else { return };
        if message != listener.shell_message || wparam.0 != HSHELL_FLASH {
            return;
        }
        let flashed = HWND(lparam.0 as *mut _);
        let is_game = game::find_pid(&listener.process_name) == Some(game::window_pid(flashed));
        if is_game {
            let _ = listener.signals.send(Signal::TaskbarFlash);
        }
    });
    unsafe { DefWindowProcW(window, message, wparam, lparam) }
}
