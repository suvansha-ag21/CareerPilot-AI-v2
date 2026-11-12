import { Request, Response } from "express";
import { AnalyzeGitHubRepoInput } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { projectsService } from "./projects.service";

export async function listGitHubReposController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await projectsService.listGitHubAnalyses(req.user.id);
  res.json({ success: true, data });
}

export async function analyzeGitHubRepoController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { repoUrl } = req.body as AnalyzeGitHubRepoInput;
  const data = await projectsService.analyzeAndSaveGitHubRepo(req.user.id, repoUrl);
  res.status(201).json({ success: true, data });
}

export async function deleteGitHubRepoController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await projectsService.deleteGitHubAnalysis(req.user.id, String(req.params.id));
  res.json({ success: true, data: { deleted: true } });
}
