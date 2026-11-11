import {
  ApplicationStatus,
  DashboardAnalyticsDTO,
  DetailedAnalyticsDTO,
  InterviewCategory,
  InterviewFeedbackSummaryDTO,
  InterviewMode,
} from "@careerpilot/shared";
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
        where: { userId, extractedText: { not: "" } },
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
    if (!activeRoadmap) {
      recommendations.push({
        title: "Analyze skill gaps & generate a weekly roadmap",
        reason: "Turn your target role requirements into prioritized weekly study tasks tracked in PostgreSQL.",
        actionHref: "/skills",
        actionLabel: "Analyze Skills",
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

  async getDetailedAnalytics(userId: string): Promise<DetailedAnalyticsDTO> {
    const [overview, interviews, resumes, matches, applications, userSkills, roadmaps] =
      await Promise.all([
        this.getDashboardAnalytics(userId),
        prisma.interview.findMany({
          where: { userId, status: "COMPLETED", overallScore: { not: null } },
          orderBy: { completedAt: "asc" },
          select: {
            id: true,
            category: true,
            mode: true,
            overallScore: true,
            feedbackSummary: true,
            completedAt: true,
            createdAt: true,
          },
        }),
        prisma.resume.findMany({
          where: { userId, extractedText: { not: "" } },
          orderBy: { createdAt: "asc" },
          select: { id: true, title: true, estimatedScore: true, createdAt: true },
        }),
        prisma.jobMatch.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            targetRole: true,
            companyName: true,
            matchScore: true,
            semanticScore: true,
            skillScore: true,
            missingSkills: true,
            createdAt: true,
          },
        }),
        prisma.jobApplication.findMany({
          where: { userId },
          select: { status: true },
        }),
        prisma.userSkill.findMany({
          where: { userId },
          include: { skill: true },
        }),
        prisma.learningRoadmap.findMany({
          where: { userId },
          include: { tasks: true },
          orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        }),
      ]);

    const statusCounts: Record<ApplicationStatus, number> = {
      [ApplicationStatus.APPLIED]: 0,
      [ApplicationStatus.ASSESSMENT]: 0,
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 0,
      [ApplicationStatus.SELECTED]: 0,
      [ApplicationStatus.OFFER_RECEIVED]: 0,
      [ApplicationStatus.REJECTED]: 0,
    };
    for (const app of applications) {
      const s = app.status as ApplicationStatus;
      if (s in statusCounts) statusCounts[s] += 1;
    }

    const totalApps = applications.length;
    const progressedToInterview =
      statusCounts[ApplicationStatus.INTERVIEW_SCHEDULED] +
      statusCounts[ApplicationStatus.SELECTED] +
      statusCounts[ApplicationStatus.OFFER_RECEIVED];
    const offersCount =
      statusCounts[ApplicationStatus.SELECTED] + statusCounts[ApplicationStatus.OFFER_RECEIVED];

    const FUNNEL_LABELS: Record<ApplicationStatus, string> = {
      [ApplicationStatus.APPLIED]: "Applied",
      [ApplicationStatus.ASSESSMENT]: "Assessment",
      [ApplicationStatus.INTERVIEW_SCHEDULED]: "Interviewing",
      [ApplicationStatus.SELECTED]: "Selected",
      [ApplicationStatus.OFFER_RECEIVED]: "Offer Received",
      [ApplicationStatus.REJECTED]: "Rejected",
    };

    const applicationFunnel = (Object.keys(FUNNEL_LABELS) as ApplicationStatus[]).map((st) => ({
      status: st,
      label: FUNNEL_LABELS[st],
      count: statusCounts[st],
    }));

    // Group userSkills by category
    const catAgg = new Map<string, { count: number; totalConf: number }>();
    for (const us of userSkills) {
      const cat = us.skill.category;
      const entry = catAgg.get(cat) ?? { count: 0, totalConf: 0 };
      entry.count += 1;
      entry.totalConf += us.confidenceScore;
      catAgg.set(cat, entry);
    }

    const CAT_LABELS: Record<string, string> = {
      CORE_CS: "Core CS",
      FRONTEND: "Frontend",
      BACKEND: "Backend",
      DATABASE: "Database",
      AI_ML: "AI & ML",
      DEVOPS: "DevOps",
      SOFT_SKILL: "Soft Skills",
    };

    const skillCategoryStats = Array.from(catAgg.entries()).map(([category, v]) => ({
      category,
      label: CAT_LABELS[category] || category,
      count: v.count,
      avgConfidence: Math.round(v.totalConf / v.count),
    }));

    // Aggregate recurring weak topics across completed interviews
    const weakFreq = new Map<string, number>();
    for (const iv of interviews) {
      const summary = iv.feedbackSummary as unknown as InterviewFeedbackSummaryDTO | null;
      for (const topic of summary?.weakTopics ?? []) {
        weakFreq.set(topic, (weakFreq.get(topic) ?? 0) + 1);
      }
    }
    const recurringWeakTopics = Array.from(weakFreq.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Aggregate missing skill hotspots from JobMatch history
    const missingFreq = new Map<string, number>();
    for (const jm of matches) {
      for (const ms of jm.missingSkills) {
        missingFreq.set(ms, (missingFreq.get(ms) ?? 0) + 1);
      }
    }
    const missingSkillHotspots = Array.from(missingFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);

    const activeRm = roadmaps.find((r) => r.isActive) || roadmaps[0] || null;
    const activeTasks = activeRm?.tasks ?? [];

    return {
      overview,
      interviewTrend: interviews.map((iv) => ({
        id: iv.id,
        date: (iv.completedAt ?? iv.createdAt).toLocaleDateString(),
        category: iv.category as InterviewCategory,
        mode: iv.mode as InterviewMode,
        score: Math.round((iv.overallScore ?? 0) * 10) / 10,
      })),
      resumeTrend: resumes.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.createdAt.toLocaleDateString(),
        score: Math.round(r.estimatedScore * 10) / 10,
      })),
      jobMatchTrend: matches.map((m) => ({
        id: m.id,
        role: m.targetRole,
        company: m.companyName,
        date: m.createdAt.toLocaleDateString(),
        matchScore: Math.round(m.matchScore * 10) / 10,
        semanticScore: Math.round(m.semanticScore * 10) / 10,
        skillScore: Math.round(m.skillScore * 10) / 10,
      })),
      applicationFunnel,
      conversionMetrics: {
        totalApps,
        interviewRatePct:
          totalApps > 0 ? Math.round((progressedToInterview / totalApps) * 1000) / 10 : 0,
        offerRatePct: totalApps > 0 ? Math.round((offersCount / totalApps) * 1000) / 10 : 0,
      },
      skillCategoryStats,
      recurringWeakTopics,
      missingSkillHotspots,
      roadmapStats: {
        totalRoadmaps: roadmaps.length,
        activeTitle: activeRm?.title ?? null,
        activeProgressPct: activeRm ? Math.round(activeRm.progressPct * 10) / 10 : null,
        completedTasks: activeTasks.filter((t) => t.status === "COMPLETED").length,
        inProgressTasks: activeTasks.filter((t) => t.status === "IN_PROGRESS").length,
        pendingTasks: activeTasks.filter((t) => t.status === "PENDING").length,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
