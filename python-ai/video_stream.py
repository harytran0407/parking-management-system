"""
video_stream.py
===============
MJPEG HTTP stream server – chạy trên thread daemon riêng.

main.py ghi frame đã annotate vào FrameBuffer.
Dashboard (index.html) đọc qua:  <img src="http://localhost:5001/video_feed">

Không cần Flask, chỉ dùng http.server built-in để zero thêm dependency.
"""

from __future__ import annotations

import io
import threading
import time
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer

import cv2
import numpy as np

log = logging.getLogger('VideoStream')

# ── Config ─────────────────────────────────────────────────────────────────
STREAM_HOST   = '0.0.0.0'
STREAM_PORT   = 5001
JPEG_QUALITY  = 70          # 0-100; lower = faster, less bandwidth
TARGET_FPS    = 15          # cap stream frame rate
_FRAME_DELAY  = 1.0 / TARGET_FPS


# ══════════════════════════════════════════════════════════════════════════
# Shared frame buffer  (thread-safe)
# ══════════════════════════════════════════════════════════════════════════
class FrameBuffer:
    """
    Holds the latest JPEG bytes to serve to browser clients.
    main.py calls  buf.update(frame)  every processing cycle.
    """

    def __init__(self) -> None:
        self._lock  = threading.Lock()
        self._jpeg  = b''
        self._event = threading.Event()   # signals new frame available

    def update(self, frame: np.ndarray) -> None:
        """Encode BGR frame to JPEG and store."""
        ok, buf = cv2.imencode(
            '.jpg', frame,
            [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]
        )
        if ok:
            with self._lock:
                self._jpeg = buf.tobytes()
            self._event.set()

    def get(self) -> bytes:
        with self._lock:
            return self._jpeg

    def wait_for_frame(self, timeout: float = 1.0) -> bool:
        """Block until a new frame is available (or timeout)."""
        fired = self._event.wait(timeout)
        self._event.clear()
        return fired


# ── Global shared buffer (imported by main.py) ────────────────────────────
frame_buffer = FrameBuffer()


# ══════════════════════════════════════════════════════════════════════════
# HTTP handler
# ══════════════════════════════════════════════════════════════════════════
class _StreamHandler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):   # silence access logs
        pass

    def do_GET(self):
        if self.path == '/video_feed':
            self._stream_mjpeg()
        elif self.path == '/snapshot':
            self._serve_snapshot()
        elif self.path == '/':
            self._serve_index_redirect()
        else:
            self.send_error(404)

    # ── MJPEG multipart stream ─────────────────────────────────────────

    def _stream_mjpeg(self):
        self.send_response(200)
        self.send_header('Content-Type',
                         'multipart/x-mixed-replace; boundary=--jpgboundary')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        last_send = 0.0
        try:
            while True:
                # Rate-limit to TARGET_FPS
                now = time.monotonic()
                gap = _FRAME_DELAY - (now - last_send)
                if gap > 0:
                    time.sleep(gap)

                frame_buffer.wait_for_frame(timeout=2.0)
                jpeg = frame_buffer.get()
                if not jpeg:
                    continue

                self.wfile.write(
                    b'--jpgboundary\r\n'
                    b'Content-Type: image/jpeg\r\n'
                    b'Content-Length: ' + str(len(jpeg)).encode() + b'\r\n'
                    b'\r\n' + jpeg + b'\r\n'
                )
                self.wfile.flush()
                last_send = time.monotonic()

        except (BrokenPipeError, ConnectionResetError):
            pass   # client disconnected – normal
        except Exception as exc:
            log.debug(f'Stream error: {exc}')

    # ── Single JPEG snapshot ───────────────────────────────────────────

    def _serve_snapshot(self):
        jpeg = frame_buffer.get()
        if not jpeg:
            self.send_error(503, 'No frame yet')
            return
        self.send_response(200)
        self.send_header('Content-Type', 'image/jpeg')
        self.send_header('Content-Length', str(len(jpeg)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(jpeg)

    def _serve_index_redirect(self):
        self.send_response(302)
        self.send_header('Location', 'http://localhost:5000')
        self.end_headers()


# ══════════════════════════════════════════════════════════════════════════
# Server lifecycle
# ══════════════════════════════════════════════════════════════════════════
_server: HTTPServer | None = None


def start_stream_server() -> None:
    """
    Launch the MJPEG server on a daemon thread.
    Call once at application startup (before the main loop).
    """
    global _server

    _server = HTTPServer((STREAM_HOST, STREAM_PORT), _StreamHandler)
    _server.daemon_threads = True

    t = threading.Thread(target=_server.serve_forever, daemon=True)
    t.start()

    log.info(f'MJPEG stream  → http://localhost:{STREAM_PORT}/video_feed')
    log.info(f'Snapshot      → http://localhost:{STREAM_PORT}/snapshot')
    print(f'[STREAM] Video feed : http://localhost:{STREAM_PORT}/video_feed')


def stop_stream_server() -> None:
    if _server:
        _server.shutdown()