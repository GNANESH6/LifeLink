/**
 * Central API configuration for LifeLink frontend.
 *
 * In production (Vercel), requests go directly to the Render backend.
 * In development (Vite dev server), the local proxy rewrites /api → backend,
 * so we keep the relative path to avoid CORS issues during local development.
 */

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL ?? "https://lifelink-9d9s.onrender.com";

/**
 * Convenience helper — prepends API_BASE to a path.
 * Usage: apiUrl("/auth/login")  →  "https://lifelink-9d9s.onrender.com/api/auth/login"
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /api
  const normalised = path.startsWith("/api") ? path : `/api${path}`;
  return `${API_BASE}${normalised}`;
}
