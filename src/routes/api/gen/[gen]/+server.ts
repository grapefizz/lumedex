import { json } from '@sveltejs/kit';
import { api, cacheHeaders } from '$lib/server/pokeapi';

type GenerationResp = {
  pokemon_species: { name: string; url: string }[];
};

export async function GET({ fetch, params }) {
  // PokeAPI generations are numeric: 1..9 (currently)
  const gen = params.gen;

  const data = await api<GenerationResp>(fetch, `/generation/${gen}`, {
    ttlMs: 1000 * 60 * 60 * 24 // 24 hours
  });

  // Note: generation returns species names, which match pokemon names for most cases.
  // (A few edge cases exist, but this works well for filters.)
  const names = data.pokemon_species.map((s) => s.name);

  return json(names, {
    headers: cacheHeaders(60 * 60 * 24) // 24h
  });
}