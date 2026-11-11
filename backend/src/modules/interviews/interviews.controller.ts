import { Request, Response } from "express";
import { StartInterviewSchema, SubmitInterviewAnswerSchema } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { interviewsService } from "./interviews.service";

export async function listInterviewsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await interviewsService.listInterviews(req.user.id);
  res.json({ success: true, data });
}

export async function getInterviewByIdController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await interviewsService.getInterviewById(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}

export async function startInterviewController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = StartInterviewSchema.parse(req.body);
  const data = await interviewsService.startInterview(req.user.id, parsed);
  res.status(201).json({ success: true, data });
}

export async function submitInterviewAnswerController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = SubmitInterviewAnswerSchema.parse(req.body);
  const data = await interviewsService.submitAnswer(
    req.user.id,
    String(req.params.id),
    parsed
  );
  res.json({ success: true, data });
}

export async function completeInterviewController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await interviewsService.completeInterview(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}

export async function deleteInterviewController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await interviewsService.deleteInterview(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}
