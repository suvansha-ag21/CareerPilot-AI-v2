import test from "node:test";
import assert from "node:assert/strict";
import {
  AnalyzeGitHubRepoSchema,
  GenerateDrillsSchema,
  InterviewSubmissionContextSchema,
  ReviewFlashcardSchema,
  TailorResumeSchema,
} from "@careerpilot/shared";
import { computeSm2Schedule } from "../src/modules/drills/drills.service";

test("SM-2 spaced repetition increases interval on consecutive Good/Easy ratings", () => {
  const baseDate = new Date("2026-11-12T00:00:00Z");

  const first = computeSm2Schedule({
    rating: 3,
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    now: baseDate,
  });
  assert.equal(first.repetitions, 1);
  assert.equal(first.intervalDays, 1);

  const second = computeSm2Schedule({
    rating: 3,
    easeFactor: first.easeFactor,
    intervalDays: first.intervalDays,
    repetitions: first.repetitions,
    now: baseDate,
  });
  assert.equal(second.repetitions, 2);
  assert.equal(second.intervalDays, 6);

  const reset = computeSm2Schedule({
    rating: 1,
    easeFactor: second.easeFactor,
    intervalDays: second.intervalDays,
    repetitions: second.repetitions,
    now: baseDate,
  });
  assert.equal(reset.repetitions, 0);
  assert.equal(reset.intervalDays, 1);
});

test("AnalyzeGitHubRepoSchema accepts valid GitHub URLs and rejects invalid/SSRF URLs", () => {
  const ok = AnalyzeGitHubRepoSchema.safeParse({
    repoUrl: "https://github.com/vercel/next.js",
  });
  assert.equal(ok.success, true);

  const badHost = AnalyzeGitHubRepoSchema.safeParse({
    repoUrl: "http://127.0.0.1:5000/owner/repo",
  });
  assert.equal(badHost.success, false);
});

test("Shared advanced Zod schemas validate boundaries properly", () => {
  assert.equal(
    TailorResumeSchema.safeParse({ targetRole: "AI Engineer", jobDescription: "LLMs & RAG" }).success,
    true
  );
  assert.equal(
    GenerateDrillsSchema.safeParse({ topics: ["DBMS", "Redis"], count: 6 }).success,
    true
  );
  assert.equal(ReviewFlashcardSchema.safeParse({ rating: 5 }).success, false);
  assert.equal(
    InterviewSubmissionContextSchema.safeParse({
      codeLanguage: "sql",
      codeSnippet: "SELECT * FROM users;",
      architectureNodes: ["Load Balancer", "API Gateway", "PostgreSQL"],
    }).success,
    true
  );
});
