import { Request, Response } from "express";
import { AnalyzeSkillGapInput, UpsertUserSkillInput } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { skillsService } from "./skills.service";

export async function getSkillInventoryController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await skillsService.getSkillInventory(req.user.id);
  res.json({ success: true, data });
}

export async function upsertUserSkillController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await skillsService.upsertUserSkill(
    req.user.id,
    req.body as UpsertUserSkillInput
  );
  res.json({ success: true, data });
}

export async function removeUserSkillController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await skillsService.removeUserSkill(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}

export async function analyzeSkillGapController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await skillsService.analyzeSkillGap(
    req.user.id,
    req.body as AnalyzeSkillGapInput
  );
  res.json({ success: true, data });
}
