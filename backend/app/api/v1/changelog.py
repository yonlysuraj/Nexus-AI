"""Git Changelog Generator API endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

from app.services.changelog_formatter import ChangelogEntry, ChangelogFormatter
from app.services.commit_categorizer import categorize_commit
from app.services.git_analyzer import GitAnalyzer, parse_commit_message

router = APIRouter(prefix="/changelog", tags=["changelog"])


# ============================================================================
# Request/Response Models
# ============================================================================


class ChangelogFromLogRequest(BaseModel):
    """Request to generate changelog from commit log text."""

    commits_text: str = Field(
        ..., min_length=10, description="Pasted commit log (git log output)"
    )
    version: str = Field(default="Unreleased", description="Version number")
    group_by: str = Field(default="version", description="Grouping strategy")


class ChangelogFromRepoRequest(BaseModel):
    """Request to generate changelog from GitHub repo."""

    repo_url: str = Field(
        ..., description="GitHub repository URL (e.g., https://github.com/user/repo)"
    )
    branch: str = Field(default="main", description="Branch name")
    since_date: Optional[str] = Field(default=None, description="Start date (ISO format)")
    until_date: Optional[str] = Field(default=None, description="End date (ISO format)")
    version: str = Field(default="Unreleased", description="Version number")


class ChangelogResponse(BaseModel):
    """Changelog generation response."""

    changelog: str = Field(..., description="Generated changelog in markdown")
    commit_count: int = Field(..., description="Total commits processed")
    statistics: dict = Field(..., description="Changelog statistics")


# ============================================================================
# Helpers
# ============================================================================


def parse_git_log_text(log_text: str) -> list[tuple[str, str, datetime]]:
    """
    Parse raw git log text into commits.

    Supports formats:
    - git log --oneline (hash message)
    - git log --pretty=format:"%H %s %ad" --date=short

    Returns:
        List of (hash, message, date) tuples
    """
    commits = []
    lines = log_text.strip().split("\n")

    for line in lines:
        if not line.strip():
            continue

        # Try to parse line
        parts = line.split(" ", 1)
        if len(parts) < 2:
            continue

        hash_or_full = parts[0]
        rest = parts[1] if len(parts) > 1 else ""

        # Skip if line doesn't look like a commit
        if len(hash_or_full) < 7:
            continue

        # Extract hash and message
        # Could be: "abc1234 Commit message" or just "Commit message"
        if len(hash_or_full) >= 7 and all(c in "0123456789abcdef" for c in hash_or_full):
            commit_hash = hash_or_full[:7]
            message = rest
        else:
            # No hash, treat whole line as message
            commit_hash = "unknown"
            message = line

        # Default date (now) - could be improved
        date = datetime.now()

        if message.strip():
            commits.append((commit_hash, message, date))

    if not commits:
        raise ValueError("Could not parse any commits from the provided log")

    return commits


# ============================================================================
# Endpoints
# ============================================================================


@router.post(
    "/from-log",
    response_model=ChangelogResponse,
    summary="Generate changelog from commit log text",
    description="Paste git log output and get a formatted changelog",
)
async def changelog_from_log(request: ChangelogFromLogRequest):
    """
    Generate changelog from pasted commit log text.

    Supports common git log formats:
    - `git log --oneline`
    - `git log --pretty=format:"%H %s %ad" --date=short`

    Returns:
        Formatted changelog in Keep a Changelog format
    """
    try:
        # Parse commits from text
        parsed_commits = parse_git_log_text(request.commits_text)

        # Convert to ChangelogEntry objects
        entries = []
        for commit_hash, message, date in parsed_commits:
            commit_type = categorize_commit(message)
            entry = ChangelogEntry(
                message=message,
                commit_type=commit_type,
                author="Unknown",
                date=date,
                hash=commit_hash,
            )
            entries.append(entry)

        # Format changelog
        changelog_md = ChangelogFormatter.format_keep_changelog(
            entries=entries,
            version=request.version,
            group_by=request.group_by,
        )

        # Get statistics
        stats = ChangelogFormatter.get_statistics(entries)

        logger.info(f"Generated changelog from log: {len(entries)} commits")

        return ChangelogResponse(
            changelog=changelog_md,
            commit_count=len(entries),
            statistics=stats,
        )

    except ValueError as e:
        logger.error(f"Changelog generation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate changelog: {str(e)}")


@router.post(
    "/from-repo",
    response_model=ChangelogResponse,
    summary="Generate changelog from GitHub repository",
    description="Provide a GitHub repo URL and get a changelog of its commits",
)
async def changelog_from_repo(request: ChangelogFromRepoRequest):
    """
    Generate changelog from a GitHub repository.

    Clones the repo and analyzes commits.

    Parameters:
        - repo_url: GitHub repository URL (HTTPS)
        - branch: Branch to analyze (default: main)
        - since_date: Filter commits since this date (ISO format, optional)
        - until_date: Filter commits until this date (ISO format, optional)
        - version: Version number for changelog

    Returns:
        Formatted changelog
    """
    analyzer = None
    try:
        # Validate URL format
        if not (repo_url := request.repo_url.strip()):
            raise HTTPException(status_code=400, detail="Repository URL cannot be empty")

        if not repo_url.startswith(("http://", "https://", "git@")):
            raise HTTPException(status_code=400, detail="Invalid repository URL")

        if "git@" in repo_url:
            raise HTTPException(status_code=400, detail="SSH URLs not supported. Use HTTPS.")

        logger.info(f"Cloning repository: {repo_url}")

        # Clone repository
        analyzer = GitAnalyzer.from_repo_url(repo_url, request.branch)

        # Parse dates
        since = None
        until = None
        if request.since_date:
            try:
                since = datetime.fromisoformat(request.since_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid since_date format")

        if request.until_date:
            try:
                until = datetime.fromisoformat(request.until_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid until_date format")

        # Get commits
        commits = analyzer.get_commits(since=since, until=until, branch=request.branch)

        if not commits:
            raise HTTPException(
                status_code=400,
                detail=f"No commits found in {request.branch} branch",
            )

        # Convert to ChangelogEntry objects
        entries = []
        for commit in commits:
            commit_type = categorize_commit(commit.message)
            entry = ChangelogEntry(
                message=commit.message.split("\n")[0],  # First line only
                commit_type=commit_type,
                author=commit.author,
                date=commit.date,
                hash=commit.hash,
            )
            entries.append(entry)

        # Format changelog
        changelog_md = ChangelogFormatter.format_keep_changelog(
            entries=entries,
            version=request.version,
        )

        # Get statistics
        stats = ChangelogFormatter.get_statistics(entries)

        logger.info(f"Generated changelog from repo: {len(entries)} commits")

        return ChangelogResponse(
            changelog=changelog_md,
            commit_count=len(entries),
            statistics=stats,
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Repository error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Changelog generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate changelog: {str(e)}")
    finally:
        # Cleanup
        if analyzer:
            analyzer.cleanup()
