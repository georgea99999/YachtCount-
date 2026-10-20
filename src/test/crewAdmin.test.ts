import { describe, expect, it } from 'vitest';
import { crewAdminError } from '../../supabase/functions/_shared/crewAdmin';

const admin = { user_id: 'admin', vessel_id: 'unicorn', active: true };
const deckhand = { user_id: 'deckhand', vessel_id: 'unicorn', active: true };
describe('vessel admin controls', () => {
  it('allows an admin to rename or deactivate crew on their vessel', () => {
    expect(crewAdminError(admin, true, deckhand)).toBeNull();
    expect(crewAdminError(admin, true, deckhand, true)).toBeNull();
  });
  it('denies crew members access to account changes and password resets', () => {
    expect(crewAdminError(deckhand, false, admin)).toBe('Only the vessel admin can manage crew');
    expect(crewAdminError(deckhand, false)).toBe('Only the vessel admin can manage crew');
  });
  it('denies changes to another vessel’s crew', () => {
    expect(crewAdminError(admin, true, { ...deckhand, vessel_id: 'other' })).toBe('Crew member unavailable');
  });
  it('prevents the admin from deactivating themselves', () => {
    expect(crewAdminError(admin, true, admin, true)).toBe('You cannot deactivate your own admin account');
  });
  it('denies inactive admins all crew controls', () => {
    expect(crewAdminError({ ...admin, active: false }, true)).toBe('Only the vessel admin can manage crew');
  });
});