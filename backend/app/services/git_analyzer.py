"""Git repository analysis service."""

import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

import git
from git import Repo
from loguru import logger


class CommitInfo:
    """Information about a single commit."""

    def __init__(
        self,
        hash: str,
        author: str,
        email: str,
        date: datetime,
        message: str,
        tags: list[str],
    ):
        self.hash = hash
        self.author = author
        self.email = email
        self.date = date
        self.message = message
        self.tags = tags

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "hash": self.hash,
            "author": self.author,
            "email": self.email,
            "date": self.date.isoformat(),
            "message": self.message,
            "tags": self.tags,
        }


class GitAnalyzer:
    """Analyze git repositories and extract commit information."""

    def __init__(self, repo_path: str | Path):
        """
        Initialize analyzer with a repository path.

        Args:
            repo_path: Path to git repository

        Raises:
            ValueError: If path is not a valid git repository
        """
        repo_path = Path(repo_path)
        if not repo_path.exists():
            raise ValueError(f"Path does not exist: {repo_path}")

        if not (repo_path / ".git").exists():
            raise ValueError(f"Not a git repository: {repo_path}")

        self.repo = Repo(str(repo_path))
        logger.info(f"GitAnalyzer initialized: {repo_path}")

    @classmethod
    def from_repo_url(cls, repo_url: str, branch: str = "main") -> "GitAnalyzer":
        """
        Clone a remote repository and return analyzer.

        Args:
            repo_url: GitHub/GitLab URL (e.g., https://github.com/user/repo)
            branch: Branch to clone (default: main)

        Returns:
            GitAnalyzer instance

        Raises:
            ValueError: If clone fails
        """
        try:
            # Ensure HTTPS URL
            if repo_url.startswith("git@"):
                raise ValueError("SSH URLs not supported. Use HTTPS URLs.")

            if not repo_url.endswith(".git"):
                repo_url = repo_url.rstrip("/") + ".git"

            # Clone to temp directory
            temp_dir = tempfile.mkdtemp(prefix="git_analyzer_")
            logger.info(f"Cloning repository to {temp_dir}...")

            repo = Repo.clone_from(repo_url, temp_dir, branch=branch)
            logger.info(f"Repository cloned successfully")

            return cls(temp_dir)

        except Exception as e:
            logger.error(f"Failed to clone repository: {e}")
            raise ValueError(f"Failed to clone repository: {str(e)}")

    def get_commits(
        self,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        branch: str = "HEAD",
    ) -> list[CommitInfo]:
        """
        Get commits from the repository.

        Args:
            since: Start date (inclusive)
            until: End date (inclusive)
            branch: Branch name (default: current HEAD)

        Returns:
            List of CommitInfo objects, newest first

        Raises:
            ValueError: If branch doesn't exist
        """
        try:
            # Build git log arguments
            args = []

            if since:
                args.append(f"--since={since.isoformat()}")
            if until:
                args.append(f"--until={until.isoformat()}")

            # Get commits
            commits = []
            for commit in self.repo.iter_commits(branch, *args):
                # Get tags for this commit
                tags = []
                try:
                    for tag in self.repo.tags:
                        if tag.commit == commit:
                            tags.append(tag.name)
                except Exception:
                    pass

                commit_info = CommitInfo(
                    hash=commit.hexsha[:7],  # Short hash
                    author=commit.author.name,
                    email=commit.author.email,
                    date=datetime.fromtimestamp(commit.committed_date),
                    message=commit.message.strip(),
                    tags=tags,
                )
                commits.append(commit_info)

            logger.info(
                f"Retrieved {len(commits)} commits from {branch} "
                f"(since: {since}, until: {until})"
            )
            return commits

        except Exception as e:
            logger.error(f"Failed to get commits: {e}")
            raise ValueError(f"Failed to get commits: {str(e)}")

    def get_tags(self) -> dict[str, str]:
        """
        Get all tags and their commit hashes.

        Returns:
            Dict mapping tag name to commit hash
        """
        tags = {}
        try:
            for tag in self.repo.tags:
                tags[tag.name] = tag.commit.hexsha[:7]
        except Exception as e:
            logger.warning(f"Failed to get tags: {e}")

        return tags

    def get_branches(self) -> list[str]:
        """Get all branch names."""
        try:
            branches = [ref.name for ref in self.repo.heads]
            return branches
        except Exception as e:
            logger.warning(f"Failed to get branches: {e}")
            return []

    def cleanup(self) -> None:
        """Clean up temporary files (for cloned repos)."""
        try:
            repo_path = Path(self.repo.working_dir)
            if repo_path.parent.name == "tmp" or "git_analyzer" in str(repo_path):
                shutil.rmtree(repo_path)
                logger.info(f"Cleaned up repository at {repo_path}")
        except Exception as e:
            logger.warning(f"Could not cleanup repository: {e}")


def parse_commit_message(message: str) -> dict[str, str]:
    """
    Parse a commit message into components.

    Supports:
    - Conventional commits (type: description)
    - Freeform text

    Returns:
        Dict with keys: type, scope, description, body
    """
    lines = message.split("\n")
    first_line = lines[0].strip()

    # Try conventional commit format: type(scope): description
    if ":" in first_line:
        parts = first_line.split(":", 1)
        type_scope = parts[0].strip()
        description = parts[1].strip()

        # Extract scope if present
        scope = None
        commit_type = type_scope
        if "(" in type_scope and ")" in type_scope:
            commit_type = type_scope[: type_scope.index("(")].strip()
            scope = type_scope[type_scope.index("(") + 1 : type_scope.index(")")].strip()

        # Extract body (rest of message)
        body = "\n".join(lines[1:]).strip()

        return {
            "type": commit_type.lower(),
            "scope": scope or "",
            "description": description,
            "body": body,
            "raw": first_line,
        }

    # Freeform commit
    body = "\n".join(lines[1:]).strip()
    return {
        "type": "other",
        "scope": "",
        "description": first_line,
        "body": body,
        "raw": first_line,
    }
