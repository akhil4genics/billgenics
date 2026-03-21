/**
 * API utility for making calls to the Express backend.
 * All backend API calls should use these helpers.
 */

import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/** Get the backend API base URL, optionally appending a path */
export function apiUrl(path?: string): string {
  return path ? `${API_URL}${path}` : API_URL;
}

/** Build Authorization + Content-Type headers for authenticated requests */
export async function authHeaders(accessToken?: string): Promise<HeadersInit> {
  if (!accessToken) {
    const session = await getSession();
    accessToken = (session as unknown as { accessToken?: string })?.accessToken || '';
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

/** Build Authorization header only (for non-JSON requests like FormData) */
export async function authBearerHeader(accessToken?: string): Promise<HeadersInit> {
  if (!accessToken) {
    const session = await getSession();
    accessToken = (session as unknown as { accessToken?: string })?.accessToken || '';
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
