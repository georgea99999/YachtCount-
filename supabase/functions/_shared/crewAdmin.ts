export type CrewAccount = { user_id: string; vessel_id: string; active: boolean };

export function crewAdminError(actor: CrewAccount | null, owner: boolean, target?: CrewAccount | null, deactivate = false): string | null {
  if (!actor?.active || !owner) return 'Only the vessel admin can manage crew';
  if (target !== undefined && (!target || target.vessel_id !== actor.vessel_id)) return 'Crew member unavailable';
  if (deactivate && target?.user_id === actor.user_id) return 'You cannot deactivate your own admin account';
  return null;
}