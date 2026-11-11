import {
  ApplicationStatus,
  CreateJobApplicationInput,
  JobApplicationDTO,
  UpdateJobApplicationInput,
} from "@careerpilot/shared";
import { JobApplication } from "../../../../node_modules/.prisma/client";
import { prisma } from "../../config/prisma";
import { BadRequestError, NotFoundError } from "../../utils/errors";

function mapApplicationToDTO(row: JobApplication): JobApplicationDTO {
  return {
    id: row.id,
    userId: row.userId,
    company: row.company,
    jobRole: row.jobRole,
    jobDescription: row.jobDescription,
    applicationDate: row.applicationDate.toISOString(),
    status: row.status as ApplicationStatus,
    interviewDate: row.interviewDate ? row.interviewDate.toISOString() : null,
    applicationUrl: row.applicationUrl,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseOptionalDate(raw: string | null | undefined, label: string): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw.trim() === "") return null;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) {
    throw new BadRequestError(`Invalid ${label} format`);
  }
  return dt;
}

export class ApplicationsService {
  async listApplications(
    userId: string,
    filters?: { status?: string; search?: string }
  ): Promise<JobApplicationDTO[]> {
    const cleanSearch = filters?.search?.trim();
    const statusFilter =
      filters?.status &&
      Object.values(ApplicationStatus).includes(filters.status as ApplicationStatus)
        ? (filters.status as ApplicationStatus)
        : undefined;

    const rows = await prisma.jobApplication.findMany({
      where: {
        userId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(cleanSearch
          ? {
              OR: [
                { company: { contains: cleanSearch, mode: "insensitive" } },
                { jobRole: { contains: cleanSearch, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { applicationDate: "desc" }],
    });

    return rows.map(mapApplicationToDTO);
  }

  async getApplicationById(userId: string, id: string): Promise<JobApplicationDTO> {
    const row = await prisma.jobApplication.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new NotFoundError("Job application record not found");
    }
    return mapApplicationToDTO(row);
  }

  async createApplication(
    userId: string,
    input: CreateJobApplicationInput
  ): Promise<JobApplicationDTO> {
    const appDate = parseOptionalDate(input.applicationDate, "applicationDate") ?? new Date();
    const intDate = parseOptionalDate(input.interviewDate, "interviewDate") ?? null;

    const created = await prisma.jobApplication.create({
      data: {
        userId,
        company: input.company,
        jobRole: input.jobRole,
        jobDescription: input.jobDescription || null,
        applicationDate: appDate,
        status: input.status,
        interviewDate: intDate,
        applicationUrl: input.applicationUrl || null,
        notes: input.notes || null,
      },
    });

    return mapApplicationToDTO(created);
  }

  async updateApplication(
    userId: string,
    id: string,
    input: UpdateJobApplicationInput
  ): Promise<JobApplicationDTO> {
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError("Job application record not found");
    }

    const appDate = parseOptionalDate(input.applicationDate, "applicationDate");
    const intDate = parseOptionalDate(input.interviewDate, "interviewDate");

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        ...(input.company !== undefined ? { company: input.company } : {}),
        ...(input.jobRole !== undefined ? { jobRole: input.jobRole } : {}),
        ...(input.jobDescription !== undefined
          ? { jobDescription: input.jobDescription }
          : {}),
        ...(appDate instanceof Date ? { applicationDate: appDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(intDate !== undefined ? { interviewDate: intDate } : {}),
        ...(input.applicationUrl !== undefined
          ? { applicationUrl: input.applicationUrl || null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    return mapApplicationToDTO(updated);
  }

  async deleteApplication(userId: string, id: string): Promise<{ deleted: boolean }> {
    const res = await prisma.jobApplication.deleteMany({
      where: { id, userId },
    });
    if (res.count === 0) {
      throw new NotFoundError("Job application record not found");
    }
    return { deleted: true };
  }
}

export const applicationsService = new ApplicationsService();
