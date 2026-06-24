import base64
import numpy as np
import cv2
from flask import jsonify, request

@app.route('/api/v1/stream/recognize_uploaded_image', methods=['POST'])
def recognize_uploaded_image():
    """
    [ENDPOINT MỚI]: Tiếp nhận ảnh Base64 do React chụp từ client,
    giải mã thành ma trận OpenCV và chuyển thẳng vào pipeline OCR.
    """
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"success": False, "message": "Không nhận được dữ liệu hình ảnh."}), 400

    try:
        image_data = data['image']
        if "," in image_data:
            # Tách bỏ chuỗi header "data:image/jpeg;base64," nếu phía React gửi full định dạng URI
            image_data = image_data.split(",")[1]
            
        # Giải mã Base64 sang mã byte OpenCV có thể đọc được
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"success": False, "message": "Định dạng ảnh không hợp lệ."}), 400

        # Gọi hàm đọc biển số xe từ util.py giống như main.py đang làm
        from util import read_license_plate
        raw_text, ocr_score = read_license_plate(img)
        
        if raw_text:
            detected_plate = raw_text.upper().strip().replace(" ", "").replace("-", "")
            
            # Phân loại xe sơ bộ (2: Ô tô nếu chuỗi ký tự chứa manh mối, ngược lại là 1: Xe máy)
            vehicle_type_id = 2 if any(x in detected_plate for x in ["CAR", "TAXI"]) else 1
            
            print(f"[AI SNAPSHOT] Đọc thành công biển số: {detected_plate}")
            return jsonify({
                "success": True,
                "plate": detected_plate,
                "vehicle_type_id": vehicle_type_id,
                "message": "AI nhận diện ảnh tĩnh thành công!"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Không tìm thấy hoặc không đọc được ký tự biển số trong ảnh chụp."
            }), 400

    except Exception as e:
        print(f"[AI ERROR] Lỗi xử lý ảnh: {str(e)}")
        return jsonify({"success": False, "message": f"Lỗi hệ thống AI: {str(e)}"}), 500