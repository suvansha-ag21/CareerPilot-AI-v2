import { Request, Response } from "express";
import { StartInterviewSchema, SubmitInterviewAnswerSchema } from "@careerpilot/shared";
import { BadRequestError, UnauthorizedError } from "../../utils/errors";
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

export async function transcribeAudioController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) {
    throw new BadRequestError("Audio recording file is required");
  }
  const durationSeconds = Number(req.body?.durationSeconds || 0);
  const data = await interviewsService.transcribeAudio({
    userId: req.user.id,
    interviewId: String(req.params.id),
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
    file: {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    },
  });
  res.json({ success: true, data });
}

export async function submitVoiceAnswerController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) {
    throw new BadRequestError("Audio recording file is required");
  }
  const questionId = String(req.body?.questionId || "").trim();
  if (!questionId) {
    throw new BadRequestError("questionId is required");
  }
  const durationSeconds = Number(req.body?.durationSeconds || 0);
  const data = await interviewsService.submitVoiceAnswer({
    userId: req.user.id,
    interviewId: String(req.params.id),
    questionId,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
    file: {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    },
  });
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
