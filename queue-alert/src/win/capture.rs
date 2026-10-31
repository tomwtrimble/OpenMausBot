//! Reads text off the game window with Windows Graphics Capture (the API OBS
//! and the Xbox Game Bar use) and the built-in Windows OCR engine.

use std::thread;
use std::time::{Duration, Instant};

use windows::Graphics::Capture::{
    Direct3D11CaptureFrame, Direct3D11CaptureFramePool, GraphicsCaptureItem, GraphicsCaptureSession,
};
use windows::Graphics::DirectX::Direct3D11::IDirect3DDevice;
use windows::Graphics::DirectX::DirectXPixelFormat;
use windows::Graphics::Imaging::SoftwareBitmap;
use windows::Graphics::SizeInt32;
use windows::Media::Ocr::OcrEngine;
use windows::Win32::Foundation::{HMODULE, HWND};
use windows::Win32::Graphics::Direct3D::D3D_DRIVER_TYPE_HARDWARE;
use windows::Win32::Graphics::Direct3D11::{
    D3D11_CREATE_DEVICE_BGRA_SUPPORT, D3D11_SDK_VERSION, D3D11CreateDevice, ID3D11Device,
};
use windows::Win32::Graphics::Dxgi::IDXGIDevice;
use windows::Win32::System::WinRT::Direct3D11::CreateDirect3D11DeviceFromDXGIDevice;
use windows::Win32::System::WinRT::Graphics::Capture::IGraphicsCaptureItemInterop;
use windows::core::{Interface, factory};

use crate::screen_text::TextLine;

const FRAME_WAIT: Duration = Duration::from_millis(750);

pub struct WindowReader {
    window: HWND,
    device: IDirect3DDevice,
    pool: Direct3D11CaptureFramePool,
    session: GraphicsCaptureSession,
    size: SizeInt32,
    ocr: OcrEngine,
}

impl WindowReader {
    pub fn new(window: HWND) -> Result<Self, String> {
        let ocr = OcrEngine::TryCreateFromUserProfileLanguages().map_err(|e| {
            format!("Windows OCR is unavailable (install a language pack with OCR support): {e}")
        })?;
        let device = create_device().map_err(|e| format!("creating a Direct3D device: {e}"))?;
        let item = capture_item(window).map_err(|e| format!("capturing the game window: {e}"))?;
        let size = item.Size().map_err(|e| e.to_string())?;
        let pool = Direct3D11CaptureFramePool::CreateFreeThreaded(
            &device,
            DirectXPixelFormat::B8G8R8A8UIntNormalized,
            2,
            size,
        )
        .map_err(|e| format!("creating the capture frame pool: {e}"))?;
        let session = pool
            .CreateCaptureSession(&item)
            .map_err(|e| format!("creating the capture session: {e}"))?;
        // Both setters fail on Windows 10 builds that predate them; the
        // capture still works, with a cursor and a yellow border.
        let _ = session.SetIsCursorCaptureEnabled(false);
        let _ = session.SetIsBorderRequired(false);
        session
            .StartCapture()
            .map_err(|e| format!("starting the capture: {e}"))?;
        Ok(Self {
            window,
            device,
            pool,
            session,
            size,
            ocr,
        })
    }

    pub fn window(&self) -> HWND {
        self.window
    }

    /// Returns `Ok(None)` when the window produced no frame in time, which
    /// happens while it is minimized or fully static.
    pub fn read_text(&mut self) -> Result<Option<Vec<TextLine>>, String> {
        let Some(frame) = self.latest_frame() else {
            return Ok(None);
        };
        let content = frame.ContentSize().map_err(|e| e.to_string())?;
        if content.Width != self.size.Width || content.Height != self.size.Height {
            self.size = content;
            self.pool
                .Recreate(
                    &self.device,
                    DirectXPixelFormat::B8G8R8A8UIntNormalized,
                    2,
                    content,
                )
                .map_err(|e| format!("resizing the capture: {e}"))?;
            return Ok(None);
        }
        let surface = frame.Surface().map_err(|e| e.to_string())?;
        let bitmap = SoftwareBitmap::CreateCopyFromSurfaceAsync(&surface)
            .and_then(|op| op.join())
            .map_err(|e| format!("copying the frame: {e}"))?;
        let _ = frame.Close();
        recognize(&self.ocr, &bitmap).map(Some)
    }

    fn latest_frame(&self) -> Option<Direct3D11CaptureFrame> {
        while let Ok(stale) = self.pool.TryGetNextFrame() {
            let _ = stale.Close();
        }
        let deadline = Instant::now() + FRAME_WAIT;
        while Instant::now() < deadline {
            if let Ok(frame) = self.pool.TryGetNextFrame() {
                return Some(frame);
            }
            thread::sleep(Duration::from_millis(25));
        }
        None
    }
}

impl Drop for WindowReader {
    fn drop(&mut self) {
        let _ = self.session.Close();
        let _ = self.pool.Close();
    }
}

fn recognize(ocr: &OcrEngine, bitmap: &SoftwareBitmap) -> Result<Vec<TextLine>, String> {
    let width = bitmap.PixelWidth().map_err(|e| e.to_string())? as f32;
    let height = bitmap.PixelHeight().map_err(|e| e.to_string())? as f32;
    let max = OcrEngine::MaxImageDimension().map_err(|e| e.to_string())? as f32;
    if width > max || height > max {
        return Err(format!(
            "the game window ({width}x{height}) is larger than Windows OCR accepts ({max}px)"
        ));
    }
    let result = ocr
        .RecognizeAsync(bitmap)
        .and_then(|op| op.join())
        .map_err(|e| format!("running OCR: {e}"))?;
    let mut lines = Vec::new();
    for line in result.Lines().map_err(|e| e.to_string())? {
        let words = line.Words().map_err(|e| e.to_string())?;
        let (mut left, mut top, mut right, mut bottom) = (f32::MAX, f32::MAX, 0f32, 0f32);
        for word in &words {
            let rect = word.BoundingRect().map_err(|e| e.to_string())?;
            left = left.min(rect.X);
            top = top.min(rect.Y);
            right = right.max(rect.X + rect.Width);
            bottom = bottom.max(rect.Y + rect.Height);
        }
        if words.Size().unwrap_or(0) == 0 {
            continue;
        }
        lines.push(TextLine {
            text: line.Text().map_err(|e| e.to_string())?.to_string(),
            left: left / width,
            top: top / height,
            width: (right - left) / width,
            height: (bottom - top) / height,
        });
    }
    Ok(lines)
}

fn create_device() -> windows::core::Result<IDirect3DDevice> {
    let mut device: Option<ID3D11Device> = None;
    unsafe {
        D3D11CreateDevice(
            None,
            D3D_DRIVER_TYPE_HARDWARE,
            HMODULE::default(),
            D3D11_CREATE_DEVICE_BGRA_SUPPORT,
            None,
            D3D11_SDK_VERSION,
            Some(&mut device),
            None,
            None,
        )?;
    }
    let dxgi: IDXGIDevice = device
        .expect("D3D11CreateDevice returned a device")
        .cast()?;
    unsafe { CreateDirect3D11DeviceFromDXGIDevice(&dxgi) }?.cast()
}

fn capture_item(window: HWND) -> windows::core::Result<GraphicsCaptureItem> {
    let interop = factory::<GraphicsCaptureItem, IGraphicsCaptureItemInterop>()?;
    unsafe { interop.CreateForWindow(window) }
}
