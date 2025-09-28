// lib/prismaErrors.ts
import { Prisma } from "@prisma/client";

type Mapped = { status: number; body: Record<string, any> };

export function mapPrismaError(e: unknown): Mapped {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      const target =
        (Array.isArray(e.meta?.target) ? e.meta?.target[0] : e.meta?.target) ?? "unique_field";
      return { status: 409, body: { error: "UNIQUE_CONSTRAINT", field: target } };
    }
    if (e.code === "P2003") {
      return { status: 409, body: { error: "FOREIGN_KEY_CONSTRAINT", details: e.meta } };
    }
    return {
      status: 500,
      body: { error: "PRISMA_KNOWN_ERROR", code: e.code, details: e.meta },
    };
  }

  if (e instanceof Prisma.PrismaClientInitializationError) {
    return { status: 500, body: { error: "PRISMA_INIT_ERROR", details: e.message } };
  }

  if (e instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, body: { error: "PRISMA_VALIDATION_ERROR", details: e.message } };
  }

  return {
    status: 500,
    body: { error: "DB_ERROR", details: String((e as any)?.message || e) },
  };
}
