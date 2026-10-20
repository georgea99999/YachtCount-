import { useState, useEffect } from 'react';
import { Task } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const load = async () => {
    const {data,error} = await supabase.from('tasks').select('*').order('created_at',{ascending:false});
    if(error) {toast.error('Unable to load To Do');return;}
    setTasks(data.map(t=>({id:t.id,text:t.text,completed:t.completed,starred:t.starred,notes:t.notes??undefined,assignees:t.assignees,completedAt:t.completed_at??undefined,createdBy:t.created_by_username??undefined,completedBy:t.completed_by_username??undefined})));
  };
  useEffect(()=>{
    void load();
    const channel=supabase.channel('crew-tasks').on('postgres_changes',{event:'*',schema:'public',table:'tasks'},()=>{void load();}).subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[]);
  const save = async (request: PromiseLike<{error:unknown}>) => {
    const {error}=await request;
    if(error) {toast.error('Task not saved. Please try again.');return false;}
    await load();return true;
  };
  const addTask=(text:string,opts?:{notes?:string;starred?:boolean;assignees?:string[]})=>save(supabase.from('tasks').insert({text:text.trim(),notes:opts?.notes?.trim(),starred:opts?.starred,assignees:opts?.assignees}));
  const updateTaskFields=(id:number,patch:Partial<Task>)=>save(supabase.from('tasks').update({text:patch.text?.trim(),notes:patch.notes?.trim(),starred:patch.starred,assignees:patch.assignees,completed:patch.completed}).eq('id',id));
  const toggleTask=(id:number)=>{const t=tasks.find(t=>t.id===id);if(t) return updateTaskFields(id,{completed:!t.completed});};
  const toggleStar=(id:number)=>{const t=tasks.find(t=>t.id===id);if(t) return updateTaskFields(id,{starred:!t.starred});};
  const deleteTask=(id:number)=>save(supabase.from('tasks').delete().eq('id',id));
  return {tasks,addTask,toggleTask,toggleStar,updateTaskFields,deleteTask};
}
