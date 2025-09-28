import { z } from "zod";

// Valida e converte string -> number; checa finitude e faixa permitida
const latSchema = z
  .coerce.number({ invalid_type_error: "lat deve ser numérico" })
  .refine((v) => Number.isFinite(v), { message: "lat inválida" })
  .refine((v) => v >= -90 && v <= 90, { message: "lat fora do intervalo (-90 a 90)" });

const lonSchema = z
  .coerce.number({ invalid_type_error: "lon deve ser numérico" })
  .refine((v) => Number.isFinite(v), { message: "lon inválida" })
  .refine((v) => v >= -180 && v <= 180, { message: "lon fora do intervalo (-180 a 180)" });

export const antennaCreateSchema = z.object({
  name: z.string().min(2).max(80),
  lat: latSchema,
  lon: lonSchema,
  description: z.string().max(500).optional()
});

export const antennaUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  lat: latSchema.optional(),
  lon: lonSchema.optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["UP", "DOWN"]).optional()
});
