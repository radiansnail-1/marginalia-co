import { z } from "zod";

export const StatusEnum = z.enum(["pile", "reading", "finished", "abandoned"]);

export const RatingSchema = z.coerce
  .number()
  .min(0.5)
  .max(5)
  .refine((n) => Number.isInteger(n * 2), "Rating must be in 0.5 increments.");

export const BookInputSchema = z.object({
  googleBooksId: z.string().optional(),
  isbn13: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  description: z.string().max(4000).optional(),
  subjects: z.array(z.string()).max(20).optional(),
  status: StatusEnum.optional(),
  rating: RatingSchema.nullable().optional(),
  review: z.string().max(4000).nullable().optional(),
  pageCount: z.number().int().positive().optional(),
  publishedYear: z.number().int().optional(),
  coverUrl: z.string().url().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

export type BookInput = z.infer<typeof BookInputSchema>;
