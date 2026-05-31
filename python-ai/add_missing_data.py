"""
Interpolates missing bounding-box frames in test.csv and writes
test_interpolated.csv.  Works with the updated CSV that includes
a 'timestamp' column (value is carried from the nearest real row).
"""

import csv
import numpy as np
from scipy.interpolate import interp1d


def interpolate_bounding_boxes(data):
    frame_numbers = np.array([int(row['frame_nmr']) for row in data])
    car_ids       = np.array([int(float(row['car_id'])) for row in data])
    car_bboxes    = np.array([
        list(map(float, row['car_bbox'][1:-1].split()))
        for row in data
    ])
    lp_bboxes     = np.array([
        list(map(float, row['license_plate_bbox'][1:-1].split()))
        for row in data
    ])

    interpolated_data = []

    for car_id in np.unique(car_ids):
        frame_numbers_ = [
            p['frame_nmr'] for p in data
            if int(float(p['car_id'])) == int(float(car_id))
        ]
        print(frame_numbers_, car_id)

        mask = car_ids == car_id
        car_frame_numbers = frame_numbers[mask]

        car_bboxes_interp = []
        lp_bboxes_interp  = []

        first_frame = car_frame_numbers[0]

        for i in range(len(car_bboxes[mask])):
            fn       = car_frame_numbers[i]
            cb       = car_bboxes[mask][i]
            lb       = lp_bboxes[mask][i]

            if i > 0:
                prev_fn = car_frame_numbers[i - 1]
                prev_cb = car_bboxes_interp[-1]
                prev_lb = lp_bboxes_interp[-1]

                if fn - prev_fn > 1:
                    gap   = fn - prev_fn
                    x     = np.array([prev_fn, fn])
                    x_new = np.linspace(prev_fn, fn, num=gap, endpoint=False)

                    f_cb = interp1d(x, np.vstack((prev_cb, cb)), axis=0)
                    f_lb = interp1d(x, np.vstack((prev_lb, lb)), axis=0)

                    car_bboxes_interp.extend(f_cb(x_new)[1:])
                    lp_bboxes_interp.extend(f_lb(x_new)[1:])

            car_bboxes_interp.append(cb)
            lp_bboxes_interp.append(lb)

        for i, (cb, lb) in enumerate(zip(car_bboxes_interp, lp_bboxes_interp)):
            fn  = first_frame + i
            row = {
                'frame_nmr':           str(fn),
                'car_id':              str(car_id),
                'car_bbox':            ' '.join(map(str, cb)),
                'license_plate_bbox':  ' '.join(map(str, lb)),
            }

            if str(fn) not in frame_numbers_:
                row['license_plate_bbox_score'] = '0'
                row['license_number']           = '0'
                row['license_number_score']     = '0'
                row['timestamp']                = ''
                row['vehicle_type']             = ''
            else:
                orig = next(
                    p for p in data
                    if int(p['frame_nmr']) == fn
                    and int(float(p['car_id'])) == int(float(car_id))
                )
                row['license_plate_bbox_score'] = orig.get('license_plate_bbox_score', '0')
                row['license_number']           = orig.get('license_number', '0')
                row['license_number_score']     = orig.get('license_number_score', '0')
                row['timestamp']                = orig.get('timestamp', '')
                row['vehicle_type']             = orig.get('vehicle_type', '')

            interpolated_data.append(row)

    return interpolated_data


# ── Run ────────────────────────────────────────────────────────────────────
with open('test.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data   = list(reader)

interpolated = interpolate_bounding_boxes(data)

header = [
    'frame_nmr', 'car_id', 'car_bbox', 'license_plate_bbox',
    'license_plate_bbox_score', 'license_number', 'license_number_score',
    'vehicle_type', 'timestamp',
]
with open('test_interpolated.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=header)
    writer.writeheader()
    writer.writerows(interpolated)

print('[INFO] test_interpolated.csv written.')