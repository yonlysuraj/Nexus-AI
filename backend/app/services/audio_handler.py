"""Audio file handling and validation service."""

import os
import shutil
from pathlib import Path
from typing import Optional

from loguru import logger
from pydub import AudioSegment

# Supported audio formats
SUPPORTED_FORMATS = {"mp3", "wav", "m4a", "flac", "ogg"}
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25MB
UPLOAD_DIR = Path(__file__).parent.parent / "data" / "audio_uploads"


def ensure_upload_dir() -> Path:
    """Ensure upload directory exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def validate_audio_file(file_path: Path, max_size: int = MAX_AUDIO_SIZE) -> tuple[bool, Optional[str]]:
    """
    Validate audio file format and size.
    
    Args:
        file_path: Path to the audio file
        max_size: Maximum allowed file size in bytes (default: 25MB)
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check file exists
    if not file_path.exists():
        return False, "File not found"
    
    # Check file size
    file_size = file_path.stat().st_size
    if file_size > max_size:
        size_mb = file_size / (1024 * 1024)
        max_mb = max_size / (1024 * 1024)
        return False, f"File too large: {size_mb:.1f}MB (max: {max_mb:.0f}MB)"
    
    if file_size < 1000:  # Less than 1KB
        return False, "File is too small to be valid audio"
    
    # Check file extension
    file_ext = file_path.suffix.lstrip(".").lower()
    if file_ext not in SUPPORTED_FORMATS:
        supported = ", ".join(sorted(SUPPORTED_FORMATS))
        return False, f"Unsupported format: .{file_ext}. Supported: {supported}"
    
    # Additional MIME type validation via file header
    valid, mime_error = _validate_audio_header(file_path)
    if not valid:
        return False, mime_error
    
    logger.info(f"Audio file validated: {file_path.name} ({file_size / 1024:.1f}KB)")
    return True, None


def _validate_audio_header(file_path: Path) -> tuple[bool, Optional[str]]:
    """
    Validate audio file by checking magic bytes/header.
    
    Args:
        file_path: Path to file
    
    Returns:
        tuple: (is_valid, error_message)
    """
    file_ext = file_path.suffix.lstrip(".").lower()
    
    # Magic bytes for common audio formats
    magic_bytes = {
        "mp3": (b"ID3", b"\xff\xfb", b"\xff\xfa"),  # ID3 tag or MPEG frame sync
        "wav": (b"RIFF",),
        "m4a": (b"\x00\x00\x00",),  # ftyp box
        "flac": (b"fLaC",),
        "ogg": (b"OggS",),
    }
    
    if file_ext not in magic_bytes:
        return True, None  # Skip check for unknown formats
    
    try:
        with open(file_path, "rb") as f:
            header = f.read(12)
        
        if not any(header.startswith(magic) for magic in magic_bytes[file_ext]):
            return False, f"Invalid {file_ext.upper()} file header"
    except Exception as e:
        logger.warning(f"Could not validate file header: {e}")
        return True, None  # Allow file if header check fails
    
    return True, None


def convert_to_wav(input_path: Path, output_path: Optional[Path] = None) -> Path:
    """
    Convert audio file to WAV format.
    
    Args:
        input_path: Path to input audio file
        output_path: Path for output WAV file (default: replace extension with .wav)
    
    Returns:
        Path to output WAV file
    
    Raises:
        ValueError: If input file is invalid or conversion fails
    """
    # Validate input
    is_valid, error = validate_audio_file(input_path)
    if not is_valid:
        raise ValueError(f"Invalid audio file: {error}")
    
    # Set output path
    if output_path is None:
        output_path = input_path.with_suffix(".wav")
    
    try:
        logger.info(f"Converting {input_path.name} to WAV...")
        
        # Load audio with pydub
        audio = AudioSegment.from_file(str(input_path))
        
        # Export as WAV
        audio.export(str(output_path), format="wav")
        
        logger.info(f"Conversion complete: {output_path.name} ({len(audio)}ms)")
        return output_path
    
    except Exception as e:
        logger.error(f"Audio conversion failed: {e}")
        # Cleanup partial output
        if output_path.exists():
            output_path.unlink()
        raise ValueError(f"Failed to convert audio: {str(e)}")


def cleanup_temp_files(file_paths: list[Path]) -> None:
    """
    Clean up temporary audio files.
    
    Args:
        file_paths: List of file paths to delete
    """
    for file_path in file_paths:
        try:
            if file_path.exists():
                file_path.unlink()
                logger.debug(f"Cleaned up: {file_path.name}")
        except Exception as e:
            logger.warning(f"Could not delete {file_path}: {e}")


def get_audio_duration(file_path: Path) -> float:
    """
    Get audio duration in seconds.
    
    Args:
        file_path: Path to audio file
    
    Returns:
        Duration in seconds
    
    Raises:
        ValueError: If file cannot be read
    """
    try:
        audio = AudioSegment.from_file(str(file_path))
        duration_seconds = len(audio) / 1000.0
        return duration_seconds
    except Exception as e:
        logger.error(f"Could not get duration for {file_path.name}: {e}")
        raise ValueError(f"Failed to get audio duration: {str(e)}")
