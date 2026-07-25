import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const identifierSchema = z.string().uuid();

export const emailSchema = z.string().trim().email().toLowerCase();

export const organizationSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens only.",
  );

export const companyInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: optionalText,
  industry: optionalText,
  phone: optionalText,
  city: optionalText,
  stateProvince: optionalText,
  postalCode: optionalText,
  country: optionalText,
  notes: optionalText,
});

export const contactInputSchema = z.object({
  companyId: identifierSchema.optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema.optional(),
  phone: optionalText,
  title: optionalText,
  department: optionalText,
  notes: optionalText,
});

export const opportunityInputSchema = z.object({
  companyId: identifierSchema,
  contactId: identifierSchema.optional(),
  ownerId: identifierSchema.optional(),
  name: z.string().trim().min(1).max(200),
  amountCents: z.number().int().nonnegative().optional(),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  probability: z.number().int().min(0).max(100).default(10),
  expectedCloseAt: z.coerce.date().optional(),
  description: optionalText,
});

export type CompanyInput = z.infer<typeof companyInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
