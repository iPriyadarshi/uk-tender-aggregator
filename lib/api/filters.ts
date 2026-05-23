import { z } from "zod";

export const opportunityFiltersSchema = z.object({
  q: z.string().optional(),
  nation: z
    .enum(["england", "scotland", "wales", "northern_ireland", "uk"])
    .optional(),
  status: z
    .enum(["planning", "active", "award", "complete", "cancelled", "unknown"])
    .optional(),
  buyerType: z.string().optional(),
  industry: z.string().optional(),
  valueMin: z.coerce.number().optional(),
  valueMax: z.coerce.number().optional(),
  deadlineFrom: z.string().optional(),
  deadlineTo: z.string().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
  sort: z.enum(["published", "deadline", "value"]).default("published"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type OpportunityFilters = z.infer<typeof opportunityFiltersSchema>;
