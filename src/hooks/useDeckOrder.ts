import { useState, useEffect } from 'react';
import { DeckOrderItem } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export function useDeckOrder() {
  const [orderItems,setOrderItems]=useState<DeckOrderItem[]>([]);
  const load=async()=>{
    const {data,error}=await supabase.from('deck_orders').select('*').order('id');
    if(error) {toast.error('Unable to load Deck Order');return;}
    setOrderItems(data.map(i=>({id:i.id,productName:i.product_name,quantity:i.quantity,colour:i.colour,size:i.size,link:i.link})));
  };
  useEffect(()=>{void load();const c=supabase.channel('crew-orders').on('postgres_changes',{event:'*',schema:'public',table:'deck_orders'},()=>{void load();}).subscribe();return()=>{void supabase.removeChannel(c);};},[]);
  const save=async(req:PromiseLike<{error:unknown}>)=>{const {error}=await req;if(error){toast.error('Order not saved');return;}await load();};
  const addOrderItem=(i:Omit<DeckOrderItem,'id'>)=>save(supabase.from('deck_orders').insert({product_name:i.productName,quantity:i.quantity,colour:i.colour,size:i.size,link:i.link}));
  const updateOrderItem=(id:number,i:Partial<Omit<DeckOrderItem,'id'>>)=>save(supabase.from('deck_orders').update({product_name:i.productName,quantity:i.quantity,colour:i.colour,size:i.size,link:i.link}).eq('id',id));
  const deleteOrderItem=(id:number)=>save(supabase.from('deck_orders').delete().eq('id',id));
  const clearOrderItems=()=>save(supabase.from('deck_orders').delete().gt('id',0));
  return {orderItems,addOrderItem,updateOrderItem,deleteOrderItem,clearOrderItems};
}
