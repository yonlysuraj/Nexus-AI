"""
FastAPI endpoints for Resume Optimizer.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from loguru import logger
import io

from app.schemas.resume_optimizer import ResumeOptimizeRequest, ResumeOptimizeResponse, MatchResultSchema, SuggestionSchema
from app.services.resume_parser import ResumeParser
from app.services.jd_processor import JDProcessor
from app.services.resume_matcher import ResumeMatcher
from app.services.resume_optimizer import ResumeOptimizer

router = APIRouter(prefix="/resume-optimizer", tags=["Resume Optimizer"])


@router.post("/")
async def optimize_resume(
    resume_file: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    job_description: str = Form(..., description="Job description text")
) -> ResumeOptimizeResponse:
    """
    Optimize resume against job description.

    Args:
        resume_file: PDF or DOCX resume file
        job_description: Plain text job description

    Returns:
        ResumeOptimizeResponse with match analysis and suggestions

    Raises:
        HTTPException: If file invalid, parsing fails, or API errors
    """
    try:
        # Step 1: Validate inputs
        if not resume_file.filename:
            raise HTTPException(status_code=400, detail="Resume file required")

        if not job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")

        logger.info(f"Processing resume: {resume_file.filename}")

        # Step 2: Parse resume file
        file_ext = resume_file.filename.split(".")[-1].lower()

        if file_ext not in ["pdf", "docx"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload PDF or DOCX file."
            )

        try:
            # Save temp file for parsing
            temp_file_path = f"/tmp/{resume_file.filename}"

            # Read uploaded file
            contents = await resume_file.read()

            # Write to temp location
            with open(temp_file_path, "wb") as f:
                f.write(contents)

            # Parse resume
            resume = ResumeParser.parse(temp_file_path, file_ext)

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse resume: {str(e)}"
            )

        logger.info(f"Resume parsed: {len(resume.full_text)} characters")

        # Step 3: Process job description
        try:
            jd = JDProcessor.process(job_description)
        except Exception as e:
            logger.warning(f"Failed to process JD: {str(e)}, using basic extraction")
            jd = JDProcessor.process(job_description)

        logger.info(f"JD processed: {len(jd.keywords)} keywords extracted")

        # Step 4: Calculate match score
        try:
            match_result = ResumeMatcher.calculate_match(
                resume.full_text,
                jd.keywords,
                jd.requirements
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error calculating match: {str(e)}"
            )

        logger.info(f"Match calculated: {match_result.match_score}/100")

        # Step 5: Generate optimization suggestions
        try:
            suggestions_list = ResumeOptimizer.generate_suggestions(
                resume.full_text,
                match_result.missing_keywords,
                jd.title or ""
            )

            # Convert to schema objects
            suggestions = [
                SuggestionSchema(
                    section_name=s.section_name,
                    original_text=s.original_text,
                    optimized_text=s.optimized_text,
                    keywords_added=s.keywords_added,
                )
                for s in suggestions_list
            ]

        except Exception as e:
            logger.warning(f"Failed to generate suggestions: {str(e)}")
            suggestions = []

        logger.info(f"Generated {len(suggestions)} suggestions")

        # Step 6: Get ATS tips
        try:
            ats_tips = ResumeOptimizer.get_ats_tips(resume.full_text, job_description)
        except Exception as e:
            logger.warning(f"Failed to get ATS tips: {str(e)}")
            ats_tips = []

        logger.info(f"Generated {len(ats_tips)} ATS tips")

        # Step 7: Build response
        response = ResumeOptimizeResponse(
            match_result=MatchResultSchema(
                match_score=match_result.match_score,
                matched_keywords=match_result.matched_keywords,
                missing_keywords=match_result.missing_keywords,
                critical_gaps=match_result.critical_gaps,
            ),
            suggestions=suggestions,
            ats_tips=ats_tips,
        )

        logger.info("Resume optimization complete")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error optimizing resume: {str(e)}"
        )
