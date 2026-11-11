import { Request, Response } from "express";
import { GenerateRoadmapInput, UpdateRoadmapTaskInput } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { roadmapService } from "./roadmap.service";

export async function listRoadmapsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await roadmapService.listRoadmaps(req.user.id);
  res.json({ success: true, data });
}

export async function getRoadmapByIdController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await roadmapService.getRoadmapById(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}

export async function generateRoadmapController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await roadmapService.generateRoadmap(
    req.user.id,
    req.body as GenerateRoadmapInput
  );
  res.status(201).json({ success: true, data });
}

export async function updateRoadmapTaskController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await roadmapService.updateTask(
    req.user.id,
    String(req.params.id),
    String(req.params.taskId),
    req.body as UpdateRoadmapTaskInput
  );
  res.json({ success: true, data });
}

export async function activateRoadmapController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await roadmapService.activateRoadmap(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}

export async function deleteRoadmapController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await roadmapService.deleteRoadmap(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}
