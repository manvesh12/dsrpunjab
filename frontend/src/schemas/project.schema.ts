import { z } from "zod";

export const projectSchema = z.object({
  projectName: z.string().optional(),

  district: z.string().min(1, "District select karo"),

  year: z.string().min(1, "Year enter karo"),

  mineral: z.enum(["Sand", "RBM", "Bajri", "Gravel"]),

  rivers: z.string().optional(),

  preparedBy: z.string().min(1, "Prepared By enter karo"),
});

export type ProjectFormData = z.infer<typeof projectSchema>;