import mimetypes
import os
import uuid
from typing import List, Set
from fastapi import UploadFile, HTTPException

from .config import settings

ALLOWED_EXTENSIONS = {
    "audio":    {".mp3", ".wav", ".m4a", ".ogg", ".flac"},
    "image":    {".jpg", ".jpeg", ".png", ".webp"},
    "code":     {".py", ".js", ".ts", ".java", ".go", ".rs", ".cpp", ".c", ".rb", ".php", ".html", ".css", ".txt", ".json"},
    "document": {".pdf", ".docx", ".doc", ".txt", ".md"},
    "archive":  {".zip"},
}

MAX_FILE_SIZES = {
    "audio":    settings.MAX_AUDIO_SIZE,
    "image":    settings.MAX_IMAGE_SIZE,
    "code":      settings.MAX_CODE_SIZE,
    "document": settings.MAX_DOCUMENT_SIZE,
    "archive":  settings.MAX_ARCHIVE_SIZE,
}

def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

def is_extension_allowed(ext: str, category: str) -> bool:
    allowed = ALLOWED_EXTENSIONS.get(category)
    if not allowed:
        return False
    return ext in allowed

def validate_upload(file: UploadFile, category: str) -> None:
    """
    Validates uploaded file against size and extension limits for a specific category.
    Raises HTTPException if invalid.
    """
    ext = get_file_extension(file.filename or "")
    if not is_extension_allowed(ext, category):
        raise HTTPException(
            status_code=400, 
            detail=f"File extension {ext} not allowed for {category}. Allowed: {', '.join(ALLOWED_EXTENSIONS.get(category, []))}"
        )
    
    # Optional: Basic MIME type check using python's built-in mimetypes
    # This isn't foolproof but helps against basic renaming
    expected_mime = mimetypes.guess_type(file.filename or "")[0]
    if expected_mime and file.content_type and not expected_mime.startswith(file.content_type.split('/')[0]):
        # Just log a warning for now, sometimes mimetypes mismatch slightly
        import logging
        logging.warning(f"MIME type mismatch: expected {expected_mime}, got {file.content_type}")

    # For size, we have to read it. FastAPI SpooledTemporaryFile doesn't expose size easily before reading
    # A more robust way is to read chunks or rely on web server limits, but here's a basic check
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    max_size = MAX_FILE_SIZES.get(category, 0)
    if file_size > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds limit of {max_size / (1024*1024):.2f}MB for {category}"
        )

def generate_safe_filename(original_filename: str) -> str:
    """Generates a UUID-based filename preserving the original extension."""
    ext = get_file_extension(original_filename)
    return f"{uuid.uuid4().hex}{ext}"

# Note: Temp file cleanup would typically be handled by a background task
# or a cron job cleaning up the `data/uploads` directory periodically.
