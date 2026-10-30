// Editing price or photos must not make an existing design appear newly created.
export function latestDesigns(products,limit=8){
 const created=p=>Date.parse(Object.hasOwn(p,'oprettet')?p.oprettet:p.dato)||0;
 return products.filter(p=>p.aktiv===true&&!p.slettet)
  .slice().sort((a,b)=>created(b)-created(a)||a.id.localeCompare(b.id)).slice(0,limit);
}
