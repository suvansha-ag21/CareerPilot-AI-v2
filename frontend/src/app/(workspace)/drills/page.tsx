"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Eye,
  Flame,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { FlashcardDrillDTO } from "@careerpilot/shared";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { drillsApi } from "@/services/advanced.service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DailyDrillsPage() {
  const { user } = useAuth();
  const [drills, setDrills] = useState<FlashcardDrillDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [customTopicsText, setCustomTopicsText] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const loadDrills = useCallback(async () => {
    try {
      const list = await drillsApi.list();
      setDrills(list);
    } catch {
      setErrorMsg("Unable to load spaced-repetition flashcards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrills();
  }, [loadDrills]);

  const nowMs = Date.now();
  const dueDrills = drills.filter((d) => new Date(d.nextReviewAt).getTime() <= nowMs);
  const activeCard = dueDrills[0] || drills[0] || null;
  const masteredCount = drills.filter((d) => d.repetitions >= 2).length;

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setGenerating(true);
    try {
      const parsedTopics = customTopicsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const created = await drillsApi.generate({
        targetRole: user?.targetRole || undefined,
        topics: parsedTopics.length > 0 ? parsedTopics : undefined,
        count: 6,
      });
      setDrills((prev) => [...created, ...prev]);
      setCustomTopicsText("");
      setFlipped(false);
      setShowHint(false);
      setInfoMsg(
        `Generated ${created.length} spaced-repetition drills${
          parsedTopics.length === 0 ? " from your weak interview & JD topics" : ""
        }.`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Could not generate flashcards right now."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleReview(id: string, rating: 1 | 2 | 3 | 4) {
    setReviewingId(id);
    setErrorMsg(null);
    try {
      const updated = await drillsApi.review(id, rating);
      setDrills((prev) => {
        const next = prev.map((d) => (d.id === id ? updated : d));
        return next.sort(
          (a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
        );
      });
      setFlipped(false);
      setShowHint(false);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Unable to record review rating.");
    } finally {
      setReviewingId(null);
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    try {
      await drillsApi.delete(id);
      setDrills((prev) => prev.filter((d) => d.id !== id));
      setFlipped(false);
      setShowHint(false);
    } catch {
      setErrorMsg("Unable to delete flashcard.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top KPI & Generator Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Due Today
              </p>
              <p className="text-2xl font-bold text-[#6D5DFB] mt-2 tabular-nums">
                {dueDrills.length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center">
              <Flame className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Total Flashcards
              </p>
              <p className="text-2xl font-bold text-[#172033] mt-2 tabular-nums">
                {drills.length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-slate-100 text-[#172033] flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Mastered (2+ Streak)
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">
                {masteredCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generator Control Card */}
      <Card>
        <CardHeader
          icon={<Sparkles className="h-4 w-4" />}
          title="Spaced-Repetition Weak-Topic Micro-Drills"
          subtitle="Active-recall flashcards scheduled with SM-2 intervals from your interview weak topics and JD skill gaps"
        />
        <CardContent>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customTopicsText}
              onChange={(e) => setCustomTopicsText(e.target.value)}
              placeholder="Optional topics (comma-separated, e.g. MVCC, Redis Caching, System Design) — leave blank to auto-pull weak topics"
              className="flex-1 h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/20 focus:border-[#6D5DFB]"
            />
            <Button type="submit" variant="primary" loading={generating} className="shrink-0">
              <RefreshCw className="h-4 w-4" />
              {generating ? "Generating..." : "Generate 6 Drills"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-[#EF4444]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Active Review Stage */}
      {loading ? (
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : activeCard ? (
        <Card className="border-[#6D5DFB]/25">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="brand">{activeCard.topic}</Badge>
                <Badge tone={new Date(activeCard.nextReviewAt).getTime() <= nowMs ? "warning" : "success"}>
                  {new Date(activeCard.nextReviewAt).getTime() <= nowMs
                    ? "Due for Review"
                    : `Next in ${activeCard.intervalDays}d`}
                </Badge>
                <span className="text-[11px] text-[#64748B] tabular-nums">
                  Streak: {activeCard.repetitions} &bull; Ease: {activeCard.easeFactor}x
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(activeCard.id)}
                className="text-slate-400 hover:text-rose-500 p-1"
                title="Delete card"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <p className="text-base font-semibold text-[#172033] leading-relaxed">
                {activeCard.question}
              </p>

              {showHint && activeCard.hint && (
                <p className="text-xs text-[#6D5DFB] bg-[#EEF2FF] px-3 py-2 rounded-lg">
                  <strong>Hint:</strong> {activeCard.hint}
                </p>
              )}

              {flipped && (
                <div className="pt-3 border-t border-slate-200 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    Reference Answer
                  </p>
                  <p className="text-sm text-[#172033] leading-relaxed">
                    {activeCard.modelAnswer}
                  </p>
                </div>
              )}
            </div>

            {!flipped ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="primary" onClick={() => setFlipped(true)}>
                  <Eye className="h-4 w-4" />
                  Reveal Answer
                </Button>
                {activeCard.hint && !showHint && (
                  <Button type="button" variant="outline" onClick={() => setShowHint(true)}>
                    Show Hint
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#64748B]">
                  How confidently did you recall this? (SM-2 schedules your next review automatically)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reviewingId === activeCard.id}
                    onClick={() => void handleReview(activeCard.id, 1)}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Again (1d)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reviewingId === activeCard.id}
                    onClick={() => void handleReview(activeCard.id, 2)}
                    className="border-amber-200 text-amber-800 hover:bg-amber-50"
                  >
                    Hard
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={reviewingId === activeCard.id}
                    onClick={() => void handleReview(activeCard.id, 3)}
                  >
                    Good
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={reviewingId === activeCard.id}
                    onClick={() => void handleReview(activeCard.id, 4)}
                  >
                    {reviewingId === activeCard.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Easy"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <Brain className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-[#172033]">No flashcard drills yet</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Complete a Mock Interview to auto-generate weak-topic cards, or click &ldquo;Generate
              6 Drills&rdquo; above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Deck List */}
      {drills.length > 0 && (
        <Card>
          <CardHeader
            title={`All Saved Drills (${drills.length})`}
            subtitle="Ordered by next scheduled review time"
          />
          <CardContent className="divide-y divide-slate-100">
            {drills.map((d) => {
              const isDue = new Date(d.nextReviewAt).getTime() <= nowMs;
              return (
                <div
                  key={d.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="brand">{d.topic}</Badge>
                      <Badge tone={isDue ? "warning" : "neutral"}>
                        {isDue ? "Due Now" : `Interval: ${d.intervalDays}d`}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-[#172033] truncate">{d.question}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(d.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 shrink-0"
                    title="Delete card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
