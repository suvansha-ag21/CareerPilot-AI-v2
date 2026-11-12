import { Request, Response } from "express";
import { GenerateDrillsInput, ReviewFlashcardInput } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { drillsService } from "./drills.service";

export async function listDrillsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await drillsService.listDrills(req.user.id);
  res.json({ success: true, data });
}

export async function generateDrillsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await drillsService.generateDrills(req.user.id, req.body as GenerateDrillsInput);
  res.status(201).json({ success: true, data });
}

export async function reviewDrillController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { rating } = req.body as ReviewFlashcardInput;
  const data = await drillsService.reviewDrill(req.user.id, String(req.params.id), rating);
  res.json({ success: true, data });
}

export async function deleteDrillController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await drillsService.deleteDrill(req.user.id, String(req.params.id));
  res.json({ success: true, data: { deleted: true } });
}
