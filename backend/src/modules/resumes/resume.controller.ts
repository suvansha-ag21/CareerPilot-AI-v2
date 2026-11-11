import { Request, Response } from "express";
import { AnalyzeResumeOptionsSchema } from "@careerpilot/shared";
import { BadRequestError, UnauthorizedError } from "../../utils/errors";
import { resumeService } from "./resume.service";

export async function uploadResumeController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) {
    throw new BadRequestError("Please attach a PDF or DOCX resume file under field 'file'");
  }

  const title = typeof req.body?.title === "string" ? req.body.title : undefined;
  const resume = await resumeService.uploadResume({
    userId: req.user.id,
    fileBuffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    customTitle: title,
  });

  res.status(201).json({ success: true, data: resume });
}

export async function analyzeResumeController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const options = AnalyzeResumeOptionsSchema.parse(req.body ?? {});
  const resume = await resumeService.analyzeResume(
    req.user.id,
    String(req.params.id),
    options
  );
  res.status(200).json({ success: true, data: resume });
}

export async function listResumesController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const resumes = await resumeService.listResumes(req.user.id);
  res.status(200).json({ success: true, data: resumes });
}

export async function getResumeByIdController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const resume = await resumeService.getResumeById(req.user.id, String(req.params.id));
  res.status(200).json({ success: true, data: resume });
}

export async function getResumeFileController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { buffer, mimeType, filename } = await resumeService.getResumeBinary(
    req.user.id,
    String(req.params.id)
  );
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(200).send(buffer);
}

export async function setPrimaryResumeController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const resume = await resumeService.setPrimaryResume(req.user.id, String(req.params.id));
  res.status(200).json({ success: true, data: resume });
}

export async function syncResumeSkillsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const result = await resumeService.syncDetectedSkillsToProfile(req.user.id, String(req.params.id));
  res.status(200).json({ success: true, data: result });
}

export async function deleteResumeController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await resumeService.deleteResume(req.user.id, String(req.params.id));
  res.status(200).json({ success: true, data: { deleted: true } });
}
