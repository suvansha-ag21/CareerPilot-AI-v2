from typing import Set, Tuple
from app.core.llm_provider import llm_client
from app.schemas.skills_schema import (
    GeneratedRoadmapTaskItem,
    GenerateRoadmapRequest,
    GenerateRoadmapResponse,
    RoadmapLLMStructure,
)
from app.utils.learning_catalog import canonicalize_skill_name, get_skill_resources


async def generate_personalized_roadmap(
    payload: GenerateRoadmapRequest,
) -> GenerateRoadmapResponse:
    weeks = payload.estimated_weeks
    target_task_count = min(max(weeks * 3, 6), 28)

    gaps_desc = "\n".join(
        f"- {g.skill} (importance={g.importance}, status={g.status}, target={g.requiredLevel}, action={g.recommendedAction})"
        for g in payload.skill_gaps
    ) or "- Interview readiness, System Design trade-offs, and Portfolio Case Studies"

    system_prompt = (
        "You are a Senior Staff Engineer designing structured technical interview & skill-building study plans. "
        "Every task must be concrete, realistic, tailored to the candidate's current skill level, daily study hours, and preferred learning style."
    )
    user_prompt = (
        f"Target Role: {payload.target_role}\n"
        f"Current Skill Level: {payload.skill_level}\n"
        f"Study Duration: {payload.duration_days} days (~{weeks} weeks) at {payload.daily_study_hours} hr/day (~{payload.hours_per_week} hrs/week).\n"
        f"Learning Preference: {payload.learning_preference}\n"
        f"Target number of tasks: around {target_task_count} tasks distributed cleanly across weeks 1..{weeks} and dayNumber 1..5.\n"
        f"Dependency-Ordered Focus Sequence: {', '.join(payload.learning_order) or 'Role Mastery & Mock Interviews'}\n"
        f"Current Verified Skills: {', '.join(payload.current_skill_names[:20]) or 'None yet'}\n"
        f"Open Skill Gaps:\n{gaps_desc}\n"
        f"Candidate Resume Context: {(payload.resume_summary or '')[:1000]}\n\n"
        "Return a clean roadmap_title and week-by-week tasks covering the prerequisite order first, "
        "balancing concept mastery, hands-on implementation, and interview articulation. "
        "Keep weekNumber within 1..estimated_weeks and dayNumber within 1..5."
    )

    llm_plan = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=RoadmapLLMStructure,
    )

    used_slots: Set[Tuple[int, int]] = set()
    items: list[GeneratedRoadmapTaskItem] = []

    for raw_task in llm_plan.tasks:
        w = max(1, min(weeks, raw_task.weekNumber))
        d = max(1, min(5, raw_task.dayNumber))

        # Avoid duplicate (weekNumber, dayNumber) slots cleanly for clean calendar ordering
        while (w, d) in used_slots:
            if d < 5:
                d += 1
            elif w < weeks:
                w += 1
                d = 1
            else:
                break
        used_slots.add((w, d))

        canon_tag = canonicalize_skill_name(raw_task.skillTag)
        items.append(
            GeneratedRoadmapTaskItem(
                weekNumber=w,
                dayNumber=d,
                title=raw_task.title.strip(),
                description=raw_task.description.strip(),
                skillTag=canon_tag,
                priority=raw_task.priority,
                resources=get_skill_resources(canon_tag),
                dueDateOffsetDays=(w - 1) * 7 + d,
            )
        )

    items.sort(key=lambda t: (t.weekNumber, t.dayNumber))

    return GenerateRoadmapResponse(
        title=llm_plan.roadmap_title.strip() or f"{payload.target_role} {weeks}-Week Mastery Plan",
        estimated_weeks=weeks,
        tasks=items,
    )
