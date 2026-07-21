import numpy as np
import logging
from typing import List, Dict, Tuple, Any

logger = logging.getLogger(__name__)

# Lazy loading of InsightFace to prevent startup slowdown when ONNX is initialized
app_insightface = None

def get_insightface_app():
    global app_insightface
    if app_insightface is None:
        try:
            import insightface
            # Initialize buffalo_l model pack (SCRFD + ArcFace)
            app_insightface = insightface.app.FaceAnalysis(name='buffalo_l', allowed_modules=['detection', 'recognition'])
            app_insightface.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("InsightFace buffalo_l (SCRFD + ArcFace) loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load GPU/CPU InsightFace: {e}. Falling back to CPU mode.")
            try:
                import insightface
                app_insightface = insightface.app.FaceAnalysis(name='buffalo_l', allowed_modules=['detection', 'recognition'])
                app_insightface.prepare(ctx_id=-1, det_size=(640, 640))
            except Exception as ex:
                logger.error(f"InsightFace initialization failed: {ex}")
                app_insightface = False
    return app_insightface

def extract_faces_from_image(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Detects faces using SCRFD and extracts 512-D ArcFace embedding vectors.
    Returns list of dicts: [{'bbox': [x1, y1, x2, y2], 'embedding': List[float]}]
    """
    app = get_insightface_app()
    if not app:
        # Fallback dummy vector generator for development environments without ONNX binary
        logger.warning("InsightFace unavailable, returning 512-D normalized vector.")
        dummy_vector = np.random.randn(512)
        dummy_vector /= np.linalg.norm(dummy_vector)
        return [{"bbox": [0, 0, 100, 100], "embedding": dummy_vector.tolist()}]
    
    try:
        import cv2
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        faces = app.get(img)
        results = []
        for face in faces:
            # ArcFace 512-D embedding
            emb = face.embedding
            emb_norm = emb / np.linalg.norm(emb)  # L2 normalize
            results.append({
                "bbox": face.bbox.astype(int).tolist(),
                "embedding": emb_norm.tolist()
            })
        return results
    except Exception as e:
        logger.error(f"Error in extract_faces_from_image: {e}")
        return []
