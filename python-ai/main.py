import argparse
import os
import sys
import cv2
import numpy as np
import base64
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

# Import các hàm AI core từ util.py của bạn
from util import get_car, read_license_plate, USING_PADDLE, reader, preprocess_license_plate

# ══════════════════════════════════════════════════════════════════════════
# 1. Cấu hình tham số hệ thống từ Terminal
# ══════════════════════════════════════════════════════════════════════════
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=5001, help='Port chạy Flask AI Service')
parser.add_argument('--device', type=str, default='cpu', help='Thiết bị chạy mô hình: cpu hoặc cuda')
parser.add_argument('--vehicle_weight', type=str, default='./models/yolov8n.pt', help='Mô hình nhận diện xe')
parser.add_argument('--plate_weight', type=str, default='./models/license_plate_detector.pt', help='Mô hình nhận diện biển số')
args = parser.parse_args()

DEVICE             = args.device
YOLO_VEHICLE_MODEL = args.vehicle_weight
LP_DETECTOR_MODEL  = args.plate_weight
FLASK_PORT         = args.port

VEHICLE_CLASSES     = [2, 3, 5, 7]  # COCO: car, motorbike, bus, truck
VEHICLE_CLASS_NAMES = {2: 'Car', 3: 'Motorbike', 5: 'Bus', 7: 'Truck'}

# ══════════════════════════════════════════════════════════════════════════
# 2. Khởi tạo & Tải mô hình AI lên bộ nhớ
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
    print(f'[WARN] {LP_DETECTOR_MODEL!r} không tìm thấy — Kích hoạt fallback dự phòng.')

# ══════════════════════════════════════════════════════════════════════════
# 3. Các hàm bổ trợ tối ưu hóa xử lý ảnh tĩnh (Helper Functions)
# ══════════════════════════════════════════════════════════════════════════
def optimize_lp_image(crop_img):
    """
    Hàm xử lý ảnh nâng cao nâng tỷ lệ đọc chính xác của OCR đối với ảnh tĩnh.
    """
    if crop_img is None or crop_img.size == 0:
        return None
    
    # Bước A: Phóng to ảnh (Upscale) bằng phép nội suy nội khối nếu ảnh quá nhỏ
    h, w = crop_img.shape[:2]
    if w < 150 or h < 80:
        crop_img = cv2.resize(crop_img, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
    
    # Bước B: Chuyển sang ảnh xám
    gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
    
    # Bước C: Áp dụng CLAHE để tăng độ tương phản sắc nét chữ
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Bước D: Khử nhiễu chuẩn nhẹ để giữ lại nét chữ mảnh (h=5 thay vì h=10)
    denoised = cv2.fastNlMeansDenoising(enhanced, None, 5, 7, 21)
    
    # Chuyển ngược lại dạng 3 kênh màu cho OCR đầu vào
    final_img = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)
    return final_img

VALID_PROVINCES = {
    "11", "12", "14", "15", "16", "17", "18", "19",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
    "40", "43", "47", "48", "49",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
    "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
    "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
    "81", "82", "83", "84", "85", "86", "88", "89",
    "90", "92", "93", "94", "95", "97", "98", "99"
}

def is_valid_province_code(code):
    return code in VALID_PROVINCES

def read_license_plate_segments(crop):
    """
    Đọc biển số và trả về danh sách các phân đoạn raw_ocr cùng confidence_scores tương ứng từ EasyOCR/PaddleOCR.
    """
    if crop is None or crop.size == 0:
        return [], []
        
    if USING_PADDLE and reader is not None:
        try:
            results = reader.detect_and_ocr(crop)
            if results:
                raw_ocr = []
                confidence_scores = []
                for res in results:
                    text = res[0] if isinstance(res, tuple) else getattr(res, 'text', str(res))
                    score = res[1] if isinstance(res, tuple) else getattr(res, 'score', 0.85)
                    raw_ocr.append(text)
                    confidence_scores.append(score)
                return raw_ocr, confidence_scores
        except Exception:
            pass
            
    # EasyOCR / Fallback
    variants = preprocess_license_plate(crop)
    best_raw_ocr, best_confs = [], []
    best_avg_score = 0.0
    
    for img in variants:
        try:
            if USING_PADDLE and reader is not None:
                img_bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
                detections = reader.detect_and_ocr(img_bgr)
                if not detections:
                    continue
                raw_ocr = [d[0] if isinstance(d, tuple) else d for d in detections]
                confs = [d[1] if isinstance(d, tuple) else 0.85 for d in detections]
                avg_score = sum(confs) / len(confs) if confs else 0.0
            else:
                detections = reader.readtext(img)
                if not detections:
                    continue
                raw_ocr = [d[1] for d in detections]
                confs = [d[2] for d in detections]
                avg_score = sum(confs) / len(confs) if confs else 0.0
                
            if avg_score > best_avg_score:
                best_raw_ocr = raw_ocr
                best_confs = confs
                best_avg_score = avg_score
        except Exception:
            continue
            
    return best_raw_ocr, best_confs

def is_box_inside(plate_box, vehicle_box):
    """
    Thuật toán kiểm tra hộp giới hạn (Bounding box) biển số có nằm trong vùng xe hay không.
    Giúp loại bỏ 99% trường hợp nhận diện nhầm ký tự trên áo, biển báo ven đường.
    """
    px1, py1, px2, py2 = plate_box
    vx1, vy1, vx2, vy2 = vehicle_box
    # Cho phép sai số lệch nhẹ rìa biên khoảng 10 pixel
    return (px1 >= vx1 - 10) and (py1 >= vy1 - 10) and (px2 <= vx2 + 10) and (py2 <= vy2 + 10)

TO_DIGIT = {
    'O': ['0'], 'Q': ['0'], 'D': ['0'],
    'I': ['1'], 'L': ['1'], 'T': ['1'],
    'Z': ['2'],
    'E': ['3'],
    'A': ['4'],
    'S': ['5'],
    'G': ['6'], 'U': ['6'],
    'B': ['3', '8'],
    'F': ['7']
}

TO_LETTER = {
    '0': ['O', 'D'],
    '1': ['I', 'T'],
    '2': ['Z'],
    '3': ['B', 'E'],
    '4': ['A'],
    '5': ['S'],
    '6': ['G'],
    '7': ['F', 'T'],
    '8': ['B']
}

DIGIT_TO_DIGIT_TYPOS = {
    '7': ['2', '1'],
    '2': ['7'],
    '1': ['7'],
    '3': ['8'],
    '8': ['3', '0'],
    '5': ['6'],
    '6': ['5']
}

LETTER_TO_LETTER_TYPOS = {
    'F': ['E'],
    'E': ['F']
}

def get_char_candidates(char, conf, req):
    candidates = []
    
    if req == 'D':
        if char.isdigit():
            candidates.append((char, 0.0))
            if conf < 0.75:
                for alt in DIGIT_TO_DIGIT_TYPOS.get(char, []):
                    candidates.append((alt, conf))
        else:
            if conf < 0.75:
                for alt in TO_DIGIT.get(char, []):
                    candidates.append((alt, conf))
    elif req == 'L':
        if char.isalpha():
            candidates.append((char, 0.0))
            if conf < 0.75:
                for alt in LETTER_TO_LETTER_TYPOS.get(char, []):
                    candidates.append((alt, conf))
        else:
            if conf < 0.75:
                for alt in TO_LETTER.get(char, []):
                    candidates.append((alt, conf))
                    
    return candidates

def clean_ocr_text(text):
    if not text:
        return ""
    return re.sub(r'[^A-Z0-9]', '', text.upper())

def post_process_vietnamese_plate(raw_ocr, confidence_scores, boxes=None, image_meta=None):
    if not raw_ocr:
        return {
            "status": "failed",
            "confidence_status": "low",
            "formatted_plate": "",
            "error_code": "INVALID_PATTERN"
        }
    
    cleaned_items = []
    for idx, text in enumerate(raw_ocr):
        cleaned_text = clean_ocr_text(text)
        if not cleaned_text:
            continue
        score = confidence_scores[idx] if idx < len(confidence_scores) else 1.0
        box = boxes[idx] if (boxes and idx < len(boxes)) else None
        cleaned_items.append((cleaned_text, score, box, idx))
        
    if not cleaned_items:
        return {
            "status": "failed",
            "confidence_status": "low",
            "formatted_plate": "",
            "error_code": "INVALID_PATTERN"
        }
        
    # Sort segments Top-to-Bottom, Left-to-Right if boxes are provided
    has_valid_boxes = all(item[2] is not None and len(item[2]) == 4 for item in cleaned_items)
    if has_valid_boxes:
        sorted_by_y = sorted(cleaned_items, key=lambda x: x[2][1])
        lines = []
        for item in sorted_by_y:
            y1, y2 = item[2][1], item[2][3]
            h = y2 - y1
            placed = False
            for line in lines:
                ref_y1, ref_y2 = line[0][2][1], line[0][2][3]
                ref_h = ref_y2 - ref_y1
                overlap = min(y2, ref_y2) - max(y1, ref_y1)
                min_h = min(h, ref_h)
                if min_h > 0 and overlap > 0.4 * min_h:
                    line.append(item)
                    placed = True
                    break
            if not placed:
                lines.append([item])
        for line in lines:
            line.sort(key=lambda x: x[2][0])
        lines.sort(key=lambda line: sum(x[2][1] for x in line) / len(line))
        sorted_items = [item for line in lines for item in line]
    else:
        sorted_items = cleaned_items

    n = len(sorted_items)
    subsets = []
    for i in range(1, 1 << n):
        subset = [sorted_items[j] for j in range(n) if (i & (1 << j))]
        subsets.append(subset)
        
    subsets_no_low = []
    subsets_with_low = []
    for sub in subsets:
        has_low = any(item[1] < 0.50 for item in sub)
        if has_low:
            subsets_with_low.append(sub)
        else:
            subsets_no_low.append(sub)
            
    def format_car_1(s):
        if len(s) == 7:
            return f"{s[0:3]}-{s[3:7]}"
        return f"{s[0:3]}-{s[3:6]}.{s[6:8]}"
        
    def format_car_2(s):
        if len(s) == 8:
            return f"{s[0:4]}-{s[4:8]}"
        return f"{s[0:4]}-{s[4:7]}.{s[7:9]}"
        
    def format_motorbike(s):
        if len(s) == 8:
            return f"{s[0:4]}-{s[4:8]}"
        return f"{s[0:4]}-{s[4:7]}.{s[7:9]}"

    templates = [
        ("DDLDDDD", "car_1", format_car_1, 7),
        ("DDLDDDDD", "car_1_or_bike", None, 8),
        ("DDLLDDDD", "car_2", format_car_2, 8),
        ("DDLLDDDDD", "car_2", format_car_2, 9),
        ("DDLDDDDDD", "motorbike", format_motorbike, 9)
    ]
    
    def evaluate_candidate(S, confs, template):
        pos_candidates = []
        for i in range(len(S)):
            cands = get_char_candidates(S[i], confs[i], template[i])
            if not cands:
                return None, float('inf')
            pos_candidates.append(cands)
            
        best_str = None
        min_cost = float('inf')
        
        import itertools
        for comb in itertools.product(*pos_candidates):
            current_str = "".join(item[0] for item in comb)
            # Enforce valid province code!
            if len(current_str) >= 2 and not is_valid_province_code(current_str[0:2]):
                continue
            current_cost = sum(item[1] for item in comb)
            if current_cost < min_cost:
                min_cost = current_cost
                best_str = current_str
                
        if best_str is None:
            return None, float('inf')
        return best_str, min_cost

    def process_subsets(candidate_subsets):
        valid_results = []
        for sub in candidate_subsets:
            merged_text = "".join(item[0] for item in sub)
            merged_confs = []
            for item in sub:
                merged_confs.extend([item[1]] * len(item[0]))
                
            for tmpl, tmpl_type, formatter, length in templates:
                if len(merged_text) != length:
                    continue
                    
                if tmpl_type == "car_1_or_bike":
                    res_str, cost = evaluate_candidate(merged_text, merged_confs, tmpl)
                    if res_str is not None:
                        is_bike = False
                        aspect = (image_meta or {}).get("aspect_ratio", "")
                        if aspect == "square":
                            is_bike = True
                        elif aspect == "long":
                            is_bike = False
                        else:
                            if len(sub) >= 2:
                                first_seg = sub[0][0]
                                if len(first_seg) == 4 or (len(first_seg) == 2 and len(sub[1][0]) == 2):
                                    is_bike = True
                            elif len(sub) == 1:
                                is_bike = False
                        
                        if is_bike:
                            formatted = format_motorbike(res_str)
                        else:
                            formatted = format_car_1(res_str)
                            
                        valid_results.append({
                            "formatted_plate": formatted,
                            "raw_len": length,
                            "cost": cost,
                            "avg_conf": sum(merged_confs) / len(merged_confs),
                            "subset": sub,
                            "corrected_str": res_str
                        })
                else:
                    res_str, cost = evaluate_candidate(merged_text, merged_confs, tmpl)
                    if res_str is not None:
                        formatted = formatter(res_str)
                        valid_results.append({
                            "formatted_plate": formatted,
                            "raw_len": length,
                            "cost": cost,
                            "avg_conf": sum(merged_confs) / len(merged_confs),
                            "subset": sub,
                            "corrected_str": res_str
                        })
        return valid_results

    results = process_subsets(subsets_no_low)
    used_low_confidence = False
    
    if not results and subsets_with_low:
        results = process_subsets(subsets_with_low)
        used_low_confidence = True
        
    if not results:
        max_conf = max(item[1] for item in cleaned_items) if cleaned_items else 0.0
        error = "INVALID_PATTERN" if max_conf >= 0.50 else "LOW_CONFIDENCE"
        return {
            "status": "failed",
            "confidence_status": "low",
            "formatted_plate": "",
            "error_code": error
        }
        
    results.sort(key=lambda x: (x["cost"], -x["raw_len"], -x["avg_conf"]))
    best = results[0]
    
    subset_used = best["subset"]
    scores_used = [item[1] for item in subset_used]
    min_score = min(scores_used)
    cost = best["cost"]
    
    if min_score < 0.50 or best["avg_conf"] < 0.60:
        conf_status = "low"
    elif min_score < 0.75 or cost > 0.0:
        conf_status = "medium"
    else:
        conf_status = "high"
        
    return {
        "status": "success",
        "confidence_status": conf_status,
        "formatted_plate": best["formatted_plate"],
        "avg_conf": best["avg_conf"],
        "error_code": None
    }

def clean_plate_string(raw_text):
    if not raw_text:
        return ""
    
    res = post_process_vietnamese_plate([raw_text], [0.85])
    if res["status"] == "success":
        return res["formatted_plate"]
        
    cleaned = raw_text.upper().strip()
    cleaned = re.sub(r'[^A-Z0-9]', '', cleaned) 
    
    if len(cleaned) >= 7:
        prefix = cleaned[:3]   
        suffix = cleaned[3:]   
        return f"{prefix}-{suffix}"
        
    return cleaned

# ══════════════════════════════════════════════════════════════════════════
# 4. Khởi tạo Flask Server & Cấu hình API Endpoint
# ══════════════════════════════════════════════════════════════════════════
app = Flask(__name__)
CORS(app)

@app.route('/api/v1/post_process', methods=['POST'])
def post_process_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({
            "status": "failed",
            "confidence_status": "low",
            "formatted_plate": "",
            "error_code": "INVALID_PATTERN"
        }), 400
        
    raw_ocr = data.get("raw_ocr", [])
    confidence_scores = data.get("confidence_scores", [])
    boxes = data.get("bounding_boxes") or data.get("boxes") or data.get("bboxes")
    image_meta = data.get("image_meta", {})
    
    result = post_process_vietnamese_plate(raw_ocr, confidence_scores, boxes, image_meta)
    return jsonify(result), 200

@app.route('/api/v1/stream/recognize_uploaded_image', methods=['POST'])
def recognize_uploaded_image():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"success": False, "message": "Không nhận được chuỗi hình ảnh từ client React."}), 400

    try:
        # ── Bước 1: Giải mã ảnh Base64 từ Client ──
        image_data = data['image']
        if "," in image_data:
            image_data = image_data.split(",")[1]
            
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Dữ liệu ảnh bị lỗi hoặc không giải mã được."}), 400

        # ── Bước 2: Nhận diện phân loại xe diện rộng ──
        detected_vehicles = []
        for det in coco_model(frame, verbose=False)[0].boxes.data.tolist():
            x1, y1, x2, y2, score, class_id = det
            if int(class_id) in VEHICLE_CLASSES:
                v_name = VEHICLE_CLASS_NAMES.get(int(class_id), 'Vehicle')
                detected_vehicles.append((x1, y1, x2, y2, score, v_name))

        # Sắp xếp xe theo độ tin cậy giảm dần (Ưu tiên chiếc xe rõ nhất ở trung tâm ống kính)
        detected_vehicles.sort(key=lambda x: x[4], reverse=True)

        vehicle_type_name = "Motorbike"
        vehicle_type_id = 1
        best_vehicle_box = None

        if detected_vehicles:
            best_vehicle = detected_vehicles[0]
            best_vehicle_box = best_vehicle[:4] # [x1, y1, x2, y2]
            vehicle_type_name = best_vehicle[5]
            vehicle_type_id = 2 if vehicle_type_name.lower() in ['car', 'bus', 'truck'] else 1

        # ── Bước 3: Định vị vùng chứa biển số thông minh ──
        lp_crop = None
        best_lp_score = 0.0
        
        if lp_model_available:
            lp_res = lp_detector(frame, verbose=False)[0].boxes.data.tolist()
            # Sắp xếp các vùng biển số tìm thấy theo score cao nhất
            lp_res.sort(key=lambda x: x[4], reverse=True)
            
            for lx1, ly1, lx2, ly2, lscore, _ in lp_res:
                # Nếu hệ thống tìm thấy xe, ưu tiên lọc các biển số nằm TRONG thân xe
                if best_vehicle_box:
                    if is_box_inside((lx1, ly1, lx2, ly2), best_vehicle_box):
                        lp_crop = frame[int(ly1):int(ly2), int(lx1):int(lx2)]
                        best_lp_score = lscore
                        break
                else:
                    # Nếu ảnh chụp quá sát không thấy thân xe, lấy luôn vùng biển số có score tốt nhất
                    lp_crop = frame[int(ly1):int(ly2), int(lx1):int(lx2)]
                    best_lp_score = lscore
                    break

        # Luồng Fallback: Cắt ảnh dựa trên toán học hình học nếu mô hình Object bị sót
        if lp_crop is None or lp_crop.size == 0:
            if detected_vehicles:
                # Xe máy/Ô tô thường đặt biển số ở 25% trọng tâm đáy dưới của khung xe
                vx1, vy1, vx2, vy2, _, _ = detected_vehicles[0]
                h_v = vy2 - vy1
                lp_crop = frame[int(vy2 - int(h_v * 0.28)):int(vy2), int(vx1):int(vx2)]
                best_lp_score = 0.50
            else:
                # Ảnh chụp cận cảnh, lấy nửa dưới của ảnh làm vùng quét dự phòng
                h_f, w_f, _ = frame.shape
                lp_crop = frame[int(h_f * 0.45):, :]
                best_lp_score = 0.40

        # ── Bước 4: Tối ưu hóa chất lượng ảnh vùng biển trước khi OCR ──
        processed_lp_crop = optimize_lp_image(lp_crop)

        # ── Bước 5: Chạy mô hình OCR (PaddleOCR ONNX / EasyOCR) ──
        if processed_lp_crop is not None and processed_lp_crop.size > 0:
            raw_ocr, confidence_scores = read_license_plate_segments(processed_lp_crop)
            post_res = post_process_vietnamese_plate(
                raw_ocr,
                confidence_scores,
                image_meta={"aspect_ratio": "square" if vehicle_type_id == 1 else "long"}
            )
            if post_res["status"] == "success":
                detected_plate = post_res["formatted_plate"]
                ocr_score = post_res["avg_conf"]
            else:
                detected_plate = None
                ocr_score = 0.0
        else:
            detected_plate = None
            ocr_score = 0.0

        # ── Bước 6: Phản hồi JSON đạt chuẩn cấu trúc cho Client ──
        if detected_plate and len(detected_plate) >= 4:  # Biển số hợp lệ tối thiểu phải từ 4 ký tự trở lên
            print(f"[AI OPTIMIZED SUCCESS] Plate: {detected_plate} | Type: {vehicle_type_name} | Score: {ocr_score}")
            return jsonify({
                "success": True,
                "plate": detected_plate,
                "vehicle_type_id": vehicle_type_id,
                "vehicle_type_name": vehicle_type_name,
                "confidence": float(ocr_score) if ocr_score else float(best_lp_score),
                "message": "AI phân tích ảnh đơn lẻ tối ưu thành công!"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Hệ thống phát hiện được phương tiện nhưng chất lượng ảnh không đủ để bóc tách chữ số."
            }), 422 # Khuyên dùng mã 422 (Unprocessable Entity) thay vì 400 để phân biệt lỗi logic AI

    except Exception as e:
        print(f"[AI CRITICAL ERROR] Lỗi xử lý: {str(e)}")
        return jsonify({"success": False, "message": f"Lỗi xử lý hệ thống: {str(e)}"}), 500

if __name__ == '__main__':
    print(f'[INFO] Starting Optimized AI Parking API Server tại port {FLASK_PORT}...')
    app.run(host='0.0.0.0', port=FLASK_PORT, debug=False, threaded=True)