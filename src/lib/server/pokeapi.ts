import { error } from '@sveltejs/kit';

const BASE = 'https://pokeapi.co/api/v2';

// Simple in-memory cache (per server instance)
type CacheEntry = { at: number; data: unknown };
const cache = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour

export function idFromPokeUrl(url: string, resource: 'pokemon' | 'pokemon-species'): number | null {
  // Example: https://pokeapi.co/api/v2/pokemon/25/
  const re = new RegExp(`/${resource}/(\\d+)/?$`);
  const m = url.match(re);
  return m ? Number(m[1]) : null;
}

export async function api<T>(
  fetchFn: typeof fetch,
  path: string,
  opts?: { ttlMs?: number; cacheKey?: string }
): Promise<T> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const key = opts?.cacheKey ?? path;
  const now = Date.now();

  const hit = cache.get(key);
  if (hit && now - hit.at < ttlMs) return hit.data as T;

  const res = await fetchFn(`${BASE}${path}`, {
    headers: { accept: 'application/json' }
  });

  if (!res.ok) {
    throw error(res.status, `PokeAPI error ${res.status} on ${path}`);
  }

  const data = (await res.json()) as T;
  cache.set(key, { at: now, data });
  return data;
}

/**
 * Small helper to set HTTP caching headers on your own API responses.
 * - "public" allows CDN/edge caching if your host supports it
 * - s-maxage is respected by many CDNs
 */
export function cacheHeaders(seconds: number) {
  return {
    'cache-control': `public, max-age=${seconds}, s-maxage=${seconds}`
  };
}