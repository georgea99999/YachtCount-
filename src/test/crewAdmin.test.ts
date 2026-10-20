import { describe, expect, it } from 'vitest';
import { crewAdminError, rotateCrewPasswords } from '../../supabase/functions/_shared/crewAdmin';

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
  it('resets the same shared password on every vessel account before saving it', async () => {
    const updated: Array<[string,string]>=[];
    let saved=false;
    expect(await rotateCrewPasswords(['admin','deckhand1','deckhand2'], 'old-password', 'new-password', async (id,password)=>{updated.push([id,password]);return true;},async ()=>{saved=true;return true;})).toBe('ok');
    expect(updated).toEqual([['admin','new-password'],['deckhand1','new-password'],['deckhand2','new-password']]);
    expect(saved).toBe(true);
  });
  it('restores previous passwords if any account update fails', async () => {
    const updated: Array<[string,string]>=[];
    let saved=false;
    expect(await rotateCrewPasswords(['admin','deckhand'], 'old-password', 'new-password', async (id,password)=>{updated.push([id,password]);return id!=='deckhand';},async ()=>{saved=true;return true;})).toBe('failed');
    expect(updated).toEqual([['admin','new-password'],['deckhand','new-password'],['admin','old-password']]);
    expect(saved).toBe(false);
  });
  it('restores account passwords if saving the vessel password fails', async () => {
    const updated: string[]=[];
    expect(await rotateCrewPasswords(['admin'], 'old-password', 'new-password', async (_id,password)=>{updated.push(password);return true;},async ()=>false)).toBe('failed');
    expect(updated).toEqual(['new-password','old-password']);
  });
});