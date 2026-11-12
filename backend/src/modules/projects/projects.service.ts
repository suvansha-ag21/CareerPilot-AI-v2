import { GitHubRepoAnalysisDTO } from "@careerpilot/shared";
import { GitHubRepoAnalysis } from "../../../../node_modules/.prisma/client";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { NotFoundError } from "../../utils/errors";

function mapGitHubDto(row: GitHubRepoAnalysis): GitHubRepoAnalysisDTO {
  return {
    id: row.id,
    userId: row.userId,
    repoUrl: row.repoUrl,
    owner: row.owner,
    repoName: row.repoName,
    description: row.description,
    defaultBranch: row.defaultBranch,
    primaryLanguage: row.primaryLanguage,
    stars: row.stars,
    detectedStack: row.detectedStack,
    architectureHighlights: row.architectureHighlights,
    interviewHooks: row.interviewHooks,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ProjectsService {
  async listGitHubAnalyses(userId: string): Promise<GitHubRepoAnalysisDTO[]> {
    const rows = await prisma.gitHubRepoAnalysis.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapGitHubDto);
  }

  async analyzeAndSaveGitHubRepo(
    userId: string,
    repoUrl: string
  ): Promise<GitHubRepoAnalysisDTO> {
    const aiRes = await aiServiceClient.analyzeGitHubRepo({ userId, repoUrl });

    const saved = await prisma.gitHubRepoAnalysis.upsert({
      where: {
        userId_owner_repoName: {
          userId,
          owner: aiRes.owner,
          repoName: aiRes.repoName,
        },
      },
      update: {
        repoUrl: aiRes.repoUrl,
        description: aiRes.description,
        defaultBranch: aiRes.defaultBranch,
        primaryLanguage: aiRes.primaryLanguage,
        stars: aiRes.stars,
        detectedStack: aiRes.detectedStack,
        architectureHighlights: aiRes.architectureHighlights,
        interviewHooks: aiRes.interviewHooks,
        summary: aiRes.summary,
      },
      create: {
        userId,
        repoUrl: aiRes.repoUrl,
        owner: aiRes.owner,
        repoName: aiRes.repoName,
        description: aiRes.description,
        defaultBranch: aiRes.defaultBranch,
        primaryLanguage: aiRes.primaryLanguage,
        stars: aiRes.stars,
        detectedStack: aiRes.detectedStack,
        architectureHighlights: aiRes.architectureHighlights,
        interviewHooks: aiRes.interviewHooks,
        summary: aiRes.summary,
      },
    });

    return mapGitHubDto(saved);
  }

  async deleteGitHubAnalysis(userId: string, id: string): Promise<void> {
    const existing = await prisma.gitHubRepoAnalysis.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError("GitHub project analysis not found");
    }
    await prisma.gitHubRepoAnalysis.delete({ where: { id: existing.id } });
  }
}

export const projectsService = new ProjectsService();
