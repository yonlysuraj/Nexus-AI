"""
YouTube video handler - Extract transcripts from YouTube videos with multiple fallback strategies.
"""

import re
from typing import Optional, Literal
from dataclasses import dataclass
from loguru import logger

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    TRANSCRIPT_API_AVAILABLE = True
except ImportError:
    TRANSCRIPT_API_AVAILABLE = False

try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    YTDLP_AVAILABLE = False

from app.services.transcription import TranscriptionService


@dataclass
class YouTubeTranscript:
    """Represents extracted YouTube transcript."""
    language: str
    transcript: str
    duration_seconds: int
    source: Literal["captions", "yt-dlp", "whisper"]


class YouTubeService:
    """Handle YouTube video transcript extraction with multiple fallback strategies."""

    # YouTube URL patterns
    YOUTUBE_URL_PATTERNS = [
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})",
        r"(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})",
    ]

    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """
        Extract video ID from YouTube URL.

        Args:
            url: YouTube URL

        Returns:
            Video ID or None if not found
        """
        url = url.strip()

        for pattern in YouTubeService.YOUTUBE_URL_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        logger.warning(f"Could not extract video ID from URL: {url}")
        return None

    @staticmethod
    def validate_youtube_url(url: str) -> bool:
        """
        Validate if URL is a valid YouTube URL.

        Args:
            url: URL to validate

        Returns:
            True if valid YouTube URL format
        """
        video_id = YouTubeService.extract_video_id(url)
        return video_id is not None

    @staticmethod
    async def get_transcript(video_url: str) -> YouTubeTranscript:
        """
        Extract transcript from YouTube video with fallback strategy.

        Priority:
        1. Official captions (youtube-transcript-api)
        2. yt-dlp (manual extraction)
        3. Whisper (download audio and transcribe)

        Args:
            video_url: YouTube URL

        Returns:
            YouTubeTranscript with transcript and source metadata

        Raises:
            ValueError: If video ID cannot be extracted or all methods fail
        """
        video_id = YouTubeService.extract_video_id(video_url)
        if not video_id:
            raise ValueError(f"Invalid YouTube URL: {video_url}")

        logger.info(f"Attempting to extract transcript for video: {video_id}")

        # Strategy 1: Try official captions API (fastest)
        if TRANSCRIPT_API_AVAILABLE:
            try:
                transcript = await YouTubeService._extract_captions(video_id)
                if transcript:
                    logger.info(f"Successfully extracted captions for {video_id}")
                    return YouTubeTranscript(
                        language="en",
                        transcript=transcript,
                        duration_seconds=0,  # Not available from captions API
                        source="captions",
                    )
            except Exception as e:
                logger.debug(f"Captions API failed: {e}, trying yt-dlp...")

        # Strategy 2: Try yt-dlp (handles age-restricted, no-caption videos)
        if YTDLP_AVAILABLE:
            try:
                transcript = await YouTubeService._extract_with_ytdlp(video_url)
                if transcript:
                    logger.info(f"Successfully extracted transcript with yt-dlp for {video_id}")
                    return YouTubeTranscript(
                        language="en",
                        transcript=transcript,
                        duration_seconds=0,
                        source="yt-dlp",
                    )
            except Exception as e:
                logger.debug(f"yt-dlp failed: {e}, trying Whisper...")

        # Strategy 3: Try Whisper (download audio and transcribe)
        try:
            transcript = await YouTubeService._extract_with_whisper(video_url)
            if transcript:
                logger.info(f"Successfully extracted transcript with Whisper for {video_id}")
                return YouTubeTranscript(
                    language="en",
                    transcript=transcript,
                    duration_seconds=0,
                    source="whisper",
                )
        except Exception as e:
            logger.error(f"Whisper extraction failed: {e}")

        raise ValueError(
            f"Could not extract transcript for video {video_id}. "
            "All extraction methods failed. Please try another video."
        )

    @staticmethod
    async def _extract_captions(video_id: str) -> Optional[str]:
        """
        Extract transcript from official YouTube captions.

        Args:
            video_id: YouTube video ID

        Returns:
            Transcript text or None if not available
        """
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            # Try to get English captions first
            transcript = None
            if "en" in transcript_list.available_transcripts:
                transcript = transcript_list.find_transcript(["en"])
            else:
                # Fallback to first available transcript
                transcript = transcript_list.find_transcript(
                    [lang for lang in transcript_list.available_transcripts]
                )

            if transcript:
                captions = transcript.fetch()
                text = " ".join([item["text"] for item in captions])
                return text

            return None
        except Exception as e:
            logger.debug(f"Failed to extract captions: {e}")
            return None

    @staticmethod
    async def _extract_with_ytdlp(video_url: str) -> Optional[str]:
        """
        Extract transcript using yt-dlp.

        Args:
            video_url: YouTube video URL

        Returns:
            Transcript text or None if not available
        """
        import subprocess
        import json
        import tempfile
        import os

        try:
            # Use yt-dlp to extract subtitle/auto-generated transcript
            with tempfile.TemporaryDirectory() as tmpdir:
                # Try to write subtitles to file
                subtitle_file = os.path.join(tmpdir, "%(title)s.en.vtt")

                cmd = [
                    "yt-dlp",
                    "--write-auto-sub",
                    "--write-sub",
                    "--sub-lang",
                    "en",
                    "-o",
                    subtitle_file,
                    "--skip-download",
                    video_url,
                ]

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

                if result.returncode != 0:
                    logger.debug(f"yt-dlp error: {result.stderr}")
                    return None

                # Find and read the subtitle file
                for file in os.listdir(tmpdir):
                    if file.endswith(".vtt") or file.endswith(".srt"):
                        filepath = os.path.join(tmpdir, file)
                        with open(filepath, "r", encoding="utf-8") as f:
                            content = f.read()
                            # Extract text from VTT format
                            text = YouTubeService._parse_subtitle(content)
                            return text if text else None

                return None

        except subprocess.TimeoutExpired:
            logger.warning("yt-dlp extraction timed out")
            return None
        except Exception as e:
            logger.debug(f"yt-dlp extraction failed: {e}")
            return None

    @staticmethod
    async def _extract_with_whisper(video_url: str) -> Optional[str]:
        """
        Extract transcript by downloading audio and using Whisper.

        Args:
            video_url: YouTube video URL

        Returns:
            Transcript text or None if failed
        """
        import subprocess
        import tempfile
        import os

        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download audio using yt-dlp
                audio_file = os.path.join(tmpdir, "audio.mp3")

                cmd = [
                    "yt-dlp",
                    "-x",  # Extract audio only
                    "--audio-format",
                    "mp3",
                    "-o",
                    audio_file,
                    video_url,
                ]

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

                if result.returncode != 0:
                    logger.warning(f"Audio download failed: {result.stderr}")
                    return None

                # Check if audio file exists
                if not os.path.exists(audio_file):
                    # Try with .webm extension
                    audio_file = os.path.join(tmpdir, "audio.webm")
                    if not os.path.exists(audio_file):
                        logger.warning("Audio file not found after download")
                        return None

                # Transcribe using Whisper
                transcription_service = TranscriptionService()
                result = transcription_service.transcribe(audio_file)
                return result.text if result else None

        except subprocess.TimeoutExpired:
            logger.warning("Whisper extraction timed out")
            return None
        except Exception as e:
            logger.error(f"Whisper extraction failed: {e}")
            return None

    @staticmethod
    def _parse_subtitle(content: str) -> str:
        """
        Parse subtitle content (VTT or SRT format) and extract text.

        Args:
            content: Raw subtitle file content

        Returns:
            Extracted text from subtitles
        """
        lines = []
        for line in content.split("\n"):
            # Skip timestamps (HH:MM:SS format)
            if "-->" in line or line.startswith("WEBVTT"):
                continue
            # Skip empty lines and cue identifiers
            if line.strip() and not line[0].isdigit():
                lines.append(line.strip())

        return " ".join(lines)
