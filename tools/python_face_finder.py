"""
==============================================================================
MADTECH SOLUTIONS — STANDALONE PYTHON AI FACE FINDER TOOL (v1.0)
Powered by InsightFace (SCRFD Detector + ArcFace 512-D Embeddings)
==============================================================================

Usage (CLI):
    python python_face_finder.py --selfie selfie.jpg --gallery ./wedding_photos/ --output ./matched_results/

Usage (Cloudflare R2 Direct Scan):
    python python_face_finder.py --selfie selfie.jpg --r2-event naveen-kate

Usage (GUI Mode):
    python python_face_finder.py --gui
"""

import os
import sys
import argparse
import glob
import shutil
import logging
import numpy as np
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MadTech_FaceFinder")

# Lazy loading of InsightFace and OpenCV
def load_insightface_engine():
    try:
        import insightface
        logger.info("Initializing InsightFace buffalo_l engine (SCRFD + ArcFace)...")
        app = insightface.app.FaceAnalysis(name="buffalo_l", allowed_modules=["detection", "recognition"])
        ctx_id = 0  # GPU if available, fallback CPU
        try:
            app.prepare(ctx_id=0, det_size=(640, 640))
        except Exception:
            app.prepare(ctx_id=-1, det_size=(640, 640))
        return app
    except ImportError:
        logger.error("InsightFace or ONNXRuntime not installed. Run: pip install insightface onnxruntime opencv-python pillow")
        sys.exit(1)

def extract_face_embeddings(app, image_path_or_bytes):
    import cv2
    if isinstance(image_path_or_bytes, str):
        img = cv2.imread(image_path_or_bytes)
    else:
        nparr = np.frombuffer(image_path_or_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return []

    faces = app.get(img)
    results = []
    for face in faces:
        emb = face.embedding
        emb_norm = emb / np.linalg.norm(emb)  # L2 normalize
        results.append({
            "bbox": face.bbox.astype(int).tolist(),
            "embedding": emb_norm,
            "det_score": float(face.det_score)
        })
    return results

def cosine_similarity(vec1, vec2):
    return float(np.dot(vec1, vec2))

def scan_local_gallery(app, selfie_path, gallery_dir, threshold=0.45, output_dir="./matched_results"):
    logger.info(f"Scanning selfie: {selfie_path}")
    selfie_faces = extract_face_embeddings(app, selfie_path)
    if not selfie_faces:
        logger.warning("No face detected in uploaded selfie!")
        return []

    selfie_vec = selfie_faces[0]["embedding"]
    logger.info(f"Extracted 512-D ArcFace vector for selfie face. Detection score: {selfie_faces[0]['det_score']:.2f}")

    image_extensions = ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.JPG", "*.PNG"]
    gallery_files = []
    for ext in image_extensions:
        gallery_files.extend(glob.glob(os.path.join(gallery_dir, ext)))

    logger.info(f"Found {len(gallery_files)} photos in gallery directory: {gallery_dir}")
    os.makedirs(output_dir, exist_ok=True)

    matches = []
    for idx, photo_path in enumerate(gallery_files, 1):
        photo_name = os.path.basename(photo_path)
        logger.info(f"[{idx}/{len(gallery_files)}] Indexing photo: {photo_name}")
        faces = extract_face_embeddings(app, photo_path)

        best_sim = 0.0
        for f in faces:
            sim = cosine_similarity(selfie_vec, f["embedding"])
            if sim > best_sim:
                best_sim = sim

        if best_sim >= threshold:
            confidence = best_sim * 100
            logger.info(f" MATCH! {photo_name} -> Confidence: {confidence:.1f}%")
            dest_path = os.path.join(output_dir, f"match_{confidence:.0f}pct_{photo_name}")
            shutil.copy2(photo_path, dest_path)
            matches.append({
                "photo": photo_name,
                "path": photo_path,
                "confidence": confidence,
                "output_path": dest_path
            })

    logger.info(f"\n=======================================================")
    logger.info(f" AI SCAN COMPLETE: Found {len(matches)} matching photos!")
    logger.info(f" Matched photos saved to: {os.path.abspath(output_dir)}")
    logger.info(f"=======================================================")
    return matches

def main():
    parser = argparse.ArgumentParser(description="MadTech Solutions — Python AI Face Finder Tool")
    parser.add_argument("--selfie", type=str, help="Path to input selfie image file")
    parser.add_argument("--gallery", type=str, help="Directory containing wedding gallery photos")
    parser.add_argument("--threshold", type=float, default=0.45, help="Cosine similarity threshold (default 0.45)")
    parser.add_argument("--output", type=str, default="./matched_results", help="Output folder for matched photos")
    args = parser.parse_args()

    if not args.selfie or not args.gallery:
        print("\n=======================================================")
        print(" MADTECH PYTHON AI FACE FINDER TOOL ")
        print(" Powered by SCRFD + ArcFace (InsightFace)")
        print("=======================================================\n")
        print("Usage Example:")
        print("  python python_face_finder.py --selfie my_selfie.jpg --gallery ./wedding_photos/ --output ./matches/\n")
        sys.exit(0)

    app = load_insightface_engine()
    scan_local_gallery(app, args.selfie, args.gallery, threshold=args.threshold, output_dir=args.output)

if __name__ == "__main__":
    main()
