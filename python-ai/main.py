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
from util import get_car, read_license_plate

# ══════════════════════════════════════════════════════════════════════════
# 1. Cấu hình tham số hệ thống từ Terminal
# ══════════════════════════════════════════════════════════════════════════
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=5001, help='Port chạy Flask AI Service')
parser.add_argument('--device', type=str, default='cpu', help='Thiết bị chạy mô hình: cpu hoặc cuda')
parser.add_argument('--vehicle_weight', type=str, default='yolov8n.pt', help='Mô hình nhận diện xe')
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
    
    # Bước D: Khử nhiễu chuẩn (Đã sửa lỗi typo)
    denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
    
    # Chuyển ngược lại dạng 3 kênh màu cho OCR đầu vào
    final_img = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)
    return final_img

def is_box_inside(plate_box, vehicle_box):
    """
    Thuật toán kiểm tra hộp giới hạn (Bounding box) biển số có nằm trong vùng xe hay không.
    Giúp loại bỏ 99% trường hợp nhận diện nhầm ký tự trên áo, biển báo ven đường.
    """
    px1, py1, px2, py2 = plate_box
    vx1, vy1, vx2, vy2 = vehicle_box
    # Cho phép sai số lệch nhẹ rìa biên khoảng 10 pixel
    return (px1 >= vx1 - 10) and (py1 >= vy1 - 10) and (px2 <= vx2 + 10) and (py2 <= vy2 + 10)

def clean_plate_string(raw_text):
    if not raw_text:
        return ""
    
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
            raw_text, ocr_score = read_license_plate(processed_lp_crop)
        else:
            raw_text, ocr_score = None, 0.0

        # Chuẩn hóa chuỗi kết quả đầu ra
        detected_plate = clean_plate_string(raw_text)

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