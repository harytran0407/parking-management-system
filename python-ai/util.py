"""
util.py — AI Parking System (Bản nâng cấp tích hợp PaddleOCR ONNX & EasyOCR)
Low-level helpers:
  • Image preprocessing pipeline for license-plate crops
  • PaddleOCR ONNX Pipeline / EasyOCR wrapper
  • Vehicle-to-plate assignment (get_car)
  • CSV writer for YOLO frame results
"""

import os
import cv2
import numpy as np

# ── 1. Khởi tạo bộ đọc OCR (Ưu tiên PaddleOCR ONNX, Fallback EasyOCR) ──────
USING_PADDLE = False
reader = None

try:
    # pyrefly: ignore [missing-import]
    from ppocr_onnx.pipeline import DetAndRecONNXPipeline
    
    # Định nghĩa đường dẫn tới các file model ONNX của repo gốc
    det_model_path = 'weights/ppocrv4/det_model.onnx'
    rec_model_path = 'weights/ppocrv4/updated_model_dyn.onnx'
    
    # Phương án dự phòng nếu file nằm ngay ngoài thư mục gốc
    if not os.path.exists(rec_model_path) and os.path.exists('updated_model_dyn.onnx'):
        rec_model_path = 'updated_model_dyn.onnx'
        
    reader = DetAndRecONNXPipeline(
        text_det_onnx_model=det_model_path if os.path.exists(det_model_path) else None,
        text_rec_onnx_model=rec_model_path,
    )
    USING_PADDLE = True
    print("[INFO] Đã khởi tạo thành công PaddleOCRv4 ONNX Pipeline.")
except Exception as e:
    print(f"[WARN] Không thể tải PaddleOCR ONNX ({e}). Fallback sử dụng EasyOCR.")
    import easyocr
    reader = easyocr.Reader(['en'], gpu=False)
    USING_PADDLE = False


# ── 2. Tiền xử lý hình ảnh biển số ────────────────────────────────────────
def preprocess_license_plate(crop: np.ndarray) -> list[np.ndarray]:
    """Tạo ra các biến thể ảnh khác nhau để tối ưu hóa khả năng đọc chữ"""
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if crop.ndim == 3 else crop.copy()
    h, w = gray.shape[:2]
    if h < 64:
        scale = 64 / h
        gray = cv2.resize(gray, (int(w * scale), 64), interpolation=cv2.INTER_CUBIC)
    
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    clahe     = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    clahe_img = clahe.apply(denoised)
    
    _, otsu = cv2.threshold(clahe_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(clahe_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)
    
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharp  = cv2.filter2D(clahe_img, -1, kernel)
    
    return [clahe_img, otsu, cv2.bitwise_not(otsu), adaptive, sharp]


# ── 3. Hàm đọc chữ từ biển số xe (Core OCR) ───────────────────────────────
def read_license_plate(crop: np.ndarray) -> tuple[str | None, float | None]:
    """Đọc biển số và trả về chuỗi chữ viết hoa sạch cùng độ tin cậy score"""
    if USING_PADDLE and reader is not None:
        try:
            results = reader.detect_and_ocr(crop)
            if results:
                combined = ''
                total_score = 0.0
                for res in results:
                    text = res[0] if isinstance(res, tuple) else getattr(res, 'text', str(res))
                    score = res[1] if isinstance(res, tuple) else getattr(res, 'score', 0.85)
                    clean_text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
                    combined += clean_text
                    total_score += score
                return combined, (total_score / len(results))
        except Exception:
            pass # Nếu dòng Paddle lỗi, tự động nhảy xuống bộ biến thể ảnh phía dưới
            
    # Bộ xử lý biến thể ảnh (Áp dụng cho EasyOCR hoặc cứu cánh PaddleOCR)
    variants = preprocess_license_plate(crop)
    best_text, best_score = None, 0.0

    for img in variants:
        try:
            if USING_PADDLE and reader is not None:
                img_bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
                detections = reader.detect_and_ocr(img_bgr)
                if not detections: continue
                combined = ''.join([str(d[0] if isinstance(d, tuple) else d).upper().replace(' ', '') for d in detections])
                avg_score = 0.85
            else:
                detections = reader.readtext(img)
                if not detections: continue
                combined = ''
                total_score = 0.0
                for _, text, score in detections:
                    combined += text.upper().replace(' ', '').replace('-', '').replace('.', '')
                    total_score += score
                avg_score = total_score / len(detections)

            if combined and avg_score > best_score:
                best_text  = combined
                best_score = avg_score
        except Exception:
            continue

    return (best_text, best_score) if best_text else (None, None)


# ── 4. Hàm map Biển số vào Phương tiện (Hàm bị thiếu gây lỗi) ─────────────
def get_car(license_plate, vehicle_track_ids):
    """
    Dựa trên tọa độ box của biển số để tìm ra ID chiếc xe tương ứng (IoU / Giao góc)
    Tọa độ đầu vào: license_plate = (x1, y1, x2, y2, score, ...)
    """
    x1, y1, x2, y2, _, _ = license_plate

    xcar1, ycar1, xcar2, ycar2, car_id = -1, -1, -1, -1, -1
    for j in range(len(vehicle_track_ids)):
        x1_c, y1_c, x2_c, y2_c, c_id = vehicle_track_ids[j]
        
        # Kiểm tra xem tâm hoặc vùng biển số có nằm gọn bên trong bounding box của xe không
        if x1 > x1_c and y1 > y1_c and x2 < x2_c and y2 < y2_c:
            xcar1, ycar1, xcar2, ycar2, car_id = x1_c, y1_c, x2_c, y2_c, int(c_id)
            break

    return xcar1, ycar1, xcar2, ycar2, car_id


# ── 5. Xuất báo cáo dữ liệu dạng CSV ──────────────────────────────────────
def write_csv(results, output_path):
    """Ghi toàn bộ lịch sử tracking frame và text biển số ra file CSV"""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('frame_nmr,car_id,car_bbox,license_plate_bbox,license_plate_bbox_score,license_number,license_number_score,vehicle_type,timestamp\n')
        
        for frame_nmr in sorted(results.keys()):
            for car_id in results[frame_nmr].keys():
                car_data = results[frame_nmr][car_id]
                
                if 'car' not in car_data or 'license_plate' not in car_data:
                    continue
                    
                cb = car_data['car']['bbox']
                lp = car_data['license_plate']
                lb = lp['bbox']
                vt = car_data.get('vehicle_type', 'Vehicle')
                text = lp.get('text', '')
                text_score = lp.get('text_score', 0.0)

                f.write('{},{},[{} {} {} {}],[{} {} {} {}],{:.4f},{},{:.4f},{},{}\n'.format(
                    frame_nmr, car_id,
                    cb[0], cb[1], cb[2], cb[3],
                    lb[0], lb[1], lb[2], lb[3],
                    lp.get('bbox_score', 0.0),
                    text, text_score, vt,
                    car_data.get('timestamp', '')
                ))


# ── 6. Fallback cắt ảnh xe khi không có model Detector Biển số ─────────────
def crop_lower_vehicle(frame: np.ndarray, car_bbox: tuple, ratio: float = 0.22) -> np.ndarray:
    """Cắt vùng 22% phía dưới của xe để dự đoán vị trí đặt biển số"""
    x1, y1, x2, y2 = map(int, car_bbox[:4])
    h = y2 - y1
    crop_y1 = max(y1, y2 - int(h * ratio))
    return frame[crop_y1:y2, x1:x2]
