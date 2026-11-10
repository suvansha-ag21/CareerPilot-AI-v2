import { DashboardOverviewDTO } from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";

export class AnalyticsService {
  async getOverview(userId: string): Promise<DashboardOverviewDTO> {
    const [
      profile,
      resumes,
      matchesCount,
      openSkillGapsCount,
      completedInterviews,
      activeApplicationsCount,
      activeRoadmap,
      aiHealth,
    ] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.resume.findMany({
        where: { userId },
        select: { id: true, title: true, atsScore: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.matchAnalysis.count({ where: { userId } }),
      prisma.skillGap.count({ where: { userId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.interviewSession.findMany({
        where: { userId, status: "COMPLETED" },
        select: { id: true, targetRole: true, overallScore: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      }),
      prisma.jobApplication.count({
        where: { userId, status: { notIn: ["REJECTED", "OFFER"] } },
      }),
      prisma.learningRoadmap.findFirst({
        where: { userId, isActive: true },
        select: { id: true, title: true, progressPct: true, updatedAt: true },
      }),
      aiServiceClient.checkHealth(),
    ]);

    // Real ATS average if resumes exist
    const averageAtsScore =
      resumes.length > 0
        ? Math.round((resumes.reduce((acc, r) => acc + r.atsScore, 0) / resumes.length) * 10) / 10
        : null;

    // Real Readiness Score computed only once candidate has assessment data
    const scoredInterviews = completedInterviews.filter((s) => s.overallScore !== null);
    const avgInterviewScore =
      scoredInterviews.length > 0
        ? scoredInterviews.reduce((acc, s) => acc + (s.overallScore ?? 0), 0) / scoredInterviews.length
        : null;

    let readinessScore: number | null = null;
    if (averageAtsScore !== null || avgInterviewScore !== null || activeRoadmap !== null) {
      const components: Array<{ val: number; weight: number }> = [];
      if (avgInterviewScore !== null) components.push({ val: avgInterviewScore, weight: 0.5 });
      if (averageAtsScore !== null) components.push({ val: averageAtsScore, weight: 0.3 });
      if (activeRoadmap !== null) components.push({ val: activeRoadmap.progressPct, weight: 0.2 });

      const weightSum = components.reduce((s, c) => s + c.weight, 0);
      readinessScore =
        weightSum > 0
          ? Math.round(components.reduce((s, c) => s + c.val * (c.weight / weightSum), 0))
          : null;
    }

    // Calculate real profile completeness
    const checks = [
      Boolean(profile?.fullName),
      Boolean(profile?.targetRole),
      Boolean(profile?.headline),
      Boolean(profile?.location),
      (profile?.preferredStack?.length ?? 0) > 0,
      Boolean(profile?.githubUrl || profile?.linkedinUrl),
    ];
    const profileCompletenessPct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    // Real chronological activity from PostgreSQL
    const recentActivity: DashboardOverviewDTO["recentActivity"] = [];
    for (const r of resumes.slice(0, 3)) {
      recentActivity.push({
        id: r.id,
        type: "RESUME",
        title: `Analyzed resume: ${r.title}`,
        subtitle: `ATS Score: ${Math.round(r.atsScore)}%`,
        timestamp: r.createdAt.toISOString(),
      });
    }
    for (const s of scoredInterviews.slice(0, 3)) {
      recentActivity.push({
        id: s.id,
        type: "INTERVIEW",
        title: `Completed mock interview (${s.targetRole})`,
        subtitle: `Overall Score: ${Math.round(s.overallScore ?? 0)}%`,
        timestamp: (s.completedAt ?? new Date()).toISOString(),
      });
    }
    if (profile) {
      recentActivity.push({
        id: profile.id,
        type: "PROFILE",
        title: `Target track: ${profile.targetRole}`,
        subtitle: `Profile completeness: ${profileCompletenessPct}%`,
        timestamp: profile.updatedAt.toISOString(),
      });
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      readinessScore,
      averageAtsScore,
      resumesCount: resumes.length,
      matchesCount,
      openSkillGapsCount,
      completedInterviewsCount: completedInterviews.length,
      activeApplicationsCount,
      roadmapProgressPct: activeRoadmap ? Math.round(activeRoadmap.progressPct) : null,
      profileCompletenessPct,
      serviceHealth: {
        database: "healthy",
        aiService: aiHealth.healthy ? "healthy" : "unavailable",
      },
      recentActivity: recentActivity.slice(0, 6),
    };
  }
}

export const analyticsService = new AnalyticsService();
