import { projectTypes, type ProjectType } from "./content";

export type ContactInput = {
  name: string;
  email: string;
  projectType: ProjectType;
  message: string;
};

export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

// Name of the hidden honeypot field. Real visitors never see or fill it.
export const HONEYPOT_FIELD = "website";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Shared by the form (instant feedback) and the API route (the real gate).
export function validateContact(raw: Record<string, unknown>): {
  data?: ContactInput;
  errors: FieldErrors;
} {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(raw.name);
  const email = str(raw.email);
  const projectType = str(raw.projectType);
  const message = str(raw.message);
  const errors: FieldErrors = {};

  if (!name) errors.name = "Name is required.";
  else if (name.length > 100) errors.name = "Keep the name under 100 characters.";

  if (!email) errors.email = "Email is required.";
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  if (!projectTypes.some((t) => t.value === projectType)) errors.projectType = "Pick a project type.";

  if (message.length < 10) errors.message = "Give a little more detail (10+ characters).";
  else if (message.length > 5000) errors.message = "Keep the brief under 5000 characters.";

  if (Object.keys(errors).length) return { errors };
  return {
    data: { name, email, projectType: projectType as ProjectType, message },
    errors,
  };
}
