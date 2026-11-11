import { Request, Response } from "express";
import { CreateJobMatchSchema } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { matcherService } from "./matcher.service";

export async function createJobMatchController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();

  const parsed = CreateJobMatchSchema.safeParse({
    resumeId: req.body?.resumeId,
    targetRole: req.body?.targetRole || undefined,
    companyName: req.body?.companyName || undefined,
    experienceLevel: req.body?.experienceLevel || undefined,
    jobType: req.body?.jobType || undefined,
    jobDescription: req.body?.jobDescription || undefined,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  const created = await matcherService.createJobMatch({
    userId: req.user.id,
    input: parsed.data,
    file: req.file
      ? {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
        }
      : undefined,
  });

  res.status(201).json({ success: true, data: created });
}

export async function listJobMatchesController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await matcherService.listJobMatches(req.user.id);
  res.status(200).json({ success: true, data });
}

export async function getJobMatchByIdController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await matcherService.getJobMatchById(req.user.id, String(req.params.id));
  res.status(200).json({ success: true, data });
}

export async function deleteJobMatchController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await matcherService.deleteJobMatch(req.user.id, String(req.params.id));
  res.status(200).json({ success: true, data: { deleted: true } });
}
