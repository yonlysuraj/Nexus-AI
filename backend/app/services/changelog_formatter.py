"""Changelog formatting service."""

from datetime import datetime
from typing import Optional

from loguru import logger

from app.services.commit_categorizer import (
    CommitType,
    get_category_display_name,
    should_include_in_changelog,
)


class ChangelogEntry:
    """A single changelog entry (commit)."""

    def __init__(
        self,
        message: str,
        commit_type: CommitType,
        author: str,
        date: datetime,
        hash: str,
    ):
        self.message = message
        self.commit_type = commit_type
        self.author = author
        self.date = date
        self.hash = hash


class ChangelogSection:
    """A section of a changelog (grouped by type)."""

    def __init__(self, name: str, commit_type: CommitType):
        self.name = name
        self.commit_type = commit_type
        self.entries: list[ChangelogEntry] = []

    def add_entry(self, entry: ChangelogEntry) -> None:
        """Add an entry to this section."""
        self.entries.append(entry)

    def to_markdown(self, include_hashes: bool = False) -> str:
        """Convert section to markdown."""
        if not self.entries:
            return ""

        lines = [f"### {self.name}\n"]
        for entry in self.entries:
            line = f"- {entry.message.strip()}"
            if include_hashes:
                line += f" ([`{entry.hash}`])"
            lines.append(line)
        lines.append("")

        return "\n".join(lines)


class ChangelogVersion:
    """A version section in the changelog."""

    def __init__(self, version: str, date: Optional[datetime] = None, link: Optional[str] = None):
        self.version = version
        self.date = date or datetime.now()
        self.link = link
        self.sections: dict[str, ChangelogSection] = {}

    def add_entry(self, entry: ChangelogEntry) -> None:
        """Add an entry, creating section if needed."""
        commit_type = entry.commit_type
        display_name = get_category_display_name(commit_type)

        if display_name not in self.sections:
            self.sections[display_name] = ChangelogSection(display_name, commit_type)

        self.sections[display_name].add_entry(entry)

    def to_markdown(self, include_hashes: bool = False) -> str:
        """Convert version to markdown."""
        if not self.sections or not any(self.sections.values()):
            return ""

        lines = []

        # Version header with date
        date_str = self.date.strftime("%Y-%m-%d")
        if self.link:
            lines.append(f"## [{self.version}]({self.link}) - {date_str}\n")
        else:
            lines.append(f"## [{self.version}] - {date_str}\n")

        # Add sections
        for display_name in ["Added", "Fixed", "Changed", "Deprecated", "Removed", "Other"]:
            if display_name in self.sections:
                lines.append(self.sections[display_name].to_markdown(include_hashes))

        return "\n".join(lines)

    def has_content(self) -> bool:
        """Check if version has any entries."""
        return any(bool(section.entries) for section in self.sections.values())


class ChangelogFormatter:
    """Format commits into a Keep a Changelog compliant markdown."""

    @staticmethod
    def format_keep_changelog(
        entries: list[ChangelogEntry],
        version: str = "Unreleased",
        include_hashes: bool = False,
        group_by: str = "version",
    ) -> str:
        """
        Format changelog entries into Keep a Changelog markdown.

        Args:
            entries: List of changelog entries
            version: Version string (e.g., "1.0.0")
            include_hashes: Include commit hashes in entries
            group_by: "version" (default) or "date"

        Returns:
            Markdown changelog string
        """
        lines = []

        # Header
        lines.append("# Changelog\n")
        lines.append("All notable changes to this project are documented in this file.\n")
        lines.append(
            "The format is based on [Keep a Changelog](https://keepachangelog.com/), "
            "and this project adheres to [Semantic Versioning](https://semver.org/).\n"
        )
        lines.append("---\n")

        if not entries:
            lines.append("## [Unreleased]\n")
            lines.append("No changes yet.\n")
            return "\n".join(lines)

        # Create a single version for now (can be extended for multi-version)
        changelog_version = ChangelogVersion(version, entries[0].date if entries else None)

        for entry in entries:
            if should_include_in_changelog(entry.commit_type):
                changelog_version.add_entry(entry)

        if changelog_version.has_content():
            lines.append(changelog_version.to_markdown(include_hashes))

        return "\n".join(lines)

    @staticmethod
    def format_simple_list(entries: list[ChangelogEntry]) -> str:
        """
        Format entries as a simple list grouped by type.

        Returns:
            Markdown string
        """
        if not entries:
            return "No changes.\n"

        # Group by type
        by_type: dict[str, list[ChangelogEntry]] = {}
        for entry in entries:
            if should_include_in_changelog(entry.commit_type):
                if entry.commit_type not in by_type:
                    by_type[entry.commit_type] = []
                by_type[entry.commit_type].append(entry)

        lines = []
        for commit_type in ["feat", "fix", "refactor", "perf", "docs", "other"]:
            if commit_type in by_type and by_type[commit_type]:
                display_name = get_category_display_name(commit_type)  # type: ignore
                lines.append(f"## {display_name}\n")
                for entry in by_type[commit_type]:
                    lines.append(f"- {entry.message.strip()}")
                lines.append("")

        return "\n".join(lines)

    @staticmethod
    def get_statistics(entries: list[ChangelogEntry]) -> dict:
        """Get statistics about changelog entries."""
        stats = {
            "total": len(entries),
            "by_type": {},
            "by_author": {},
            "date_range": {
                "from": min((e.date for e in entries), default=None).isoformat()
                if entries
                else None,
                "to": max((e.date for e in entries), default=None).isoformat()
                if entries
                else None,
            },
        }

        # Count by type
        for entry in entries:
            commit_type = entry.commit_type
            stats["by_type"][commit_type] = stats["by_type"].get(commit_type, 0) + 1

        # Count by author
        for entry in entries:
            author = entry.author
            stats["by_author"][author] = stats["by_author"].get(author, 0) + 1

        logger.info(f"Changelog statistics: {stats}")
        return stats
