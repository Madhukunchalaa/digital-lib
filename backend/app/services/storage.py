import boto3
from botocore.config import Config
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def get_s3_client():
    """Initializes Boto3 client for Cloudflare R2 / Backblaze B2 / AWS S3."""
    if settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID:
        endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        return boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto"
        )
    return None

def upload_file_to_r2(file_bytes: bytes, key: str, content_type: str = "image/webp") -> str:
    """Uploads bytes to Cloudflare R2 and returns public URL key."""
    client = get_s3_client()
    if client:
        try:
            client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
                Body=file_bytes,
                ContentType=content_type
            )
            return f"{settings.R2_PUBLIC_DOMAIN}/{key}"
        except Exception as e:
            logger.error(f"Error uploading to R2: {e}")
    # Local fallback URL path
    return f"assets/{key}"
