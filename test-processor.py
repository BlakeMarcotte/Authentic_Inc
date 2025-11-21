#!/usr/bin/env python3
"""
Image processor combining smart cropping with skeletonization for clean centerline tracing
"""

import cv2
import numpy as np
import json
from pathlib import Path
from skimage.morphology import skeletonize


def process_image(image_path):
    """Process handwriting image: crop to character, then skeletonize for centerline"""
    
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
    
    skeleton = skeletonize(square_binary > 0)
    
    y_coords, x_coords = np.where(skeleton)
    
    if len(x_coords) == 0:
        print(f"⚠️  No handwriting detected after skeletonization in {image_path.name}")
        return []
    
    points = list(zip(x_coords, y_coords))
    sorted_points = sort_by_stroke_order(points)
    
    normalized = [[x / max_dim, y / max_dim] for x, y in sorted_points]
    
    print(f"✓ Processed {image_path.name}: {len(normalized)} points extracted")
    return normalized


def sort_by_stroke_order(points):
    """Sort points to follow stroke order (nearest neighbor)"""
    if len(points) <= 1:
        return points
    
    sorted_points = []
    remaining = list(points)
    
    remaining.sort(key=lambda p: (p[1], p[0]))
    sorted_points.append(remaining.pop(0))
    
    while remaining:
        last = sorted_points[-1]
        
        nearest_idx = 0
        nearest_dist = float('inf')
        
        for i, point in enumerate(remaining):
            dist = (point[0] - last[0])**2 + (point[1] - last[1])**2
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = i
        
        sorted_points.append(remaining.pop(nearest_idx))
    
    return sorted_points


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
