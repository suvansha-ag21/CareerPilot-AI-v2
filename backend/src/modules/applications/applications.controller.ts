import { Request, Response } from "express";
import { CreateJobApplicationInput, UpdateJobApplicationInput } from "@careerpilot/shared";
import { UnauthorizedError } from "../../utils/errors";
import { applicationsService } from "./applications.service";

export async function listApplicationsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await applicationsService.listApplications(req.user.id, {
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    jobType: typeof req.query.jobType === "string" ? req.query.jobType : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  res.json({ success: true, data });
}

export async function getApplicationByIdController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await applicationsService.getApplicationById(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}

export async function createApplicationController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await applicationsService.createApplication(
    req.user.id,
    req.body as CreateJobApplicationInput
  );
  res.status(201).json({ success: true, data });
}

export async function updateApplicationController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await applicationsService.updateApplication(
    req.user.id,
    String(req.params.id),
    req.body as UpdateJobApplicationInput
  );
  res.json({ success: true, data });
}

export async function deleteApplicationController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await applicationsService.deleteApplication(req.user.id, String(req.params.id));
  res.json({ success: true, data });
}
