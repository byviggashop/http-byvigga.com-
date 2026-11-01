export const orderStatusLabels={cancelled:'Annulleret',new:'Ny',awaiting_payment:'Afventer betaling',paid:'Betalt',fulfilled:'Afsluttet'};
export function orderStatus(order){
 if(order.cancelled_at)return 'cancelled';
 if(order.fulfilled_at)return 'fulfilled';
 if(order.paid_at)return 'paid';
 if(order.payment_mail_at)return 'awaiting_payment';
 return 'new';
}
export function filterAdminOrders(orders,{status='all',query=''}={}){
 const search=query.trim().toLocaleLowerCase('da-DK');
 return orders.filter(order=>(status==='all'||(status==='open'?!order.fulfilled_at&&!order.cancelled_at:orderStatus(order)===status))&&`${order.id} ${order.payload?.name||''} ${order.payload?.email||''}`.toLocaleLowerCase('da-DK').includes(search));
}
