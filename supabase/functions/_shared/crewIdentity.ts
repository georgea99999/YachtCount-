export function normalizeCrewName(value: string): string {
  const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 100 || !/^[\p{L}\p{M}\p{N} ._’'\-]+$/u.test(name)) {
    throw new Error('Enter a name of 3–100 characters');
  }
  return name;
}

export async function crewEmail(value: string): Promise<string> {
  const normalized = normalizeCrewName(value).toLowerCase();
  // Keep existing crew-code accounts accessible without renaming them.
  if (normalized === 'crew') return 'crew@yachtcount.app';
  if (/^[a-z0-9_-]{3,40}$/.test(normalized)) return `${normalized}@crew.yachtcount.app`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const identifier = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 56);
  return `name-${identifier}@crew.yachtcount.app`;
}