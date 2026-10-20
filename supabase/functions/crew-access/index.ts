import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { crewEmail, normalizeCrewName } from '../_shared/crewIdentity.ts';
const input = z.object({ action: z.enum(['setup','add']), username: z.string().max(100).transform((value, context) => {
  try { return normalizeCrewName(value); } catch { context.addIssue({code:z.ZodIssueCode.custom,message:'Enter a valid full name'}); return z.NEVER; }
}), password: z.string().min(8).max(100), vesselName: z.string().trim().min(1).max(100).optional() });
Deno.serve(async req => {
  const respond = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json'}});
  if(req.method==='OPTIONS') return respond({});
  try {
    const parsed=input.safeParse(await req.json());
    if(!parsed.success) return respond({error:'Enter a full name of 3–100 characters and a vessel password of at least 8 characters.'},400);
    const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url || !key) return respond({error:'Crew service unavailable'},503);
    const admin=createClient(url,key,{auth:{persistSession:false}});
    const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
    if(!token) return respond({error:'Please sign in first'},401);
    const {data:{user},error:authError}=await admin.auth.getUser(token);
    if(authError || !user) return respond({error:'Please sign in again'},401);
    const {action,password,vesselName,username}=parsed.data;
    const email = await crewEmail(username);
    const {data:membership}=await admin.from('vessel_members').select('vessel_id').eq('user_id',user.id).maybeSingle();
    if(action==='setup') {
      if(membership || !vesselName) return respond({error:'Vessel already configured or name missing'},400);
      // Only an existing signed-in account may initialize a vessel and claim its own legacy inventory.
      const {error:setupError}=await admin.rpc('setup_vessel',{owner_id:user.id,vessel_name:vesselName,crew_username:username,vessel_password:password});
      if(setupError) return respond({error:'Unable to set up vessel. Choose a different username.'},400);
      const {error:updateError}=await admin.auth.admin.updateUserById(user.id,{email,password,email_confirm:true});
      if(updateError) return respond({error:'Vessel created, but login update failed. Contact support before signing out.'},500);
      return respond({ok:true});
    }
    if(!membership) return respond({error:'Set up your vessel first'},400);
    const {data:role}=await admin.from('user_roles').select('role').eq('user_id',user.id).eq('vessel_id',membership.vessel_id).eq('role','owner').maybeSingle();
    if(!role) return respond({error:'Only the vessel admin can add crew'},403);
    const {data:valid}=await admin.rpc('verify_vessel_password',{vid:membership.vessel_id,candidate:password});
    if(!valid) return respond({error:'Incorrect vessel password'},403);
    const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true});
    if(createError || !created.user) return respond({error:'Username unavailable. Choose a different username.'},400);
    const id=created.user.id;
    const {error:p}=await admin.from('profiles').insert({id,username});
    const {error:m}=p ? {error:p} : await admin.from('vessel_members').insert({user_id:id,vessel_id:membership.vessel_id});
    if(p || m) { await admin.auth.admin.deleteUser(id); return respond({error:'Unable to add crew member'},500); }
    return respond({ok:true});
  } catch { return respond({error:'Unable to process crew request'},500); }
});
