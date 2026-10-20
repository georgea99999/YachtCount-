export type CrewAccount = { user_id: string; vessel_id: string; active: boolean };

export function crewAdminError(actor: CrewAccount | null, owner: boolean, target?: CrewAccount | null, deactivate = false): string | null {
  if (!actor?.active || !owner) return 'Only the vessel admin can manage crew';
  if (target !== undefined && (!target || target.vessel_id !== actor.vessel_id)) return 'Crew member unavailable';
  if (deactivate && target?.user_id === actor.user_id) return 'You cannot deactivate your own admin account';
  return null;
}

export async function rotateCrewPasswords(ids: string[], oldPassword: string, newPassword: string,
  update: (id: string, password: string) => Promise<boolean>, save: () => Promise<boolean>): Promise<'ok' | 'failed' | 'incomplete'> {
  const changed: string[] = [];
  const rollback = async () => {
    const results = await Promise.all(changed.map(id => update(id, oldPassword)));
    return results.every(Boolean) ? 'failed' as const : 'incomplete' as const;
  };
  for (const id of ids) {
    if (!await update(id, newPassword)) return rollback();
    changed.push(id);
  }
  if (!await save()) return rollback();
  return 'ok';
}