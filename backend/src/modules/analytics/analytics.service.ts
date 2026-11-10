import { DashboardAnalyticsDTO } from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";

export class AnalyticsService {
  async getDashboardAnalytics(userId: string): Promise<DashboardAnalyticsDTO> {
    const [
      user,
      skillsCount,
      educationsCount,
      projectsCount,
      resumes,
      latestMatch,
      completedInterviews,
      activeRoadmap,
      applications,
      aiHealth,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userSkill.count({ where: { userId } }),
      prisma.education.count({ where: { userId } }),
      prisma.candidateProject.count({ where: { userId } }),
      prisma.resume.findMany({
        where: { userId },
        select: { id: true, title: true, estimatedScore: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.jobMatch.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, targetRole: true, matchScore: true, createdAt: true },
      }),
      prisma.interview.findMany({
        where: { userId, status: "COMPLETED" },
        select: { id: true, category: true, overallScore: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      }),
      prisma.learningRoadmap.findFirst({
        where: { userId, isActive: true },
        select: { id: true, title: true, progressPct: true, updatedAt: true },
      }),
      prisma.jobApplication.findMany({
        where: { userId },
        select: {
          id: true,
          company: true,
          jobRole: true,
          status: true,
          interviewDate: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      aiServiceClient.checkHealth(),
    ]);

    const latestResumeScore =
      resumes.length > 0 ? Math.round(resumes[0].estimatedScore * 10) / 10 : null;
    const latestJobMatchScore = latestMatch ? Math.round(latestMatch.matchScore * 10) / 10 : null;

    const scoredInterviews = completedInterviews.filter((i) => i.overallScore !== null);
    const averageInterviewScore =
      scoredInterviews.length > 0
        ? Math.round(
            (scoredInterviews.reduce((sum, i) => sum + (i.overallScore ?? 0), 0) /
              scoredInterviews.length) *
              10
          ) / 10
        : null;

    let readinessScore: number | null = null;
    if (latestResumeScore !== null || averageInterviewScore !== null || activeRoadmap !== null) {
      const weights: Array<{ val: number; weight: number }> = [];
      if (averageInterviewScore !== null) weights.push({ val: averageInterviewScore, weight: 0.45 });
      if (latestResumeScore !== null) weights.push({ val: latestResumeScore, weight: 0.3 });
      if (activeRoadmap !== null) weights.push({ val: activeRoadmap.progressPct, weight: 0.25 });

      const totalWeight = weights.reduce((acc, w) => acc + w.weight, 0);
      readinessScore =
        totalWeight > 0
          ? Math.round(weights.reduce((acc, w) => acc + w.val * (w.weight / totalWeight), 0))
          : null;
    }

    const activeApps = applications.filter(
      (a) => a.status !== "REJECTED" && a.status !== "OFFER_RECEIVED" && a.status !== "SELECTED"
    );
    const interviewsScheduled = applications.filter(
      (a) => a.status === "INTERVIEW_SCHEDULED"
    ).length;
    const offersReceived = applications.filter(
      (a) => a.status === "OFFER_RECEIVED" || a.status === "SELECTED"
    ).length;

    const now = new Date();
    const upcomingInterviews = applications
      .filter((a) => a.interviewDate && a.interviewDate >= now)
      .sort((a, b) => (a.interviewDate!.getTime() - b.interviewDate!.getTime()))
      .slice(0, 4)
      .map((a) => ({
        id: a.id,
        company: a.company,
        jobRole: a.jobRole,
        interviewDate: a.interviewDate!.toISOString(),
      }));

    // Profile completeness from real relational rows
    const profileSignals = [
      Boolean(user?.name),
      Boolean(user?.targetRole),
      Boolean(user?.headline),
      Boolean(user?.location),
      educationsCount > 0,
      skillsCount > 0,
      projectsCount > 0,
      Boolean(user?.githubUrl || user?.linkedinUrl),
    ];
    const profileCompletenessPct = Math.round(
      (profileSignals.filter(Boolean).length / profileSignals.length) * 100
    );

    // Real chronological activity
    const recentActivities: DashboardAnalyticsDTO["recentActivities"] = [];
    for (const r of resumes.slice(0, 3)) {
      recentActivities.push({
        id: r.id,
        type: "RESUME",
        title: `Analyzed resume: ${r.title}`,
        subtitle: `Estimated Compatibility Score: ${Math.round(r.estimatedScore)}%`,
        timestamp: r.createdAt.toISOString(),
      });
    }
    if (latestMatch) {
      recentActivities.push({
        id: latestMatch.id,
        type: "MATCH",
        title: `Matched JD: ${latestMatch.targetRole}`,
        subtitle: `Compatibility: ${Math.round(latestMatch.matchScore)}%`,
        timestamp: latestMatch.createdAt.toISOString(),
      });
    }
    for (const s of scoredInterviews.slice(0, 3)) {
      recentActivities.push({
        id: s.id,
        type: "INTERVIEW",
        title: `Completed ${s.category} mock interview`,
        subtitle: `Score: ${Math.round(s.overallScore ?? 0)}%`,
        timestamp: (s.completedAt ?? new Date()).toISOString(),
      });
    }
    for (const app of applications.slice(0, 3)) {
      recentActivities.push({
        id: app.id,
        type: "APPLICATION",
        title: `${app.company} — ${app.jobRole}`,
        subtitle: `Pipeline stage: ${app.status.replace(/_/g, " ")}`,
        timestamp: app.updatedAt.toISOString(),
      });
    }
    if (user) {
      recentActivities.push({
        id: user.id,
        type: "PROFILE",
        title: `Profile initialized (${user.targetRole})`,
        subtitle: `${skillsCount} technical skills · ${educationsCount} education · ${projectsCount} projects`,
        timestamp: user.updatedAt.toISOString(),
      });
    }

    recentActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Deterministic, state-driven AI workflow recommendations
    const recommendations: DashboardAnalyticsDTO["recommendations"] = [];
    if (profileCompletenessPct < 75) {
      recommendations.push({
        title: "Complete education, projects & skill inventory",
        reason: `Your profile is ${profileCompletenessPct}% complete. Adding structured projects improves project-based interviews and skill gap accuracy.`,
        actionHref: "/profile",
        actionLabel: "Complete Profile",
        priority: "HIGH",
      });
    }
    if (resumes.length === 0) {
      recommendations.push({
        title: "Upload your resume for ATS & structure audit",
        reason: "Phase 2 unlocks PDF/DOCX parsing, structural feedback, and semantic embedding indexing.",
        actionHref: "/resume",
        actionLabel: "Go to Resume AI",
        priority: "HIGH",
      });
    }
    if (!latestMatch) {
      recommendations.push({
        title: "Benchmark against a target Job Description",
        reason: "Compare your current stack against real hiring requirements to uncover high-priority skill gaps.",
        actionHref: "/matcher",
        actionLabel: "Open Job Matcher",
        priority: "MEDIUM",
      });
    }
    if (completedInterviews.length === 0) {
      recommendations.push({
        title: `Start a baseline ${user?.targetRole || "Technical"} interview`,
        reason: "Establish your objective communication and technical correctness baseline.",
        actionHref: "/interview",
        actionLabel: "Launch Mock Room",
        priority: "MEDIUM",
      });
    }

    return {
      readinessScore,
      latestResumeScore,
      latestJobMatchScore,
      totalMockInterviews: completedInterviews.length,
      averageInterviewScore,
      skillsCount,
      roadmapProgressPct: activeRoadmap ? Math.round(activeRoadmap.progressPct) : null,
      applicationStats: {
        total: applications.length,
        active: activeApps.length,
        interviewsScheduled,
        offersReceived,
      },
      profileCompletenessPct,
      serviceHealth: {
        database: "healthy",
        aiService: aiHealth.healthy ? "healthy" : "unavailable",
      },
      recentActivities: recentActivities.slice(0, 6),
      upcomingInterviews,
      recommendations: recommendations.slice(0, 4),
    };
  }
}

export const analyticsService = new AnalyticsService();
