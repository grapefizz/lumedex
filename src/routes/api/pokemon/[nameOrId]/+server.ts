import { json } from '@sveltejs/kit';
import { api, cacheHeaders } from '$lib/server/pokeapi';

type PokemonResp = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other?: any;
  };
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string } }[];
};

type SpeciesResp = {
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
  evolution_chain: { url: string };
};

function pickEnglishFlavor(species: SpeciesResp): string | null {
  const entry = species.flavor_text_entries.find((e) => e.language.name === 'en');
  if (!entry) return null;
  return entry.flavor_text.replace(/\s+/g, ' ').trim();
}

function pickEnglishGenus(species: SpeciesResp): string | null {
  const g = species.genera.find((x) => x.language.name === 'en');
  return g?.genus ?? null;
}

export async function GET({ fetch, params }) {
  const nameOrId = params.nameOrId.toLowerCase();

  const pokemon = await api<PokemonResp>(fetch, `/pokemon/${nameOrId}`, {
    ttlMs: 1000 * 60 * 30 // 30 minutes
  });

  const species = await api<SpeciesResp>(fetch, `/pokemon-species/${nameOrId}`, {
    ttlMs: 1000 * 60 * 60 * 6 // 6 hours
  });

  return json(
    {
      pokemon,
      species: {
        flavor: pickEnglishFlavor(species),
        genus: pickEnglishGenus(species),
        evolutionChainUrl: species.evolution_chain.url
      }
    },
    {
      headers: cacheHeaders(60 * 10) // 10 min cache of your combined response
    }
  );
}