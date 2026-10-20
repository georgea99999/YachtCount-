import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
export function useCrew() {
  const [crew, setCrew] = useState<{username:string; vesselName:string; vesselId:string; owner:boolean} | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const {data:membership} = await supabase.from('vessel_members').select('vessel_id').eq('user_id',user.id).maybeSingle();
    if (!membership) {setCrew(null);setLoading(false);return;}
    const [{data:profile},{data:vessel},{data:role},{data:people}] = await Promise.all([
      supabase.from('profiles').select('username').eq('id',user.id).single(),
      supabase.from('vessels').select('name').eq('id',membership.vessel_id).single(),
      supabase.from('user_roles').select('role').eq('user_id',user.id).maybeSingle(),
      supabase.from('profiles').select('username'),
    ]);
    if(profile && vessel) setCrew({username:profile.username,vesselName:vessel.name,vesselId:membership.vessel_id,owner:role?.role==='owner'});
    setMembers((people??[]).map(p=>p.username).sort()); setLoading(false);
  };
  useEffect(()=>{void refresh();},[]);
  return {crew,members,loading,refresh};
}
