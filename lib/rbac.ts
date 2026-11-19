import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AppRole = "admin" | "operador" | "motorista" | "cliente" | "dono" | "user";

export async function requireRole(roles: AppRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, status: 401, session: null };
  const role = (session.user as any).role as string | undefined;
  if (!role || !roles.includes(role as AppRole)) {
    return { ok: false as const, status: 403, session };
  }
  return { ok: true as const, status: 200, session };
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, status: 401, session: null };
  return { ok: true as const, status: 200, session };
}

export function isStaff(role?: string) {
  return role === "admin" || role === "operador" || role === "dono";
}
