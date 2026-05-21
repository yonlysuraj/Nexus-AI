"""Audio transcription service using Faster Whisper."""

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Optional

from loguru import logger

if TYPE_CHECKING:
    from faster_whisper import WhisperModel


@dataclass
class TranscriptionResult:
    """Result of audio transcription."""

    text: str
    language: str
    duration: float
    confidence: float  # Average confidence score


@dataclass
class TranscriptionSegment:
    """A segment of transcribed audio with timestamps."""

    start: float
    end: float
    text: str
    confidence: float


class TranscriptionService:
    """Service for transcribing audio files using Faster Whisper."""

    # Model cache (class variable to persist across instances)
    _model_cache: Optional["WhisperModel"] = None
    _current_model_size: Optional[str] = None

    def __init__(self, model_size: str = "base", device: str = "auto"):
        """
        Initialize transcription service.
        
        Args:
            model_size: Whisper model size ('tiny', 'base', 'small', 'medium', 'large')
            device: Device to use ('auto', 'cuda', 'cpu')
        
        Note:
            First initialization will download the model (~1-3GB depending on size).
            Subsequent instances will reuse the cached model.
        """
        self.model_size = model_size
        self.device = device
        self.model: Optional["WhisperModel"] = None
        self._load_model()

    def _load_model(self) -> None:
        """Load or retrieve cached Whisper model."""
        # Reuse cached model if same size
        if (
            self._model_cache is not None
            and self._current_model_size == self.model_size
        ):
            self.model = self._model_cache
            logger.debug(f"Using cached Whisper model: {self.model_size}")
            return

        # Load new model
        logger.info(f"Loading Whisper model: {self.model_size}...")
        try:
            from faster_whisper import WhisperModel

            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type="auto",
                num_workers=1,  # Use 1 worker for stability
            )
            # Cache for reuse
            TranscriptionService._model_cache = self.model
            TranscriptionService._current_model_size = self.model_size
            logger.info(f"Whisper model loaded successfully: {self.model_size}")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    def transcribe(
        self, audio_path: Path, language: Optional[str] = None
    ) -> TranscriptionResult:
        """
        Transcribe audio file.
        
        Args:
            audio_path: Path to audio file
            language: Language code (e.g., 'en', 'es'). Auto-detect if None.
        
        Returns:
            TranscriptionResult with text, language, and duration
        
        Raises:
            ValueError: If transcription fails
        """
        if not audio_path.exists():
            raise ValueError(f"Audio file not found: {audio_path}")

        try:
            logger.info(f"Transcribing: {audio_path.name}...")
            
            # Run transcription
            segments, info = self.model.transcribe(
                str(audio_path),
                language=language,
                temperature=0.0,  # Greedy decoding for speed
                best_of=1,
                beam_size=5,
            )

            # Collect segments
            text_parts = []
            confidence_scores = []

            for segment in segments:
                text_parts.append(segment.text)
                # Whisper confidence is 1 - avg_logprob
                confidence = 1.0 - segment.avg_logprob
                confidence_scores.append(confidence)

            full_text = " ".join(text_parts).strip()
            avg_confidence = (
                sum(confidence_scores) / len(confidence_scores)
                if confidence_scores
                else 0.0
            )

            logger.info(
                f"Transcription complete: {info.duration:.1f}s "
                f"({len(full_text)} chars, confidence: {avg_confidence:.2f})"
            )

            return TranscriptionResult(
                text=full_text,
                language=info.language,
                duration=info.duration,
                confidence=avg_confidence,
            )

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise ValueError(f"Failed to transcribe audio: {str(e)}")

    def transcribe_with_timestamps(
        self, audio_path: Path, language: Optional[str] = None
    ) -> tuple[list[TranscriptionSegment], float, str]:
        """
        Transcribe audio file with timestamp information.
        
        Args:
            audio_path: Path to audio file
            language: Language code for transcription
        
        Returns:
            tuple: (segments, duration, language)
        
        Raises:
            ValueError: If transcription fails
        """
        if not audio_path.exists():
            raise ValueError(f"Audio file not found: {audio_path}")

        try:
            logger.info(f"Transcribing with timestamps: {audio_path.name}...")
            
            segments, info = self.model.transcribe(
                str(audio_path),
                language=language,
                temperature=0.0,
            )

            # Convert to TranscriptionSegment objects
            result_segments = []
            for segment in segments:
                confidence = 1.0 - segment.avg_logprob
                result_segments.append(
                    TranscriptionSegment(
                        start=segment.start,
                        end=segment.end,
                        text=segment.text.strip(),
                        confidence=confidence,
                    )
                )

            logger.info(
                f"Segmented transcription complete: {info.duration:.1f}s, "
                f"{len(result_segments)} segments"
            )

            return result_segments, info.duration, info.language

        except Exception as e:
            logger.error(f"Transcription with timestamps failed: {e}")
            raise ValueError(f"Failed to transcribe audio: {str(e)}")

    @classmethod
    def clear_cache(cls) -> None:
        """Clear cached model to free memory."""
        cls._model_cache = None
        cls._current_model_size = None
        logger.info("Whisper model cache cleared")
