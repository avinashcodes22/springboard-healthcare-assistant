import type { Role } from "../types";

export function roleHome(role: Role | undefined): string {
  if (role === "administrator") return "/admin";
  if (role === "healthcare_worker") return "/worker";
  return "/app";
}

export function roleLabel(role: Role | undefined): string {
  if (role === "administrator") return "Administrator";
  if (role === "healthcare_worker") return "Healthcare worker";
  return "Patient";
}

export function isSafeReturnPath(path: string, role: Role): boolean {
  if (role === "administrator") return path.startsWith("/admin");
  if (role === "healthcare_worker") return path.startsWith("/worker");
  return path.startsWith("/app");
}
