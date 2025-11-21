#!/usr/bin/env python3
"""
Contour-based processor: trace original stroke paths, smooth with splines
"""

import cv2
import numpy as np
import json
from pathlib import Path
from scipy.interpolate import splprep, splev


def process_image(image_path):
    """Process handwriting using contour approximation"""
    
    img = cv2.imread(str(image_path))
    if img is None:
        print(f"❌ Could not read {image_path}")
        return []
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary = cv2.threshold(blurred, 180, 255, cv2.THRESH_BINARY_INV)
    
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print(f"⚠️  No content detected in {image_path.name}")
        return []
    
    filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 100]
    if not filtered_contours:
        print(f"⚠️  No significant content detected in {image_path.name}")
        return []
    
    x, y, w, h = cv2.boundingRect(np.vstack(filtered_contours))
    
    padding = 20
    x = max(0, x - padding)
    y = max(0, y - padding)
    w = min(gray.shape[1] - x, w + 2 * padding)
    h = min(gray.shape[0] - y, h + 2 * padding)
    
    cropped_gray = gray[y:y+h, x:x+w]
    cropped_binary = binary[y:y+h, x:x+w]
    
    max_dim = max(w, h)
    square = np.ones((max_dim, max_dim), dtype=np.uint8) * 255
    y_offset = (max_dim - h) // 2
    x_offset = (max_dim - w) // 2
    square[y_offset:y_offset+h, x_offset:x_offset+w] = cropped_gray
    
    _, square_binary = cv2.threshold(square, 180, 255, cv2.THRESH_BINARY_INV)
    
    contours, _ = cv2.findContours(square_binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_L1)
    
    print(f"  - Found {len(contours)} contour(s)")
    
    all_points = []
    
    for i, contour in enumerate(contours):
        if len(contour) < 10:
            continue
        
        epsilon = 0.01 * cv2.arcLength(contour, False)
        approx = cv2.approxPolyDP(contour, epsilon, False)
        
        points = [(pt[0][0], pt[0][1]) for pt in approx]
        
        if len(points) >= 4:
            smoothed = smooth_path_with_spline(points, smoothness=5, num_points=50)
            all_points.extend(smoothed)
            print(f"  - Contour {i+1}: {len(contour)} → {len(approx)} → {len(smoothed)} points")
        else:
            all_points.extend(points)
            print(f"  - Contour {i+1}: {len(contour)} → {len(points)} points (too short to smooth)")
    
    normalized = [[x / max_dim, y / max_dim] for x, y in all_points]
    
    print(f"✓ Processed {image_path.name}: {len(normalized)} points")
    return normalized


def smooth_path_with_spline(points, smoothness=0, num_points=50):
    """Smooth path using cubic spline interpolation"""
    if len(points) < 4:
        return points
    
    points = np.array(points)
    x = points[:, 0]
    y = points[:, 1]
    
    try:
        tck, u = splprep([x, y], s=smoothness, k=min(3, len(points)-1))
        u_new = np.linspace(0, 1, num_points)
        x_new, y_new = splev(u_new, tck)
        return list(zip(x_new, y_new))
    except:
        return points


def main():
    print("\n🚀 Processing test images...\n")
    
    test_dir = Path(__file__).parent / "test-data"
    characters = ['A']
    image_files = ['A.png']
    
    glyphs = []
    
    for char, filename in zip(characters, image_files):
        image_path = test_dir / filename
        
        if not image_path.exists():
            print(f"⚠️  File not found: {image_path}")
            continue
        
        print(f'Processing "{char}" from {filename}...')
        points = process_image(image_path)
        
        if points:
            glyphs.append({
                "char": char,
                "strokes": [points]
            })
    
    if not glyphs:
        print("\n❌ No glyphs processed.\n")
        return
    
    output = {
        "fontName": f"test_{Path(__file__).stem}",
        "glyphs": glyphs
    }
    
    output_path = test_dir / "test-output.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Success! Processed {len(glyphs)} character(s)")
    print(f"📄 Output saved to: {output_path}\n")


if __name__ == "__main__":
    main()
