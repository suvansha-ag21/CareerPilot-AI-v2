import base64
import re
from typing import Dict, List, Tuple
import httpx
from fastapi import HTTPException, status
from app.core.llm_provider import llm_client
from app.schemas.advanced_schema import (
    AnalyzeGitHubRepoResponse,
    GitHubArchitectureLLM,
)

GITHUB_REPO_RE = re.compile(
    r"^https?://(?:www\.)?github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git|/|$)"
)


def parse_github_owner_repo(repo_url: str) -> Tuple[str, str]:
    m = GITHUB_REPO_RE.match(repo_url.strip())
    if not m:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub repository URL. Expected https://github.com/<owner>/<repo>.",
        )
    owner, repo = m.group(1), m.group(2)
    return owner, repo


async def analyze_github_repository(repo_url: str) -> AnalyzeGitHubRepoResponse:
    owner, repo = parse_github_owner_repo(repo_url)
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "CareerPilot-AI-Analyzer",
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(18.0, connect=8.0)) as client:
        meta_resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}", headers=headers
        )
        if meta_resp.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Public GitHub repository '{owner}/{repo}' not found or private.",
            )
        if meta_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API returned HTTP {meta_resp.status_code} while inspecting repository.",
            )

        meta = meta_resp.json()
        default_branch = str(meta.get("default_branch") or "main")
        description = meta.get("description")
        primary_language = meta.get("language")
        stars = int(meta.get("stargazers_count") or 0)

        # Fetch README excerpt
        readme_text = ""
        readme_resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/readme", headers=headers
        )
        if readme_resp.status_code == 200:
            readme_json = readme_resp.json()
            encoded = readme_json.get("content", "")
            if encoded:
                try:
                    readme_text = base64.b64decode(encoded).decode("utf-8", errors="ignore")[:4500]
                except Exception:
                    readme_text = ""

        # Fetch top-level file listing
        tree_files: List[str] = []
        contents_resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents", headers=headers
        )
        if contents_resp.status_code == 200 and isinstance(contents_resp.json(), list):
            for entry in contents_resp.json()[:35]:
                if isinstance(entry, dict) and entry.get("name"):
                    kind = "dir" if entry.get("type") == "dir" else "file"
                    tree_files.append(f"[{kind}] {entry['name']}")

        # Inspect common dependency manifests cleanly
        manifest_snippets: Dict[str, str] = {}
        for manifest in ("package.json", "requirements.txt", "pyproject.toml", "pom.xml", "Dockerfile"):
            if any(manifest in line for line in tree_files):
                m_resp = await client.get(
                    f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{manifest}",
                    headers={"User-Agent": "CareerPilot-AI-Analyzer"},
                )
                if m_resp.status_code == 200:
                    manifest_snippets[manifest] = m_resp.text[:1800]

    manifest_block = "\n\n".join(
        f"--- {name} ---\n{content}" for name, content in manifest_snippets.items()
    )

    system_prompt = (
        "You are a Principal Software Architect analyzing a candidate's public GitHub repository. "
        "Extract the verified technical stack, concise architectural highlights, and 3-5 probing "
        "engineering interview questions grounded strictly in the repository metadata, file structure, manifests, and README."
    )
    user_prompt = (
        f"Repository: {owner}/{repo} (stars={stars}, primary_language={primary_language or 'Unknown'})\n"
        f"Description: {description or 'None'}\n\n"
        f"Top-Level Files:\n" + ("\n".join(tree_files) or "Unavailable") + "\n\n"
        f"Manifests:\n{manifest_block or 'None detected'}\n\n"
        f"README Excerpt:\n{readme_text or 'No README available'}\n\n"
        "Return detected_stack, 3-5 architecture_highlights, 3-5 interview_hooks (specific technical questions "
        "an interviewer would ask about this codebase), and a crisp 2-3 sentence architectural summary."
    )

    llm_out = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=GitHubArchitectureLLM,
    )

    return AnalyzeGitHubRepoResponse(
        repoUrl=f"https://github.com/{owner}/{repo}",
        owner=owner,
        repoName=repo,
        description=description,
        defaultBranch=default_branch,
        primaryLanguage=primary_language,
        stars=stars,
        detectedStack=llm_out.detected_stack,
        architectureHighlights=llm_out.architecture_highlights,
        interviewHooks=llm_out.interview_hooks,
        summary=llm_out.summary.strip(),
    )
