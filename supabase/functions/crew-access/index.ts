import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { crewEmail, normalizeCrewName } from '../_shared/crewIdentity.ts';
import { crewAdminError, rotateCrewPasswords } from '../_shared/crewAdmin.ts';
const name = z.string().max(100).transform((value, context) => {
  try { return normalizeCrewName(value); } catch { context.addIssue({code:z.ZodIssueCode.custom,message:'Enter a valid full name'}); return z.NEVER; }
});
const passwordSchema = z.string().min(8).max(100);
const input = z.discriminatedUnion('action', [
  z.object({action:z.literal('setup'),username:name,password:passwordSchema,vesselName:z.string().trim().min(1).max(100)}),
  z.object({action:z.literal('provision'),username:name,password:passwordSchema,vesselName:z.string().trim().min(1).max(100)}),
  z.object({action:z.literal('add'),username:name,password:passwordSchema}),
  z.object({action:z.literal('rename'),userId:z.string().uuid(),username:name}),
  z.object({action:z.literal('deactivate'),userId:z.string().uuid()}),
  z.object({action:z.literal('remove'),userId:z.string().uuid()}),
  z.object({action:z.literal('set-admin'),userId:z.string().uuid(),role:z.enum(['owner','junior']).nullable()}),
  z.object({action:z.literal('reset-password'),password:passwordSchema,newPassword:passwordSchema}),
]);
Deno.serve(async req => {
  const respond = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json'}});
  if(req.method==='OPTIONS') return respond({});
  if(req.method!=='POST') return respond({error:'Method not allowed'},405);
  try {
    const parsed=input.safeParse(await req.json());
    if(!parsed.success) return respond({error:parsed.error.issues[0]?.message || 'Invalid crew details'},400);
    const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url || !key) return respond({error:'Crew service unavailable'},503);
    const admin=createClient(url,key,{auth:{persistSession:false}});
    const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
    if(!token) return respond({error:'Please sign in first'},401);
    const {data:{user},error:authError}=await admin.auth.getUser(token);
    if(authError || !user) return respond({error:'Please sign in again'},401);
    const request=parsed.data;
    if(request.action==='provision') {
      // Only YachtCount platform owners may create new vessels; public sign-up stays closed.
      const {data:platform}=await admin.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle();
      if(!platform) return respond({error:'Only the YachtCount platform owner can create vessels'},403);
      const {data:created,error:createError}=await admin.auth.admin.createUser({email:await crewEmail(request.username),password:request.password,email_confirm:true});
      if(createError || !created.user) return respond({error:'That admin name is already in use. Try adding a middle initial.'},400);
      const {error:setupError}=await admin.rpc('setup_vessel',{owner_id:created.user.id,vessel_name:request.vesselName,crew_username:request.username,vessel_password:request.password});
      if(setupError) { await admin.auth.admin.deleteUser(created.user.id); return respond({error:'Unable to create vessel'},500); }
      return respond({ok:true});
    }
    const {data:membership,error:membershipError}=await admin.from('vessel_members').select('user_id,vessel_id,active').eq('user_id',user.id).maybeSingle();
    if(membershipError) return respond({error:'Unable to check vessel access'},503);
    if(request.action==='setup') {
      const {username,password,vesselName}=request;
      const email=await crewEmail(username);
      if(membership) return respond({error:'Vessel already configured'},400);
      // Only an existing signed-in account may initialize a vessel and claim its own legacy inventory.
      const {error:setupError}=await admin.rpc('setup_vessel',{owner_id:user.id,vessel_name:vesselName,crew_username:username,vessel_password:password});
      if(setupError) return respond({error:'Unable to set up vessel. Choose a different username.'},400);
      const {error:updateError}=await admin.auth.admin.updateUserById(user.id,{email,password,email_confirm:true});
      if(updateError) return respond({error:'Vessel created, but login update failed. Contact support before signing out.'},500);
      return respond({ok:true});
    }
    if(!membership) return respond({error:'Set up your vessel first'},400);
    const {data:role}=await admin.from('user_roles').select('role').eq('user_id',user.id).eq('vessel_id',membership.vessel_id).eq('role','owner').maybeSingle();
    const permissionError=crewAdminError(membership,Boolean(role));
    if(permissionError) return respond({error:permissionError},403);
    if(request.action==='set-admin' || request.action==='remove') {
      const {data:target}=await admin.from('vessel_members').select('user_id,vessel_id,active').eq('user_id',request.userId).maybeSingle();
      const targetError=crewAdminError(membership,true,target,true);
      if(targetError) return respond({error:targetError.replace('deactivate your own admin account','change your own account here')},403);
      if(request.action==='set-admin') {
        if(!target!.active) return respond({error:'Only active crew can be made admin'},400);
        const {error}=request.role
          ? await admin.from('user_roles').upsert({user_id:request.userId,vessel_id:membership.vessel_id,role:request.role},{onConflict:'user_id,vessel_id'})
          : await admin.from('user_roles').delete().eq('user_id',request.userId).eq('vessel_id',membership.vessel_id);
        if(error) return respond({error:'Unable to update admin access'},500);
        return respond({ok:true});
      }
      if(target!.active) return respond({error:'Deactivate this crew member before removing them'},400);
      // Activity keeps the recorded name text; ownership links are cleared so the account can be deleted.
      for(const table of ['stock_items','custom_boxes','usage_history']) {
        const {error}=await admin.from(table).update({user_id:null}).eq('user_id',request.userId);
        if(error) return respond({error:'Unable to remove crew member'},500);
      }
      await admin.from('user_roles').delete().eq('user_id',request.userId);
      await admin.from('vessel_members').delete().eq('user_id',request.userId).eq('vessel_id',membership.vessel_id);
      await admin.from('profiles').delete().eq('id',request.userId);
      const {error:deleteError}=await admin.auth.admin.deleteUser(request.userId);
      if(deleteError) return respond({error:'Crew member removed from vessel, but account cleanup failed'},500);
      return respond({ok:true});
    }
    if(request.action==='rename' || request.action==='deactivate') {
      const {data:target}=await admin.from('vessel_members').select('user_id,vessel_id,active').eq('user_id',request.userId).maybeSingle();
      const targetError=crewAdminError(membership,true,target,request.action==='deactivate');
      if(targetError) return respond({error:targetError},403);
      if(request.action==='deactivate') {
        // Membership revocation blocks even existing access tokens through RLS.
        const {error}=await admin.from('vessel_members').update({active:false}).eq('user_id',request.userId).eq('vessel_id',membership.vessel_id);
        if(error) return respond({error:'Unable to deactivate crew member'},500);
        const {error:banError}=await admin.auth.admin.updateUserById(request.userId,{ban_duration:'876000h'});
        if(banError) return respond({error:'Vessel access removed, but login blocking failed. Retry deactivation.'},500);
        return respond({ok:true});
      }
      const {data:previous,error:profileError}=await admin.from('profiles').select('username').eq('id',request.userId).single();
      const {data:account,error:accountError}=await admin.auth.admin.getUserById(request.userId);
      if(profileError || accountError || !previous || !account.user?.email) return respond({error:'Crew member unavailable'},400);
      const previousEmail=account.user.email;
      const {error:renameError}=await admin.auth.admin.updateUserById(request.userId,{email:await crewEmail(request.username),email_confirm:true});
      if(renameError) return respond({error:'Name unavailable. Choose a different full name.'},400);
      const {error:saveError}=await admin.from('profiles').update({username:request.username}).eq('id',request.userId);
      if(saveError) {
        const {error:rollbackError}=await admin.auth.admin.updateUserById(request.userId,{email:previousEmail,email_confirm:true});
        return respond({error:rollbackError?'Name update incomplete. Contact support before signing out.':'Name unavailable. Choose a different full name.'},500);
      }
      // Historical stock and task authors are intentionally kept unchanged.
      return respond({ok:true});
    }
    const {password}=request;
    const {data:valid}=await admin.rpc('verify_vessel_password',{vid:membership.vessel_id,candidate:password});
    if(!valid) return respond({error:'Incorrect vessel password'},403);
    if(request.action==='reset-password') {
      const {data:accounts,error:listError}=await admin.from('vessel_members').select('user_id').eq('vessel_id',membership.vessel_id);
      if(listError || !accounts?.length) return respond({error:'Unable to load vessel accounts'},500);
      const result=await rotateCrewPasswords(accounts.map(account=>account.user_id),password,request.newPassword,
        async (id,value)=>{const {error}=await admin.auth.admin.updateUserById(id,{password:value});return !error;},
        async ()=>{const {error}=await admin.rpc('reset_vessel_password',{vid:membership.vessel_id,new_password:request.newPassword});return !error;});
      if(result!=='ok') return respond({error:result==='incomplete'?'Password reset incomplete. Contact support before signing out.':'Password was not changed. Please try again.'},500);
      return respond({ok:true});
    }
    const {username}=request;
    const email=await crewEmail(username);
    const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true});
    if(createError || !created.user) return respond({error:'Username unavailable. Choose a different username.'},400);
    const id=created.user.id;
    const {error:p}=await admin.from('profiles').insert({id,username});
    const {error:m}=p ? {error:p} : await admin.from('vessel_members').insert({user_id:id,vessel_id:membership.vessel_id});
    if(p || m) { await admin.auth.admin.deleteUser(id); return respond({error:'Unable to add crew member'},500); }
    return respond({ok:true});
  } catch { return respond({error:'Unable to process crew request'},500); }
});
