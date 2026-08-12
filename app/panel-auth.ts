import { cookies, headers } from "next/headers";
import { ensureControlTables } from "../db/control-store";

export const PANEL_COOKIE = "sabka_panel_session";
const ONLY_SUPER_ADMIN_USERNAME = "dhoni1981";
export type PanelRole = "SUPER_ADMIN" | "RESTAURANT" | "RIDER" | "STAFF";
export type PanelType =
  | "SUPER_ADMIN"
  | "RESTAURANT"
  | "GROCERY"
  | "ELECTRONICS"
  | "DELIVERY"
  | "STAFF";
export type PanelSession = {
  username: string;
  role: PanelRole;
  panelType: PanelType;
  displayName: string;
  storeId: number | null;
  riderId: number | null;
  permissions: string[];
};

export const panelCookie = (role: PanelRole) =>
  role === "SUPER_ADMIN"
    ? "sabka_admin_session"
    : role === "RIDER"
      ? "sabka_rider_session"
      : role === "RESTAURANT"
        ? "sabka_partner_session"
        : "sabka_staff_session";

export async function sha256(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const passwordHash = (password: string) =>
  sha256(`sabka-delivery-v2:${password}`);

export async function getPanelSession(
  expectedRole?: PanelRole,
): Promise<PanelSession | null> {
  const jar = await cookies();
  const tokens = Array.from(
    new Set(
      (expectedRole
        ? [
            jar.get(panelCookie(expectedRole))?.value,
            jar.get(PANEL_COOKIE)?.value,
          ]
        : [
            ...(["SUPER_ADMIN", "RESTAURANT", "RIDER", "STAFF"] as PanelRole[]).map(
              (role) => jar.get(panelCookie(role))?.value,
            ),
            jar.get(PANEL_COOKIE)?.value,
          ]
      ).filter((token): token is string => !!token),
    ),
  );
  if (!tokens.length) return null;
  const db = await ensureControlTables();
  for (const token of tokens) {
    const row = await db
      .prepare(
        `SELECT a.username,a.role,a.panel_type panelType,a.display_name displayName,
                a.store_id storeId,a.rider_id riderId,a.permissions
         FROM market_panel_sessions s
         JOIN market_panel_accounts a ON a.username=s.username
         WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND a.is_active=1`,
      )
      .bind(await sha256(token))
      .first<Omit<PanelSession, "permissions"> & { permissions: string }>();
    if (
      row &&
      (!expectedRole || row.role === expectedRole) &&
      (row.role !== "SUPER_ADMIN" || row.username === ONLY_SUPER_ADMIN_USERNAME)
    )
      return {
        ...row,
        permissions: JSON.parse(row.permissions || "[]") as string[],
      };
  }
  return null;
}

export async function requestMeta() {
  const values = await headers();
  return {
    ip: values.get("cf-connecting-ip") || "",
    agent: (values.get("user-agent") || "").slice(0, 300),
  };
}

export function panelRoute(session: Pick<PanelSession, "role" | "panelType">) {
  if (session.role === "SUPER_ADMIN") return "/super-admin";
  if (session.role === "RIDER" || session.panelType === "DELIVERY")
    return "/rider-panel";
  if (session.panelType === "ELECTRONICS") return "/electronics-panel";
  if (session.panelType === "GROCERY") return "/grocery-panel";
  return "/restaurant-panel";
}
