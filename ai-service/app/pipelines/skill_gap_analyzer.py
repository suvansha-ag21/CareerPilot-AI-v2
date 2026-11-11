from collections import defaultdict, deque
from typing import Dict, List, Tuple
from app.core.llm_provider import llm_client
from app.schemas.skills_schema import (
    AnalyzeSkillGapRequest,
    AnalyzeSkillGapResponse,
    BenchmarkStatusStr,
    CandidateSkillInput,
    ProficiencyStr,
    SkillCategoryCoverageSchema,
    SkillCategoryStr,
    SkillGapLLMEnrichment,
    SkillImportanceStr,
    SkillRequirementBenchmarkSchema,
)
from app.utils.learning_catalog import (
    CATEGORY_LABELS,
    SKILL_METADATA,
    canonicalize_skill_name,
    get_role_blueprint,
    get_skill_resources,
)

PROFICIENCY_RANK: Dict[ProficiencyStr, int] = {
    "BEGINNER": 1,
    "INTERMEDIATE": 2,
    "ADVANCED": 3,
}

IMPORTANCE_WEIGHT: Dict[SkillImportanceStr, float] = {
    "CRITICAL": 3.0,
    "IMPORTANT": 2.0,
    "NICE_TO_HAVE": 1.0,
}


def _compute_dependency_order(items: List[SkillRequirementBenchmarkSchema]) -> List[str]:
    """Topological sort ordered by prerequisites first, then critical priority."""
    gap_items = [b for b in items if b.status != "MASTERED"]
    target_names = {b.skill for b in gap_items}
    priority_rank = {"CRITICAL": 0, "IMPORTANT": 1, "NICE_TO_HAVE": 2}
    meta_by_name = {b.skill: b for b in gap_items}

    indegree: Dict[str, int] = {name: 0 for name in target_names}
    dependents: Dict[str, List[str]] = defaultdict(list)

    for b in gap_items:
        for pre in b.prerequisites:
            canon_pre = canonicalize_skill_name(pre)
            if canon_pre in target_names and canon_pre != b.skill:
                dependents[canon_pre].append(b.skill)
                indegree[b.skill] += 1

    ready = sorted(
        [name for name, deg in indegree.items() if deg == 0],
        key=lambda n: (priority_rank[meta_by_name[n].importance], meta_by_name[n].skill),
    )
    queue: deque[str] = deque(ready)
    ordered: List[str] = []

    while queue:
        curr = queue.popleft()
        ordered.append(curr)
        newly_ready: List[str] = []
        for dep in dependents[curr]:
            indegree[dep] -= 1
            if indegree[dep] == 0:
                newly_ready.append(dep)
        if newly_ready:
            for item in sorted(newly_ready, key=lambda n: priority_rank[meta_by_name[n].importance]):
                queue.append(item)

    # Append any residual skills cleanly if a cycle was specified
    for b in sorted(gap_items, key=lambda x: priority_rank[x.importance]):
        if b.skill not in ordered:
            ordered.append(b.skill)

    return ordered


def _build_candidate_skill_index(
    current_skills: List[CandidateSkillInput], resume_skills: List[str]
) -> Dict[str, Tuple[ProficiencyStr, int, str]]:
    skill_map: Dict[str, Tuple[ProficiencyStr, int, str]] = {}
    for s in current_skills:
        canon = canonicalize_skill_name(s.name)
        existing = skill_map.get(canon)
        if not existing or s.confidenceScore > existing[1]:
            skill_map[canon] = (s.proficiencyLevel, s.confidenceScore, s.source)

    for rs in resume_skills:
        canon = canonicalize_skill_name(rs)
        if canon not in skill_map:
            skill_map[canon] = ("INTERMEDIATE", 70, "RESUME_PARSED")

    return skill_map


async def run_skill_gap_analysis(payload: AnalyzeSkillGapRequest) -> AnalyzeSkillGapResponse:
    candidate_index = _build_candidate_skill_index(payload.current_skills, payload.resume_skills)
    blueprint = get_role_blueprint(payload.target_role)
    blueprint_names = {canonicalize_skill_name(name) for name, _, _ in blueprint}

    # Fold any open Job Match requirements cleanly into the required benchmark set
    for m_skill in payload.job_match_missing_skills:
        canon = canonicalize_skill_name(m_skill)
        if canon and canon not in blueprint_names:
            blueprint.append((canon, "CRITICAL", "INTERMEDIATE"))
            blueprint_names.add(canon)

    for p_skill in payload.job_match_partial_skills:
        # Handle "Docker (transferable to Kubernetes)" cleanly
        base_token = p_skill.split("(")[0].strip()
        canon = canonicalize_skill_name(base_token)
        if canon and canon not in blueprint_names:
            blueprint.append((canon, "IMPORTANT", "INTERMEDIATE"))
            blueprint_names.add(canon)

    benchmarks: List[SkillRequirementBenchmarkSchema] = []
    weighted_achieved = 0.0
    weighted_total = 0.0
    cat_stats: Dict[SkillCategoryStr, List[int]] = defaultdict(lambda: [0, 0])  # [covered, total]

    for skill_name, importance, required_level in blueprint:
        meta_category, prereqs = SKILL_METADATA.get(skill_name, ("CORE_CS", []))
        candidate_entry = candidate_index.get(skill_name)

        weight = IMPORTANCE_WEIGHT[importance]
        weighted_total += weight
        cat_stats[meta_category][1] += 1

        if candidate_entry:
            curr_level, confidence, source = candidate_entry
            curr_rank = PROFICIENCY_RANK[curr_level]
            req_rank = PROFICIENCY_RANK[required_level]
            if curr_rank >= req_rank:
                status: BenchmarkStatusStr = "MASTERED"
                weighted_achieved += weight
                cat_stats[meta_category][0] += 1
                default_action = f"Maintain {skill_name} strength and practice explaining production trade-offs in interviews."
            else:
                status = "NEEDS_LEVEL_UP"
                weighted_achieved += weight * (curr_rank / req_rank)
                cat_stats[meta_category][0] += 1 if curr_rank >= 2 else 0
                default_action = f"Bridge {skill_name} from {curr_level.title()} to {required_level.title()} with applied exercises."
        else:
            curr_level = None
            confidence = 0
            source = None
            status = "MISSING"
            default_action = f"Learn {skill_name} fundamentals and build a small applied project demonstrating {required_level.lower()} usage."

        benchmarks.append(
            SkillRequirementBenchmarkSchema(
                skill=skill_name,
                category=meta_category,
                importance=importance,
                requiredLevel=required_level,
                currentLevel=curr_level,
                confidenceScore=confidence,
                status=status,
                source=source,
                prerequisites=prereqs,
                recommendedAction=default_action,
                resources=get_skill_resources(skill_name),
            )
        )

    readiness_pct = round((weighted_achieved / weighted_total) * 100.0, 1) if weighted_total > 0 else 0.0
    mastered_count = sum(1 for b in benchmarks if b.status == "MASTERED")
    needs_level_up_count = sum(1 for b in benchmarks if b.status == "NEEDS_LEVEL_UP")
    missing_count = sum(1 for b in benchmarks if b.status == "MISSING")
    missing_or_gap = [b for b in benchmarks if b.status != "MASTERED"]
    learning_order = _compute_dependency_order(benchmarks)

    category_breakdown = [
        SkillCategoryCoverageSchema(
            category=cat,
            label=CATEGORY_LABELS[cat],
            covered=counts[0],
            total=counts[1],
            coveragePct=round((counts[0] / counts[1]) * 100.0, 1) if counts[1] > 0 else 0.0,
        )
        for cat, counts in cat_stats.items()
    ]

    # Genuine Gemini LLM narrative + tactical action coaching
    current_summary = ", ".join(
        f"{name} ({lvl.lower()})" for name, (lvl, _, _) in list(candidate_index.items())[:25]
    ) or "No verified skills yet"
    gap_summary = ", ".join(
        f"{b.skill} [{b.importance}, status={b.status}, req={b.requiredLevel}]"
        for b in missing_or_gap
    ) or "None — all role requirements met"

    system_prompt = (
        "You are a Principal Engineering Career Coach and Technical Hiring Bar Advisor. "
        "Provide crisp, concrete, evidence-based skill gap guidance tailored to a candidate's exact target role and current stack. "
        "Do not fabricate skills the candidate does not have."
    )
    user_prompt = (
        f"Target Role: {payload.target_role}\n"
        f"Computed Role Readiness: {readiness_pct}%\n"
        f"Current Skills: {current_summary}\n"
        f"Open Skill Gaps & Level-Ups: {gap_summary}\n"
        f"Dependency-Ordered Study Sequence: {', '.join(learning_order) or 'None'}\n"
        f"Job Match Context: {payload.job_match_role or 'General role benchmark'}\n"
        f"Resume Excerpt: {(payload.resume_summary or '')[:1200]}\n\n"
        "Generate:\n"
        "1. ai_summary: 2-3 concise sentences diagnosing readiness, strongest asset, and highest-leverage gap.\n"
        "2. quick_wins: 3-4 immediate actionable steps they can finish within 7 days.\n"
        "3. skill_actions: concise 1-sentence tactical advice for each open skill gap."
    )

    enrichment = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=SkillGapLLMEnrichment,
    )

    action_map = {
        canonicalize_skill_name(hint.skill).lower(): hint.recommended_action
        for hint in enrichment.skill_actions
        if hint.recommended_action.strip()
    }
    for b in benchmarks:
        custom = action_map.get(b.skill.lower())
        if custom:
            b.recommendedAction = custom

    return AnalyzeSkillGapResponse(
        target_role=payload.target_role,
        readiness_pct=readiness_pct,
        total_required=len(benchmarks),
        mastered_count=mastered_count,
        needs_level_up_count=needs_level_up_count,
        missing_count=missing_count,
        benchmarks=benchmarks,
        missing_skills=[b for b in benchmarks if b.status != "MASTERED"],
        learning_order=learning_order,
        category_breakdown=category_breakdown,
        ai_summary=enrichment.ai_summary,
        quick_wins=enrichment.quick_wins,
    )
