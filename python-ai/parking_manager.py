"""
parking_manager.py
==================
Parking state machine – operates ONLY on confirmed (stabilised) plates.
Tích hợp đồng bộ trạng thái thời gian thực từ ASP.NET Server linh hoạt.
"""

from __future__ import annotations

import csv
import os
import time
import uuid
import datetime
import threading
import logging
import base64  
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import requests
import numpy as np

log = logging.getLogger('ParkingManager')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S',
)

# ══════════════════════════════════════════════════════════════════════════
# Config
# ══════════════════════════════════════════════════════════════════════════
COOLDOWN_SECONDS = 15          # Bộ giảm tải quét trùng biển số trong 15 giây
ASPNET_API_BASE  = 'http://localhost:5077/api/v1'  
ASPNET_TIMEOUT   = 4           # Tối ưu thời gian timeout tránh nghẽn camera
CSV_PATH         = 'parking_history.csv'
SNAPSHOT_DIR     = 'snapshots'
SAVE_SNAPSHOTS   = True

CSV_FIELDS = [
    'id', 'license_plate', 'camera_id',
    'checkin_time', 'checkout_time',
    'total_minutes', 'total_hours',
    'status', 'snapshot_path',
    'votes', 'confidence',
    'vehicle_type',
]

VEHICLE_TYPE_MAP = {
    'Motorbike': 1,
    'Car': 2,
    'Vehicle': 0
}

REVERSE_VEHICLE_TYPE_MAP = {v: k for k, v in VEHICLE_TYPE_MAP.items()}


# ══════════════════════════════════════════════════════════════════════════
# Data model
# ══════════════════════════════════════════════════════════════════════════
@dataclass
class ParkingRecord:
    id:            str
    license_plate: str
    camera_id:     str
    checkin_time:  datetime.datetime
    checkout_time: Optional[datetime.datetime] = None
    total_minutes: float = 0.0
    total_hours:   float = 0.0
    status:        str   = 'PARKING'
    snapshot_path: str   = ''
    votes:         int   = 0
    confidence:    float = 0.0
    vehicle_type:  str   = 'Vehicle'

    def to_dict(self) -> dict:
        return {
            'id':            self.id,
            'license_plate': self.license_plate,
            'camera_id':      self.camera_id,
            'checkin_time':  self.checkin_time.isoformat(sep=' '),
            'checkout_time': (self.checkout_time.isoformat(sep=' ') if self.checkout_time else ''),
            'total_minutes': round(self.total_minutes, 2),
            'total_hours':   round(self.total_hours, 4),
            'status':        self.status,
            'snapshot_path': self.snapshot_path,
            'votes':         self.votes,
            'confidence':    round(self.confidence, 3),
            'vehicle_type':  self.vehicle_type,
        }


# ══════════════════════════════════════════════════════════════════════════
# Manager
# ══════════════════════════════════════════════════════════════════════════
class ParkingManager:

    def __init__(self) -> None:
        self._lock      = threading.Lock()
        self._active:   dict[str, ParkingRecord] = {}   # plate → record
        self._last_seen: dict[str, float]        = {}   # plate → monotonic time
        self._history:  list[ParkingRecord]      = []

        Path(SNAPSHOT_DIR).mkdir(exist_ok=True)
        self._ensure_csv()
        self._load_csv()

    # ── Thuộc tính phục vụ liên kết giao diện HUD hiển thị (main.py) ──

    @property
    def active_vehicles(self) -> list[ParkingRecord]:
        """Trả về danh sách xe hiện đang đỗ trong bãi."""
        with self._lock:
            return list(self._active.values())

    @property
    def history(self) -> list[ParkingRecord]:
        """Trả về toàn bộ danh sách lịch sử bãi xe phục vụ tra cứu thời gian đỗ."""
        with self._lock:
            return self._history

    def get_stats(self) -> dict:
        """
        Tính toán thống kê nhanh số lượng xe trong ngày phục vụ giao diện HUD Sidebar.
        """
        with self._lock:
            now = datetime.datetime.now()
            today_start = datetime.datetime(now.year, now.month, now.day, 0, 0, 0)
            
            currently_parked = len(self._active)
            total_today = sum(1 for r in self._history if r.checkin_time >= today_start)
            total_all_time = len(self._history)
            
            return {
                'currently_parked': currently_parked,
                'total_today': currently_parked if total_today == 0 else total_today,
                'total_all_time': total_all_time
            }

    # ── Kiểm tra trạng thái từ Backend ──────────────────────────────────

    def check_active_session_from_backend(self, plate: str) -> Optional[ParkingRecord]:
        """
        Gọi API GET kiểm tra phiên hoạt động trực tiếp theo biển số từ ASP.NET Server.
        """
        url = f'{ASPNET_API_BASE}/parking/sessions/active/{plate}'
        log.info(f'[API GET] Kiểm tra trạng thái xe {plate} từ DB... {url}')
        
        try:
            r = requests.get(url, timeout=ASPNET_TIMEOUT)
            if r.status_code == 200:
                response_json = r.json()
                
                if response_json.get("success") is True and response_json.get("data") is not None:
                    data = response_json["data"]
                    
                    if data.get("status") in ["CHECKED_OUT", "COMPLETED"]:
                        return None
                        
                    vtype_id = data.get("vehicle_type_id", 0)
                    vtype = REVERSE_VEHICLE_TYPE_MAP.get(vtype_id, 'Vehicle')
                    
                    # Khắc phục lỗi lệch pha thời gian: Thử parse check_in_time từ Backend gửi về
                    parsed_time = datetime.datetime.now()
                    if data.get("check_in_time"):
                        try:
                            # Thay thế chữ Z để tương thích với fromisoformat của Python cũ/mới
                            raw_time_str = data.get("check_in_time").replace('Z', '+00:00')
                            parsed_time = datetime.datetime.fromisoformat(raw_time_str)
                        except Exception:
                            pass

                    rec = ParkingRecord(
                        id            = data.get("session_id", str(uuid.uuid4())[:8].upper()),
                        license_plate = data.get("license_plate_in", plate),
                        camera_id     = data.get("camera_in", "CAM-01"),
                        checkin_time  = parsed_time, 
                        status        = data.get("status", "PARKING"),
                        snapshot_path = "",
                        vehicle_type  = vtype
                    )
                    return rec
            elif r.status_code == 404:
                return None
        except Exception as e:
            log.warning(f'[API GET] Kết nối thất bại ({e}). Hệ thống tự động chuyển sang sử dụng cache Local.')
            
        return None

    # ── Main entry point ──────────────────────────────────────────────

    def process_confirmed(
        self,
        plate:        str,
        frame=None,
        votes:        int   = 0,
        confidence:   float = 0.0,
        vehicle_type: str   = 'Vehicle',
    ) -> str:
        """
        Điểm tiếp nhận chính xử lý biển số từ bộ PlateStabilizer.
        """
        now_mono = time.monotonic()
        
        # 1. Kiểm tra Cooldown trước để tránh nghẽn I/O gọi mạng liên tục
        with self._lock:
            elapsed = now_mono - self._last_seen.get(plate, 0)
            if elapsed < COOLDOWN_SECONDS:
                remaining = int(COOLDOWN_SECONDS - elapsed)
                log.debug(f'[COOLDOWN] {plate} – Còn lại {remaining}s')
                return 'cooldown'
            self._last_seen[plate] = now_mono

        # 2. Đưa tác vụ kiểm tra gọi API ra ngoài khối Lock để giữ luồng mượt mà
        backend_record = self.check_active_session_from_backend(plate)

        with self._lock:
            if backend_record is not None:
                # Đưa thông tin chuẩn từ DB vào cache xử lý checkout
                self._active[plate] = backend_record
                return self._checkout(plate, frame)
            else:
                # Không tìm thấy phiên cũ đỗ -> Xe đi vào bãi mới
                if plate in self._active:
                    self._active.pop(plate, None) 
                return self._checkin(plate, frame, votes, confidence, vehicle_type)

    # ── Check-in ──────────────────────────────────────────────────────

    def _checkin(self, plate: str, frame, votes: int, confidence: float,
                 vehicle_type: str = 'Vehicle') -> str:
        rec = ParkingRecord(
            id            = str(uuid.uuid4())[:8].upper(),
            license_plate = plate,
            camera_id     = 'CAM-01',  
            checkin_time  = datetime.datetime.now(),
            status        = 'PARKING',
            votes         = votes,
            confidence    = confidence,
            vehicle_type  = vehicle_type,
        )
        if SAVE_SNAPSHOTS and frame is not None:
            rec.snapshot_path = self._snapshot(plate, frame, 'in')

        self._active[plate] = rec
        self._history.append(rec)
        self._append_csv(rec)
        log.info(f'CHECK-IN  {plate}  votes={votes}  conf={confidence:.2f}  id={rec.id}')
        
        self._post_async('check-in', rec, frame)
        return 'checkin'

    # ── Check-out ─────────────────────────────────────────────────────

    def _checkout(self, plate: str, frame) -> str:
        rec = self._active.pop(plate)
        rec.checkout_time = datetime.datetime.now()
        
        # Tính toán chính xác thời gian đỗ xe dựa trên mốc check-in từ Backend đưa về
        delta             = rec.checkout_time - rec.checkin_time.replace(tzinfo=None)
        rec.total_minutes = max(0.0, delta.total_seconds() / 60)
        rec.total_hours   = rec.total_minutes / 60
        rec.status        = 'CHECKED_OUT'
        rec.camera_id     = 'CAM-02'   

        if SAVE_SNAPSHOTS and frame is not None:
            out_path = self._snapshot(plate, frame, 'out')
            rec.snapshot_path = out_path

        self._rewrite_csv()
        log.info(f'CHECK-OUT {plate}  Thời gian đỗ: {rec.total_minutes:.1f} phút | id={rec.id}')
        
        self._post_async('check-out', rec, frame)
        return 'checkout'

    # ── CSV ───────────────────────────────────────────────────────────

    def _ensure_csv(self) -> None:
        if not os.path.isfile(CSV_PATH):
            with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
                csv.DictWriter(f, fieldnames=CSV_FIELDS).writeheader()

    def _load_csv(self) -> None:
        try:
            with open(CSV_PATH, newline='', encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    ci = datetime.datetime.fromisoformat(row['checkin_time'])
                    co = (datetime.datetime.fromisoformat(row['checkout_time'])
                          if row.get('checkout_time') else None)
                    rec = ParkingRecord(
                        id            = row['id'],
                        license_plate = row['license_plate'],
                        camera_id     = row.get('camera_id', 'CAM-01'),
                        checkin_time  = ci,
                        checkout_time = co,
                        total_minutes = float(row.get('total_minutes') or 0),
                        total_hours   = float(row.get('total_hours')   or 0),
                        status        = row['status'],
                        snapshot_path = row.get('snapshot_path', ''),
                        votes         = int(row.get('votes')       or 0),
                        confidence    = float(row.get('confidence') or 0),
                        vehicle_type  = row.get('vehicle_type', 'Vehicle'),
                    )
                    self._history.append(rec)
                    if rec.status == 'PARKING':
                        self._active[rec.license_plate] = rec
            log.info(f'Loaded {len(self._history)} records ({len(self._active)} local PARKING)')
        except Exception as exc:
            log.warning(f'CSV load skipped: {exc}')

    def _append_csv(self, rec: ParkingRecord) -> None:
        with open(CSV_PATH, 'a', newline='', encoding='utf-8') as f:
            csv.DictWriter(f, fieldnames=CSV_FIELDS).writerow(rec.to_dict())

    def _rewrite_csv(self) -> None:
        with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            w.writeheader()
            w.writerows(r.to_dict() for r in self._history)

    def _snapshot(self, plate: str, frame, suffix: str) -> str:
        safe = re.sub(r'[^A-Z0-9]', '_', plate)
        ts   = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        path = os.path.join(SNAPSHOT_DIR, f'{safe}_{suffix}_{ts}.jpg')
        cv2.imwrite(path, frame)
        return path

    # ── ASP.NET Integration ───────────────────────────────────────────

    def _post_async(self, event: str, rec: ParkingRecord, frame: np.ndarray | None) -> None:
        threading.Thread(target=self._post, args=(event, rec, frame), daemon=True).start()

    def _post(self, event: str, rec: ParkingRecord, frame: np.ndarray | None) -> None:
        event = event.lower().strip()
        
        vehicle_type_id = VEHICLE_TYPE_MAP.get(rec.vehicle_type, 0)

        base64_image = ""
        if frame is not None and frame.size > 0:
            try:
                success, encoded_img = cv2.imencode('.jpg', frame)
                if success:
                    base64_image = base64.b64encode(encoded_img).decode('utf-8')
            except Exception as enc_exc:
                log.warning(f"Không thể xử lý ảnh Base64: {enc_exc}")

        if event == "checkin" or event == "check-in":
            url = f'{ASPNET_API_BASE}/parking/check-in'
            payload = {
                "license_plate_in": rec.license_plate,
                "vehicle_type_id": vehicle_type_id,
                "camera_in": rec.camera_id,
                "gate_in": "Gate-01",
                "image_url_in": rec.snapshot_path,  
                "staff_in_id": "SYSTEM_AI",
                "slot_id": None,
                "booking_id": None
            }
        elif event == "checkout" or event == "check-out":
            url = f'{ASPNET_API_BASE}/parking/check-out'
            payload = {
                "license_plate_out": rec.license_plate,
                "camera_out": rec.camera_id,
                "gate_out": "Gate-01",
                "image_url_out": rec.snapshot_path, 
                "staff_out_id": "usr_001"
            }
        else:
            log.warning(f"Sự kiện không được hỗ trợ: '{event}'")
            return

        try:
            headers = {"Content-Type": "application/json"}
            r = requests.post(url, json=payload, headers=headers, timeout=ASPNET_TIMEOUT)
            log.info(f'API {event.upper()} → Status: {r.status_code} | Server JSON: {r.text}')
        except requests.exceptions.ConnectionError:
            log.warning(f'API Error: Không thể kết nối tới ASP.NET Server tại ({url})')
        except Exception as exc:
            log.warning(f'API Error tại sự kiện {event}: {exc}')