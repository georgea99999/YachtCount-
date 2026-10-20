export function crewEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,40}$/.test(normalized)) throw new Error('Enter your crew username');
  return normalized === 'crew' ? 'crew@yachtcount.app' : `${normalized}@crew.yachtcount.app`;
}
