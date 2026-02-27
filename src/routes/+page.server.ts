export async function load({ fetch }) {
  const res = await fetch('/api/pokemon-index');
  const all = (await res.json()) as { id: number; name: string }[];
  return { all };
}