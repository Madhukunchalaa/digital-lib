from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

def process_three_tier_image(image_bytes: bytes) -> tuple[bytes, bytes]:
    """
    Takes raw image bytes and returns (web_optimized_webp_bytes, thumbnail_webp_bytes).
    1. Web-optimized: Resized to ~2000px longest edge, WebP @ 80% quality.
    2. Thumbnail: Resized to ~400px longest edge, WebP @ 75% quality.
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    # Ensure RGB
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
        
    # 1. Generate Web-Optimized version (~2000px)
    web_img = img.copy()
    web_img.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
    web_io = io.BytesIO()
    web_img.save(web_io, format="WEBP", quality=80, optimize=True)
    web_bytes = web_io.getvalue()
    
    # 2. Generate Thumbnail version (~400px)
    thumb_img = img.copy()
    thumb_img.thumbnail((400, 400), Image.Resampling.LANCZOS)
    thumb_io = io.BytesIO()
    thumb_img.save(thumb_io, format="WEBP", quality=75, optimize=True)
    thumb_bytes = thumb_io.getvalue()
    
    return web_bytes, thumb_bytes
