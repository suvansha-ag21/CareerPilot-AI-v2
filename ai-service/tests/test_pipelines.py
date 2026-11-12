import unittest
from fastapi import HTTPException
from app.core.llm_provider import ModularLLMClient
from app.pipelines.skill_gap_analyzer import _compute_dependency_order
from app.schemas.interview_schema import CriteriaScoresSchema
from app.schemas.skills_schema import SkillRequirementBenchmarkSchema
from app.services.github_analyzer import parse_github_owner_repo
from app.services.interview_engine import compute_weighted_score
from app.utils.skill_taxonomy import extract_canonical_skills


class TestAiPipelines(unittest.TestCase):
    def test_strip_json_fences(self) -> None:
        client = ModularLLMClient()
        raw = "```json\n{\"ok\": true}\n```"
        self.assertEqual(client._strip_json_fences(raw), '{"ok": true}')

    def test_weighted_rubric_score(self) -> None:
        scores = CriteriaScoresSchema(
            technicalAccuracy=90,
            depthOfUnderstanding=80,
            completeness=85,
            clarityAndStructure=75,
            practicalExamples=70,
        )
        # 0.30*90 + 0.25*80 + 0.20*85 + 0.15*75 + 0.10*70 = 27 + 20 + 17 + 11.25 + 7 = 82.25 -> 82.2 or 82.3
        computed = compute_weighted_score(scores)
        self.assertGreaterEqual(computed, 82.0)
        self.assertLessEqual(computed, 82.5)

    def test_github_url_parser_and_ssrf_guard(self) -> None:
        owner, repo = parse_github_owner_repo("https://github.com/vercel/next.js")
        self.assertEqual((owner, repo), ("vercel", "next.js"))

        with self.assertRaises(HTTPException):
            parse_github_owner_repo("http://127.0.0.1:8000/internal")

        with self.assertRaises(HTTPException):
            parse_github_owner_repo("https://evil.example.com/owner/repo")

    def test_canonical_skill_extraction(self) -> None:
        skills = extract_canonical_skills(
            "Built microservices in Node.js, TypeScript, React, PostgreSQL, and Docker."
        )
        lowered = {s.lower() for s in skills}
        self.assertIn("node.js", lowered)
        self.assertIn("typescript", lowered)
        self.assertIn("react", lowered)
        self.assertIn("postgresql", lowered)
        self.assertIn("docker", lowered)

    def test_topological_skill_gap_order(self) -> None:
        b1 = SkillRequirementBenchmarkSchema(
            skill="React",
            category="FRONTEND",
            importance="CRITICAL",
            requiredLevel="INTERMEDIATE",
            currentLevel=None,
            confidenceScore=0,
            status="MISSING",
            prerequisites=["JavaScript"],
            recommendedAction="Learn React",
            resources=[],
        )
        b2 = SkillRequirementBenchmarkSchema(
            skill="JavaScript",
            category="FRONTEND",
            importance="CRITICAL",
            requiredLevel="INTERMEDIATE",
            currentLevel=None,
            confidenceScore=0,
            status="MISSING",
            prerequisites=[],
            recommendedAction="Learn JS",
            resources=[],
        )
        order = _compute_dependency_order([b1, b2])
        self.assertEqual(order.index("JavaScript"), 0)
        self.assertEqual(order.index("React"), 1)


if __name__ == "__main__":
    unittest.main()
