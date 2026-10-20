// @refresh reset
// Crew-state shape changes must remount consumers instead of reusing old hook queues.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
export function useCrew() {
  const [crew, setCrew] = useState<{username:string; vesselName:string; vesselId:string; owner:boolean} | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<{id:string;username:string;active:boolean;admin:boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) { setCrew(null);setMembers([]);setAccounts([]);setLoading(false); return; }
    const {data:membership} = await supabase.from('vessel_members').select('vessel_id,active').eq('user_id',user.id).maybeSingle();
    if(membership && !membership.active) {await supabase.auth.signOut();setCrew(null);setMembers([]);setAccounts([]);setLoading(false);return;}
    if (!membership) {setCrew(null);setMembers([]);setAccounts([]);setLoading(false);return;}
    const [{data:profile},{data:vessel},{data:role},{data:people},{data:roster}] = await Promise.all([
      supabase.from('profiles').select('username').eq('id',user.id).single(),
      supabase.from('vessels').select('name').eq('id',membership.vessel_id).single(),
      supabase.from('user_roles').select('role').eq('user_id',user.id).maybeSingle(),
      supabase.from('profiles').select('id,username'),
      supabase.from('vessel_members').select('user_id,active').eq('vessel_id',membership.vessel_id),
    ]);
    const {data:admins}=await supabase.from('user_roles').select('user_id').eq('vessel_id',membership.vessel_id).eq('role','owner');
    if(profile && vessel) setCrew({username:profile.username,vesselName:vessel.name,vesselId:membership.vessel_id,owner:role?.role==='owner'});
    const list=(people??[]).map(p=>({id:p.id,username:p.username,active:roster?.find(m=>m.user_id===p.id)?.active === true,admin:(admins??[]).some(a=>a.user_id===p.id)})).sort((a,b)=>a.username.localeCompare(b.username));
    setAccounts(list);setMembers(list.filter(p=>p.active).map(p=>p.username)); setLoading(false);
  };
  useEffect(()=>{void refresh();},[]);
  return {crew,members,accounts,loading,refresh};
}
