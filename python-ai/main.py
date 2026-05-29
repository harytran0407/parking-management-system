"""
main.py — AI Parking System (Bản nâng cấp đồng bộ tham số thiết bị)
===================================================================
Pipeline per frame:
  Webcam/Video → YOLOv8 vehicle detect → SORT track
        → LP detect / fallback crop
        → PaddleOCR ONNX/EasyOCR → PlateStabilizer (majority-vote buffer)
        → ParkingManager (check-in / check-out / cooldown)
        → HUD overlay + sidebar

Controls:  Q = quit   S = screenshot
"""

import argparse
import datetime
import os
import sys
import time
import cv2
import numpy as np
from ultralytics import YOLO

try:
    from sort.sort import Sort
except ImportError:
    print('[ERROR] SORT not found — clone https://github.com/abewley/sort '
          'and place the "sort/" folder next to this script.')
    sys.exit(1)

from util import get_car, read_license_plate, write_csv
from plate_stabilizer import PlateStabilizer, DisplayState
from parking_manager import ParkingManager
from video_stream import start_stream_server, frame_buffer, stop_stream_server

# ══════════════════════════════════════════════════════════════════════════
# 1. Nhận tham số cấu hình hệ thống từ Terminal (ArgumentParser)
# ══════════════════════════════════════════════════════════════════════════
parser = argparse.ArgumentParser()
parser.add_argument('--video', type=str, default='0', help='Index webcam hoặc đường dẫn file video')
parser.add_argument('--device', type=str, default='cpu', help='Thiết bị chạy mô hình: cpu hoặc cuda')
parser.add_argument('--vehicle_weight', type=str, default='yolov8n.pt', help='Mô hình nhận diện xe')
parser.add_argument('--plate_weight', type=str, default='./models/license_plate_detector.pt', help='Mô hình nhận diện biển số')
args = parser.parse_args()

# Thiết lập cấu hình động dựa trên tham số Terminal
WEBCAM_INDEX       = int(args.video) if args.video.isdigit() else args.video
YOLO_VEHICLE_MODEL = args.vehicle_weight
LP_DETECTOR_MODEL  = args.plate_weight
DEVICE             = args.device

# Các cấu hình hệ thống bãi xe
OUTPUT_CSV          = './test.csv'
VEHICLE_CLASSES     = [2, 3, 5, 7]          # COCO: car, motorbike, bus, truck
VEHICLE_CLASS_NAMES = {
    2: 'Car',
    3: 'Motorbike',
    5: 'Bus',
    7: 'Truck',
}
USE_LP_FALLBACK    = True                   # crop lower vehicle if no model
WINDOW_NAME        = 'AI Parking System  |  Q = Thoat'
HUD_W              = 360                    # sidebar width in pixels

# BGR colour palette
C_GREEN    = (0,   230, 118)
C_BLUE     = (68,  138, 255)
C_ORANGE   = (0,   165, 255)
C_RED      = (60,  60,  220)
C_YELLOW   = (0,   220, 220)
C_GREY     = (130, 130, 130)
C_DARK     = (22,  22,  30)
C_PANEL    = (28,  28,  38)
C_TITLE_BG = (42,  42,  62)
C_WHITE    = (220, 220, 220)

STATE_CLR = {
    'IDLE':      C_GREY,
    'VERIFYING': C_ORANGE,
    'CONFIRMED': C_GREEN,
}
EVENT_CLR = {
    'checkin':  C_GREEN,
    'checkout': C_BLUE,
    'cooldown': (100, 130, 60),
}

# ══════════════════════════════════════════════════════════════════════════
# 2. Khởi tạo và Ép thiết bị chạy mô hình (CPU / GPU CUDA)
# ══════════════════════════════════════════════════════════════════════════
print(f'[INFO] Loading YOLOv8 vehicle detector ({YOLO_VEHICLE_MODEL}) trên {DEVICE}...')
coco_model = YOLO(YOLO_VEHICLE_MODEL)
coco_model.to(DEVICE)

lp_model_available = os.path.isfile(LP_DETECTOR_MODEL)
if lp_model_available:
    print(f'[INFO] Loading license plate detector ({LP_DETECTOR_MODEL}) trên {DEVICE}...')
    lp_detector = YOLO(LP_DETECTOR_MODEL)
    lp_detector.to(DEVICE)
else:
    print(f'[WARN] {LP_DETECTOR_MODEL!r} không tìm thấy — kích hoạt fallback crop.')

# ══════════════════════════════════════════════════════════════════════════
# Drawing helpers
# ══════════════════════════════════════════════════════════════════════════
_FONT = cv2.FONT_HERSHEY_SIMPLEX

def draw_corner_box(img, tl, br, color, thickness=2, seg=28):
    x1, y1 = tl; x2, y2 = br
    for p, q in [
        ((x1, y1), (x1, y1+seg)), ((x1, y1), (x1+seg, y1)),
        ((x1, y2), (x1, y2-seg)), ((x1, y2), (x1+seg, y2)),
        ((x2, y1), (x2-seg, y1)), ((x2, y1), (x2, y1+seg)),
        ((x2, y2), (x2-seg, y2)), ((x2, y2), (x2, y2-seg)),
    ]:
        cv2.line(img, p, q, color, thickness)

def bg_text(img, text, org, scale=0.55, color=C_WHITE, thick=1, bg=C_DARK, pad=3):
    (tw, th), bl = cv2.getTextSize(text, _FONT, scale, thick)
    x, y = org
    cv2.rectangle(img, (x - pad, y - th - bl - pad), (x + tw + pad, y + pad), bg, -1)
    cv2.putText(img, text, (x, y - bl), _FONT, scale, color, thick, cv2.LINE_AA)

def badge(img, text, org, bg_color, scale=0.58, thick=2, pad=5):
    (tw, th), bl = cv2.getTextSize(text, _FONT, scale, thick)
    x, y = org
    cv2.rectangle(img, (x - pad, y - th - bl - pad), (x + tw + pad, y + pad), bg_color, -1)
    cv2.putText(img, text, (x, y - bl), _FONT, scale, (0, 0, 0), thick, cv2.LINE_AA)

def progress_bar(img, org, width, progress, color, height=6):
    x, y = org
    cv2.rectangle(img, (x, y), (x + width, y + height), C_DARK, -1)
    filled = int(width * min(max(progress, 0.0), 1.0))
    if filled > 0:
        cv2.rectangle(img, (x, y), (x + filled, y + height), color, -1)

# ══════════════════════════════════════════════════════════════════════════
# Per-plate overlay
# ══════════════════════════════════════════════════════════════════════════
def draw_plate_overlay(frame, x1, y1, x2, y2, ds: DisplayState, xcar1, ycar1, active_since: datetime.datetime | None):
    clr = STATE_CLR.get(ds.status, C_GREY)
    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), clr, 2)

    if ds.status == 'IDLE' or not ds.plate:
        return

    label = f'{ds.plate}  {ds.confidence:.2f}'
    bg_text(frame, label, (int(x1), int(y1) - 26), scale=0.65, color=C_YELLOW, thick=2)

    if ds.status == 'VERIFYING':
        vote_txt = f'{ds.votes}/{ds.needed}'
        bg_text(frame, vote_txt, (int(x1), int(y1) - 52), scale=0.5, color=C_ORANGE, thick=1)
        bar_w = int(x2 - x1)
        progress_bar(frame, (int(x1), int(y1) - 60), bar_w, ds.progress, C_ORANGE)
    elif ds.status == 'CONFIRMED':
        badge(frame, 'CONFIRMED', (int(x1), int(y1) - 52), C_GREEN)

    if active_since is not None:
        el = (datetime.datetime.now() - active_since).total_seconds() / 60
        el_txt = f'{int(el)}p {int((el % 1) * 60):02d}s'
        bg_text(frame, el_txt, (int(xcar1), int(ycar1) - 6), scale=0.48, color=C_GREEN, thick=1)

# ══════════════════════════════════════════════════════════════════════════
# Sidebar panel
# ══════════════════════════════════════════════════════════════════════════
def build_sidebar(h: int, mgr: ParkingManager, events: list) -> np.ndarray:
    panel = np.full((h, HUD_W, 3), C_PANEL, dtype=np.uint8)

    def txt(s, y, scale=0.50, color=C_WHITE, thick=1, x=10):
        cv2.putText(panel, s, (x, y), _FONT, scale, color, thick, cv2.LINE_AA)

    cv2.rectangle(panel, (0, 0), (HUD_W, 42), C_TITLE_BG, -1)
    txt('BAI GIU XE AI', 27, scale=0.62, color=(120, 220, 255), thick=2)
    now_str = datetime.datetime.now().strftime('%H:%M:%S')
    (tw, _), _ = cv2.getTextSize(now_str, _FONT, 0.48, 1)
    cv2.putText(panel, now_str, (HUD_W - tw - 10, 27), _FONT, 0.48, C_GREY, 1, cv2.LINE_AA)

    st = mgr.get_stats()
    y = 68
    for label, val, col in [
        ('Dang gui xe', st['currently_parked'], C_GREEN),
        ('Hom nay',     st['total_today'],      C_BLUE),
        ('Tong cong',   st['total_all_time'],   C_WHITE),
    ]:
        txt(f'{label}:', y, scale=0.48, color=C_GREY)
        val_str = str(val)
        (tw, _), _ = cv2.getTextSize(val_str, _FONT, 0.60, 2)
        cv2.putText(panel, val_str, (HUD_W - tw - 10, y), _FONT, 0.60, col, 2, cv2.LINE_AA)
        y += 26

    cv2.line(panel, (10, y + 4), (HUD_W - 10, y + 4), (55, 55, 70), 1)
    y += 16
    txt('LICH SU DETECT', y, scale=0.44, color=(110, 110, 140))
    y += 22

    for ev in reversed(events[-16:]):
        if y > h - 38:
            break
        evtype = ev['event']
        col, tag = {
            'checkin':  (C_GREEN,  '[VAO]'),
            'checkout': (C_BLUE,   '[RA ]'),
            'cooldown': (C_GREY,   '[---]'),
        }.get(evtype, (C_GREY, '[???]'))

        txt(f"{tag} {ev['plate']}  [{ev.get('vehicle_type', '?')}]", y, scale=0.48, color=col, thick=1)
        y += 17
        detail = f"     {ev['time']}"
        if ev.get('duration'):
            detail += f"  {ev['duration']}"
        txt(detail, y, scale=0.40, color=(100, 100, 110))
        y += 19

    active = mgr.active_vehicles
    if active:
        cv2.line(panel, (10, h - 28 - len(active) * 20 - 6), (HUD_W - 10, h - 28 - len(active) * 20 - 6), (55, 55, 70), 1)
        ay = h - 28 - len(active[-6:]) * 20
        for rec in active[-6:]:
            el = (datetime.datetime.now() - rec.checkin_time).total_seconds() / 60
            txt(f'[{rec.vehicle_type[:3].upper()}] {rec.license_plate}  {int(el)}p', ay, scale=0.44, color=(80, 210, 100))
            ay += 20

    cv2.rectangle(panel, (0, h - 26), (HUD_W, h), (35, 35, 48), -1)
    txt('Q=Thoat  S=Chup man hinh', h - 9, scale=0.38, color=(90, 90, 100))

    return panel

# ══════════════════════════════════════════════════════════════════════════
# 3. Khởi tạo Camera kết nối (Hỗ trợ Webcam ID hoặc Đường dẫn Video file)
# ══════════════════════════════════════════════════════════════════════════
print(f'[INFO] Opening video source: {WEBCAM_INDEX} …')
cap = cv2.VideoCapture(WEBCAM_INDEX)
if not cap.isOpened():
    print(f'[ERROR] Không thể kết nối đến nguồn video {WEBCAM_INDEX}.')
    sys.exit(1)

# Chỉ thiết lập độ phân giải nếu đầu vào là Webcam phần cứng
if isinstance(WEBCAM_INDEX, int):
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
print('[INFO] Ready. Q=quit  S=screenshot')

# ══════════════════════════════════════════════════════════════════════════
# Khởi tạo các đối tượng Runtime Tracker & Manager
# ══════════════════════════════════════════════════════════════════════════
mot_tracker = Sort()
stabilizer  = PlateStabilizer()
parking_mgr = ParkingManager()

# Bắt đầu luồng MJPEG server dưới nền cho Web dashboard
start_stream_server()

recent_events: list[dict] = []
yolo_results:  dict       = {}
frame_nmr = -1

# ══════════════════════════════════════════════════════════════════════════
# Main Loop - Vòng lặp xử lý chính từng khung hình
# ══════════════════════════════════════════════════════════════════════════
while True:
    ret, frame = cap.read()
    if not ret:
        print('[WARN] Kết thúc file video hoặc mất tín hiệu kết nối Camera.')
        break

    frame_nmr += 1
    ts_str   = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    mono_now = time.monotonic()
    yolo_results[frame_nmr] = {}

    # ── 1. Vehicle detection ─────────────────────────────────────────
    veh_dets = []
    veh_det_types: list[tuple] = []   # (x1,y1,x2,y2, vehicle_type)
    for det in coco_model(frame, verbose=False)[0].boxes.data.tolist():
        x1, y1, x2, y2, score, class_id = det
        if int(class_id) in VEHICLE_CLASSES:
            veh_dets.append([x1, y1, x2, y2, score])
            vtype = VEHICLE_CLASS_NAMES.get(int(class_id), 'Vehicle')
            veh_det_types.append((x1, y1, x2, y2, vtype))
            box_clr = C_ORANGE if vtype == 'Motorbike' else C_GREEN
            draw_corner_box(frame, (int(x1), int(y1)), (int(x2), int(y2)), box_clr, thickness=2)
            bg_text(frame, vtype, (int(x1), int(y2) + 16), scale=0.44, color=box_clr, thick=1)

    # ── 2. SORT tracking ─────────────────────────────────────────────
    track_ids = (mot_tracker.update(np.asarray(veh_dets)) if veh_dets else mot_tracker.update(np.empty((0, 5))))

    track_type_map: dict[float, str] = {}
    for tx1, ty1, tx2, ty2, tid in track_ids:
        best_iou, best_type = 0.0, 'Vehicle'
        for dx1, dy1, dx2, dy2, dtype in veh_det_types:
            ix1, iy1 = max(tx1, dx1), max(ty1, dy1)
            ix2, iy2 = min(tx2, dx2), min(ty2, dy2)
            inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
            if inter == 0:
                continue
            union = ((tx2-tx1)*(ty2-ty1) + (dx2-dx1)*(dy2-dy1) - inter)
            iou   = inter / union if union > 0 else 0.0
            if iou > best_iou:
                best_iou, best_type = iou, dtype
        track_type_map[tid] = best_type

    # ── 3. Plate regions ─────────────────────────────────────────────
    lp_regions: list[tuple] = []  # (x1,y1,x2,y2, score, from_model)

    if lp_model_available:
        for lp in lp_detector(frame, verbose=False)[0].boxes.data.tolist():
            lp_regions.append((*lp[:5], True))

    if USE_LP_FALLBACK:
        for xc1, yc1, xc2, yc2, _ in track_ids:
            if any(px1 > xc1 and py1 > yc1 and px2 < xc2 and py2 < yc2 for px1, py1, px2, py2, _, fm in lp_regions if fm):
                continue
            h_v = yc2 - yc1
            lp_regions.append((xc1, max(0, yc2 - int(h_v * 0.22)), xc2, yc2, 0.5, False))

    # ── 4. OCR → stabilizer → parking manager ────────────────────────
    active_map = {r.license_plate: r for r in parking_mgr._active.values()}

    for x1, y1, x2, y2, lp_score, from_model in lp_regions:
        fake_lp = (x1, y1, x2, y2, lp_score, 0)
        xcar1, ycar1, xcar2, ycar2, car_id = get_car(fake_lp, track_ids)
        if car_id == -1:
            continue

        lp_crop = frame[int(y1):int(y2), int(x1):int(x2)]
        if lp_crop.size == 0:
            continue

        # ── OCR (Tự động kích hoạt luồng PaddleOCR ONNX/EasyOCR từ util.py) ──
        raw_text, ocr_score = read_license_plate(lp_crop)
        vehicle_type = track_type_map.get(car_id, 'Vehicle')

        confirmed_plate = None
        if raw_text is not None:
            result = stabilizer.feed(car_id, raw_text, ocr_score or 0.0, mono_now)
            if result is not None:
                confirmed_plate = result.plate
                event = parking_mgr.process_confirmed(
                    confirmed_plate, frame,
                    votes=result.votes,
                    confidence=result.confidence,
                    vehicle_type=vehicle_type,
                )

                entry = {
                    'plate':        confirmed_plate,
                    'vehicle_type': vehicle_type,
                    'event':        event,
                    'time':         datetime.datetime.now().strftime('%H:%M:%S'),
                }
                if event == 'checkout':
                    done = [r for r in parking_mgr.history if r.license_plate == confirmed_plate and r.status == 'CHECKED_OUT']
                    if done:
                        m = done[-1].total_minutes
                        entry['duration'] = f'{int(m)}p{int((m % 1) * 60):02d}s'
                if event != 'cooldown' or (not recent_events or recent_events[-1].get('plate') != confirmed_plate):
                    recent_events.append(entry)

                stabilizer.reset(car_id)

                yolo_results[frame_nmr][car_id] = {
                    'car': {'bbox': [xcar1, ycar1, xcar2, ycar2]},
                    'license_plate': {
                        'bbox':       [x1, y1, x2, y2],
                        'text':       confirmed_plate,
                        'bbox_score': lp_score,
                        'text_score': result.confidence,
                    },
                    'vehicle_type': vehicle_type,
                    'timestamp': ts_str,
                }

        ds = stabilizer.get_state(car_id)

        if confirmed_plate:
            from plate_stabilizer import DisplayState as DS
            ds = DS(status='CONFIRMED', plate=confirmed_plate, confidence=ocr_score or 0.0, votes=0, needed=0, progress=1.0)

        plate_key = ds.plate or confirmed_plate or ''
        since = active_map.get(plate_key, None)
        since_dt = since.checkin_time if since else None

        draw_plate_overlay(frame, x1, y1, x2, y2, ds, xcar1, ycar1, since_dt)

        if confirmed_plate and recent_events:
            last_ev = recent_events[-1]
            if last_ev['plate'] == confirmed_plate:
                ev_txt = {'checkin': 'VAO', 'checkout': 'RA', 'cooldown': '...'}.get(last_ev['event'], '')
                ev_clr = EVENT_CLR.get(last_ev['event'], C_GREY)
                if ev_txt:
                    badge(frame, ev_txt, (int(x1), int(y1) - 80), ev_clr)

    # ── 5. Stabilizer housekeeping ───────────────────────────────────
    stabilizer.tick(mono_now)

    # ── 6. Frame HUD (top-left) ───────────────────────────────────────
    bg_text(frame, f'Frame {frame_nmr}  {ts_str}', (8, 22), scale=0.46, color=(160, 160, 160))
    st = parking_mgr.get_stats()
    bg_text(frame, f"Dang gui: {st['currently_parked']}  Hom nay: {st['total_today']}", (8, 44), scale=0.48, color=C_GREEN)

    # ── 7. Composite = video frame + sidebar ──────────────────────────
    sidebar   = build_sidebar(frame.shape[0], parking_mgr, recent_events)
    composite = np.hstack([frame, sidebar])
    cv2.imshow(WINDOW_NAME, composite)

    # Đẩy luồng dữ liệu hình ảnh lên browser dashboard thông qua MJPEG
    frame_buffer.update(composite)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        print('[INFO] Quitting …')
        break
    elif key == ord('s'):
        fname = f'screenshot_{frame_nmr}.jpg'
        cv2.imwrite(fname, composite)
        print(f'[INFO] Screenshot → {fname}')

# ══════════════════════════════════════════════════════════════════════════
# Cleanup và Lưu lịch sử kết quả
# ══════════════════════════════════════════════════════════════════════════
write_csv(yolo_results, OUTPUT_CSV)
print(f'[INFO] YOLO CSV           → {OUTPUT_CSV}')
print('[INFO] Parking history    → parking_history.csv')
print('[INFO] Snapshots          → snapshots/')
stop_stream_server()
cap.release()
cv2.destroyAllWindows()