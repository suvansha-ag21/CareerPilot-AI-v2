from app.core.llm_provider import llm_client
from app.schemas.advanced_schema import (
    FlashcardDrillsLLM,
    GenerateDrillsRequest,
    GenerateDrillsResponse,
)


async def generate_flashcard_drills(
    payload: GenerateDrillsRequest,
) -> GenerateDrillsResponse:
    topics_str = ", ".join(payload.topics) if payload.topics else (
        "Data Structures & Algorithms, DBMS Indexing, System Design Caching, API Auth & Concurrency"
    )
    system_prompt = (
        "You are a Technical Interview Memory Coach creating active-recall spaced-repetition "
        "flashcards for software engineers. Questions must be crisp, specific, and test core mechanisms, "
        "complexity bounds, or architecture trade-offs."
    )
    user_prompt = (
        f"Target Role: {payload.target_role}\n"
        f"Focus Topics (Weak Topics / Missing Skills): {topics_str}\n"
        f"Generate exactly {payload.count} active-recall flashcards.\n"
        "Each drill must have: topic (short 1-3 word label), question (1-2 sharp sentences), "
        "hint (short memory cue without giving away the answer), and model_answer (2-4 sentence accurate technical answer)."
    )

    llm_out = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=FlashcardDrillsLLM,
    )

    return GenerateDrillsResponse(drills=llm_out.drills[: payload.count])
