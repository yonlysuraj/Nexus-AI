"""Voice Memos to Tasks API endpoints."""

import json
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel, Field

from app.core.ai_engine import ai_engine
from app.core.prompts.voice_memo_tasks import get_task_extraction_prompt
from app.services.audio_handler import (
    cleanup_temp_files,
    convert_to_wav,
    get_audio_duration,
    validate_audio_file,
)
from app.services.transcription import TranscriptionService

router = APIRouter(prefix="/voice-memo-tasks", tags=["voice-memo-tasks"])

transcription_service: TranscriptionService | None = None


def get_transcription_service() -> TranscriptionService:
    """Create the Whisper transcription service only when audio endpoints need it."""
    global transcription_service
    if transcription_service is None:
        transcription_service = TranscriptionService(model_size="base")
    return transcription_service


# ============================================================================
# Request/Response Models
# ============================================================================


class TranscriptRequest(BaseModel):
    """Request to extract tasks from a transcript."""

    transcript: str = Field(..., min_length=10, description="Voice memo transcript")
    extraction_mode: str = Field(
        default="structured",
        description='Extraction mode: "structured", "detailed", or "minimal"',
    )


class TranscriptResponse(BaseModel):
    """Response with transcript data."""

    transcript: str
    language: str
    duration: float
    confidence: float


class TaskItem(BaseModel):
    """A single task item."""

    description: str
    priority: str  # High, Medium, Low
    category: str = None
    time_estimate: str = None
    notes: str = None
    depends_on: str = None


class TaskExtractionResponse(BaseModel):
    """Response with extracted tasks."""

    tasks: list[TaskItem] = Field(..., description="Extracted tasks")
    summary: str = Field(..., description="Summary of the memo")


class VoiceMemoResponse(BaseModel):
    """Complete voice memo processing response."""

    transcript: str
    language: str
    duration: float
    confidence: float
    tasks: list[TaskItem]
    summary: str


# ============================================================================
# Helper Functions
# ============================================================================


def parse_task_json(json_str: str) -> dict:
    """
    Parse task extraction JSON from LLM response.
    
    Args:
        json_str: JSON string from LLM
    
    Returns:
        Parsed dict with tasks and summary
    
    Raises:
        ValueError: If JSON parsing fails
    """
    # Extract JSON from potential markdown code blocks
    if "```json" in json_str:
        json_str = json_str.split("```json")[1].split("```")[0]
    elif "```" in json_str:
        json_str = json_str.split("```")[1].split("```")[0]
    
    json_str = json_str.strip()
    
    try:
        parsed = json.loads(json_str)
        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse task JSON: {e}\n{json_str}")
        raise ValueError(f"Failed to parse LLM response as JSON: {str(e)}")


# ============================================================================
# Endpoints
# ============================================================================


@router.post(
    "/transcribe",
    response_model=TranscriptResponse,
    summary="Transcribe audio file",
    description="Upload and transcribe an audio file using Whisper",
)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe an audio file.
    
    Supported formats: mp3, wav, m4a, flac, ogg
    Maximum size: 25MB
    
    Returns:
        - transcript: Full transcribed text
        - language: Detected language code
        - duration: Audio duration in seconds
        - confidence: Average transcription confidence
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Expected audio file.",
        )
    
    # Save uploaded file to temp location
    temp_dir = Path(tempfile.gettempdir()) / "voice_memo_uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    temp_input = temp_dir / file.filename
    temp_wav = temp_dir / f"{file.filename}.wav"
    
    try:
        # Write uploaded file
        content = await file.read()
        with open(temp_input, "wb") as f:
            f.write(content)
        
        # Validate
        is_valid, error = validate_audio_file(temp_input)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid audio file: {error}")
        
        # Convert to WAV if needed
        if temp_input.suffix.lower() != ".wav":
            wav_path = convert_to_wav(temp_input, temp_wav)
        else:
            wav_path = temp_input
        
        # Transcribe
        result = get_transcription_service().transcribe(wav_path)
        
        logger.info(f"Successfully transcribed: {file.filename}")
        
        return TranscriptResponse(
            transcript=result.text,
            language=result.language,
            duration=result.duration,
            confidence=result.confidence,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Cleanup temp files
        cleanup_temp_files([temp_input, temp_wav])


@router.post(
    "/extract-tasks",
    response_model=TaskExtractionResponse,
    summary="Extract tasks from transcript",
    description="Use AI to extract structured tasks from a voice memo transcript",
)
async def extract_tasks(request: TranscriptRequest):
    """
    Extract actionable tasks from a transcript.
    
    Extraction modes:
    - structured: Tasks with priority, category, time estimate (default)
    - detailed: Tasks with notes and dependencies
    - minimal: Tasks with just description and priority
    
    Returns:
        - tasks: List of extracted TaskItem objects
        - summary: Brief summary of the memo
    """
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
    
    if len(request.transcript) > 50000:
        raise HTTPException(
            status_code=413,
            detail="Transcript too long (max 50,000 characters)",
        )
    
    try:
        # Get extraction prompt
        prompt = get_task_extraction_prompt(
            mode=request.extraction_mode,
            transcript=request.transcript,
        )
        
        # Call AI engine for task extraction
        response = ai_engine.generate(prompt=prompt, stream=False)
        
        # Parse JSON response
        parsed = parse_task_json(response)
        
        # Validate response structure
        if "tasks" not in parsed or "summary" not in parsed:
            raise ValueError("LLM response missing required fields (tasks, summary)")
        
        # Convert task dicts to TaskItem objects
        tasks = []
        for task in parsed.get("tasks", []):
            tasks.append(TaskItem(**task))
        
        logger.info(f"Extracted {len(tasks)} tasks from transcript")
        
        return TaskExtractionResponse(
            tasks=tasks,
            summary=parsed.get("summary", ""),
        )
    
    except ValueError as e:
        logger.error(f"Task extraction validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Task extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Task extraction failed: {str(e)}")


@router.post(
    "",
    response_model=VoiceMemoResponse,
    summary="Full pipeline: upload → transcribe → extract tasks",
    description="Upload audio and get complete voice memo processing in one call",
)
async def process_voice_memo(
    file: UploadFile = File(...),
    extraction_mode: str = Form(default="structured"),
):
    """
    Complete voice memo processing pipeline.
    
    1. Transcribe audio file
    2. Extract tasks from transcript
    3. Return both transcript and tasks
    
    Parameters:
        - file: Audio file (mp3, wav, m4a, etc.)
        - extraction_mode: Task extraction mode (structured, detailed, minimal)
    
    Returns:
        - transcript: Full transcribed text
        - language: Detected language
        - duration: Audio duration
        - confidence: Transcription confidence
        - tasks: Extracted tasks
        - summary: Memo summary
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}",
        )
    
    # Save uploaded file
    temp_dir = Path(tempfile.gettempdir()) / "voice_memo_uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    temp_input = temp_dir / file.filename
    temp_wav = temp_dir / f"{file.filename}.wav"
    
    try:
        # Step 1: Write and validate file
        content = await file.read()
        with open(temp_input, "wb") as f:
            f.write(content)
        
        is_valid, error = validate_audio_file(temp_input)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid audio: {error}")
        
        # Step 2: Convert to WAV if needed
        if temp_input.suffix.lower() != ".wav":
            wav_path = convert_to_wav(temp_input, temp_wav)
        else:
            wav_path = temp_input
        
        # Step 3: Transcribe
        transcription_result = get_transcription_service().transcribe(wav_path)
        
        # Step 4: Extract tasks
        prompt = get_task_extraction_prompt(
            mode=extraction_mode,
            transcript=transcription_result.text,
        )
        
        response = ai_engine.generate(prompt=prompt, stream=False)
        parsed = parse_task_json(response)
        
        if "tasks" not in parsed or "summary" not in parsed:
            raise ValueError("Invalid task extraction response")
        
        # Convert tasks
        tasks = []
        for task in parsed.get("tasks", []):
            tasks.append(TaskItem(**task))
        
        logger.info(
            f"Processed voice memo: {file.filename} "
            f"({transcription_result.duration:.1f}s, {len(tasks)} tasks)"
        )
        
        return VoiceMemoResponse(
            transcript=transcription_result.text,
            language=transcription_result.language,
            duration=transcription_result.duration,
            confidence=transcription_result.confidence,
            tasks=tasks,
            summary=parsed.get("summary", ""),
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice memo processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )
    finally:
        # Cleanup
        cleanup_temp_files([temp_input, temp_wav])
