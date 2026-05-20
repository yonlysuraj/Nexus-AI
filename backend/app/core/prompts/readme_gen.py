"""README Auto-Generator — Prompt Templates."""

SYSTEM_PROMPT = """\
You are an expert technical writer who specializes in creating outstanding \
GitHub README files. You have written READMEs for hundreds of popular open-source \
projects that get thousands of stars.

Your READMEs always follow this structure:
1. **Project Title** — Clear, concise name with a one-line tagline
2. **Badges** — Build status, license, version (use shields.io format)
3. **Description** — 2-3 sentences explaining what the project does and why
4. **Features** — Bullet list of key features/capabilities
5. **Tech Stack** — Table or list of technologies used
6. **Getting Started** — Prerequisites, installation steps, configuration
7. **Usage** — Code examples or screenshots showing how to use it
8. **Project Structure** — Simplified directory tree of key files
9. **Contributing** — How to contribute (brief)
10. **License** — License type

Rules:
- Output valid Markdown.
- Use emojis sparingly for section headers (1 per header max).
- Keep installation steps copy-paste ready (use code blocks).
- Be specific to the actual project — no generic placeholder content.
- If you detect a web app, include both dev and production setup.
- If you can identify the main language, tailor examples to it.\
"""


def build_user_prompt(
    repo_name: str,
    file_tree: str,
    tech_stack: dict,
    file_contents: dict | None = None,
) -> str:
    """Build the user prompt from repo analysis data."""

    stack_summary = ""
    if tech_stack:
        parts = []
        if tech_stack.get("languages"):
            parts.append(f"Languages: {', '.join(tech_stack['languages'])}")
        if tech_stack.get("frameworks"):
            parts.append(f"Frameworks: {', '.join(tech_stack['frameworks'])}")
        if tech_stack.get("tools"):
            parts.append(f"Tools: {', '.join(tech_stack['tools'])}")
        if tech_stack.get("package_manager"):
            parts.append(f"Package Manager: {tech_stack['package_manager']}")
        stack_summary = "\n".join(parts)

    contents_section = ""
    if file_contents:
        snippets = []
        for path, content in file_contents.items():
            # Truncate individual files
            truncated = content[:2000]
            if len(content) > 2000:
                truncated += "\n... (truncated)"
            snippets.append(f"### {path}\n```\n{truncated}\n```")
        contents_section = "\n\n".join(snippets)

    return f"""\
Generate a professional README.md for this repository.

REPOSITORY: {repo_name}

FILE TREE:
```
{file_tree}
```

DETECTED TECH STACK:
{stack_summary or "Could not auto-detect — infer from file tree."}

{f"KEY FILE CONTENTS:{chr(10)}{contents_section}" if contents_section else ""}

Generate the complete README.md now. Make it specific to this project — \
not a generic template.\
"""
