export function stockInfo(p,qty=1){
 const type=p.produkttype||(p.antal==null?'made_to_order':'unique');
 const available=Math.max(0,Number(p.tilgaengeligt??p.antal??0)-(p.tilgaengeligt==null?Number(p.reserveret||0):0));
 const made=type==='made_to_order'&&qty>available;
 const soldout=type==='unique'&&qty>available;
 return {type,available,made,soldout,label:soldout?'Udsolgt':made?'Laves på bestilling':'På lager',message:soldout?'Dette smykke er desværre udsolgt.':made?'Dette smykke laves specielt til dig. Derfor kan leveringstiden være lidt længere.':''};
}
