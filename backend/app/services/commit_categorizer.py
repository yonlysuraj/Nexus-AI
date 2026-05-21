"""Commit message categorization service."""

import re
from typing import Literal

from loguru import logger

CommitType = Literal[
    "feat",
    "fix",
    "docs",
    "style",
    "refactor",
    "perf",
    "test",
    "chore",
    "build",
    "ci",
    "revert",
    "other",
]

# Category descriptions
CATEGORY_DESCRIPTIONS = {
    "feat": "New features",
    "fix": "Bug fixes",
    "docs": "Documentation changes",
    "style": "Code style changes",
    "refactor": "Code refactoring",
    "perf": "Performance improvements",
    "test": "Test changes",
    "chore": "Build/dependency updates",
    "build": "Build system changes",
    "ci": "CI/CD changes",
    "revert": "Revert previous commits",
    "other": "Other changes",
}

# Conventional commit pattern
CONVENTIONAL_PATTERN = r"^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?!?:"

# Keyword-based categorization patterns
KEYWORD_PATTERNS = {
    "feat": [
        r"\b(add|new|implement|introduce|feature)\b",
        r"\badd\s+(feature|capability|support)",
    ],
    "fix": [
        r"\b(fix|fixed|fixes|bug|bugfix|patch)\b",
        r"\b(resolve|resolved|resolves)\b",
        r"\b(close|closes|closed)\b",
    ],
    "docs": [
        r"\b(doc|docs|documentation|readme|changelog)\b",
        r"\b(document|documented|comment|README)\b",
    ],
    "style": [
        r"\b(style|format|prettier|lint|eslint|black|ruff)\b",
        r"\b(whitespace|spacing|indent)\b",
    ],
    "refactor": [
        r"\b(refactor|refactored|cleanup|clean|simplify)\b",
        r"\b(reorganize|reorganized|restructure)\b",
    ],
    "perf": [
        r"\b(perf|performance|optimize|optimization|faster|speed)\b",
        r"\b(benchmark|profiling)\b",
    ],
    "test": [
        r"\b(test|tests|testing|spec|coverage)\b",
        r"\b(test:?|unit|integration|e2e)\b",
    ],
    "chore": [
        r"\b(chore|deps|dependency|update|upgrade|bump)\b",
        r"\b(maintenance|maintain)\b",
    ],
    "build": [
        r"\b(build|builder|build system|build process)\b",
        r"\b(gradle|maven|npm|webpack|vite)\b",
    ],
    "ci": [
        r"\b(ci|ci/cd|github actions|gitlab ci|jenkins|travis|circleci)\b",
        r"\b(workflow|action)\b",
    ],
    "revert": [r"\b(revert|revert.*commit)\b"],
}


def categorize_commit(message: str) -> CommitType:
    """
    Categorize a commit message into a type.

    Strategy:
    1. Check conventional commit prefix
    2. Check keywords in message
    3. Default to 'other'

    Args:
        message: Commit message

    Returns:
        Commit type
    """
    if not message:
        return "other"

    # First line only
    first_line = message.split("\n")[0].lower()

    # Check conventional commit
    match = re.match(CONVENTIONAL_PATTERN, first_line)
    if match:
        commit_type = match.group(1).lower()
        logger.debug(f"Categorized (conventional): {first_line[:50]}... → {commit_type}")
        return commit_type  # type: ignore

    # Check keyword patterns
    for commit_type, patterns in KEYWORD_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, first_line, re.IGNORECASE):
                logger.debug(f"Categorized (keyword): {first_line[:50]}... → {commit_type}")
                return commit_type  # type: ignore

    logger.debug(f"Categorized (default): {first_line[:50]}... → other")
    return "other"


def get_category_display_name(category: CommitType) -> str:
    """Get display name for a category."""
    name_map = {
        "feat": "Added",
        "fix": "Fixed",
        "docs": "Documentation",
        "style": "Style",
        "refactor": "Changed",
        "perf": "Performance",
        "test": "Tests",
        "chore": "Chores",
        "build": "Build",
        "ci": "CI/CD",
        "revert": "Reverted",
        "other": "Other",
    }
    return name_map.get(category, "Other")


def should_include_in_changelog(category: CommitType) -> bool:
    """Determine if a commit should be included in changelog."""
    # Exclude test, style, ci, build from user-facing changelog
    exclude = {"test", "style", "ci", "build", "chore"}
    return category not in exclude
