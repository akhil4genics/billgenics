/**
 * API utility for making calls to the Express backend.
 * All backend API calls should use these helpers.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/** Build a full backend API URL from a path (e.g. '/api/albums') */
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

/** Build Authorization + Content-Type headers for authenticated requests */
export function authHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

/** Build Authorization header only (for non-JSON requests like FormData) */
export function authBearerHeader(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
