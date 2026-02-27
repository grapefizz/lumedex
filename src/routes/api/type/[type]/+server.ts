import { json } from '@sveltejs/kit';
import { api, cacheHeaders } from '$lib/server/pokeapi';

type TypeResp = {
  pokemon: { pokemon: { name: string; url: string } }[];
};

export async function GET({ fetch, params }) {
  const type = params.type.toLowerCase();

  const data = await api<TypeResp>(fetch, `/type/${type}`, {
    ttlMs: 1000 * 60 * 60 * 24 // 24 hours
  });

  const names = data.pokemon.map((p) => p.pokemon.name);

  return json(names, {
    headers: cacheHeaders(60 * 60 * 24) // 24h
  });
}