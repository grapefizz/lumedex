import { json } from '@sveltejs/kit';
import { api, cacheHeaders, idFromPokeUrl } from '$lib/server/pokeapi';

type PokemonListResp = {
  results: { name: string; url: string }[];
};

export async function GET({ fetch }) {
  // Big limit to get everything in one request
  const data = await api<PokemonListResp>(fetch, `/pokemon?limit=100000&offset=0`, {
    ttlMs: 1000 * 60 * 60 * 12 // 12 hours
  });

  const items = data.results
    .map((r) => {
      const id = idFromPokeUrl(r.url, 'pokemon');
      if (!id) return null;
      return { id, name: r.name };
    })
    .filter((x): x is { id: number; name: string } => x !== null)
    .sort((a, b) => a.id - b.id);

  return json(items, {
    headers: cacheHeaders(60 * 60) // 1 hour CDN/browser cache for your endpoint response
  });
}