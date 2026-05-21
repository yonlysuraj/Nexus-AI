"""
FastAPI endpoints for YouTube to blog post conversion.
"""

import json
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.schemas.youtube_to_blog import YouTubeBlogRequest, YouTubeBlogResponse, BlogMetadataSchema
from app.services.youtube_handler import YouTubeService
from app.services.blog_generator import BlogGenerator
from app.core.prompts.blog_generation import get_blog_generation_prompt, get_seo_metadata_prompt
from app.core.ai_engine import ai_engine

router = APIRouter(prefix="/youtube-to-blog", tags=["YouTube to Blog"])


@router.post("/")
async def generate_blog_from_youtube(request: YouTubeBlogRequest) -> YouTubeBlogResponse:
    """
    Generate a blog post from a YouTube video.

    Args:
        request: YouTubeBlogRequest with YouTube URL and optional SEO keywords

    Returns:
        YouTubeBlogResponse with blog post and metadata

    Raises:
        HTTPException: If video URL invalid, transcript extraction fails, or generation fails
    """
    try:
        # Step 1: Validate YouTube URL
        if not YouTubeService.validate_youtube_url(request.youtube_url):
            raise HTTPException(
                status_code=400,
                detail="Invalid YouTube URL. Please provide a valid youtube.com or youtu.be URL"
            )

        logger.info(f"Processing YouTube URL: {request.youtube_url}")

        # Step 2: Extract transcript with fallback strategy
        try:
            transcript_result = await YouTubeService.get_transcript(request.youtube_url)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

        logger.info(f"Transcript extracted via {transcript_result.source}")

        # Step 3: Generate blog post using LLM
        blog_prompt = get_blog_generation_prompt(
            transcript=transcript_result.transcript,
            video_title="YouTube Video",
            seo_keywords=request.seo_keywords
        )

        logger.info("Generating blog post with LLM...")
        blog_content = await ai_engine.generate(
            prompt=blog_prompt,
            temperature=0.7,
            max_tokens=3000,
        )

        # Step 4: Clean up response (remove markdown code blocks if present)
        blog_content = blog_content.strip()
        if blog_content.startswith("```"):
            blog_content = blog_content.replace("```markdown", "").replace("```", "").strip()

        # Step 5: Extract title from blog content
        title, cleaned_content = BlogGenerator.parse_blog_generation_response(blog_content)

        # Step 6: Create structured blog post
        blog_post = BlogGenerator.create_blog_post(cleaned_content, title)

        logger.info(f"Blog post generated: {title} ({blog_post.metadata.word_count} words)")

        # Step 7: Extract SEO metadata
        seo_prompt = get_seo_metadata_prompt(cleaned_content)
        seo_response = await ai_engine.generate(
            prompt=seo_prompt,
            temperature=0.5,
            max_tokens=300,
        )

        # Parse SEO metadata JSON
        try:
            seo_data = json.loads(seo_response)
            blog_post.metadata.meta_description = seo_data.get(
                "meta_description",
                blog_post.metadata.meta_description
            )
            blog_post.metadata.keywords = seo_data.get(
                "keywords",
                blog_post.metadata.keywords
            )
        except json.JSONDecodeError:
            logger.warning("Could not parse SEO metadata JSON, using defaults")

        logger.info(f"Keywords extracted: {blog_post.metadata.keywords}")

        return YouTubeBlogResponse(
            blog_post=blog_post.content,
            metadata=BlogMetadataSchema(
                title=blog_post.metadata.title,
                meta_description=blog_post.metadata.meta_description,
                keywords=blog_post.metadata.keywords,
                word_count=blog_post.metadata.word_count,
                reading_time=blog_post.metadata.reading_time,
            ),
            transcript_source=transcript_result.source,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating blog post: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating blog post: {str(e)}"
        )
