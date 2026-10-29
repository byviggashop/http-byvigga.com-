export const adminAllowed=(request,env)=>typeof env.ADMIN_EMAIL==='string'&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ADMIN_EMAIL.toLowerCase();
export const adminJson=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export function validateProduct(p){
 if(!p||typeof p.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(p.id))throw Error('Ugyldigt produkt-ID.');
 for(const [k,max]of [['navn',120],['beskrivelse',2000],['maal',500]])if(typeof p[k]!=='string'||p[k].length>max||(k==='navn'&&!p[k].trim()))throw Error('Kontrollér navn og beskrivelse.');
 if(!['Armbånd','Halskæder','Ringe','Øreringe'].includes(p.kategori)||!Number.isFinite(p.pris)||p.pris<0||p.pris>1000000||Math.abs(p.pris*100-Math.round(p.pris*100))>.00001)throw Error('Kontrollér kategori og pris.');
 if(p.antal!==null&&(!Number.isInteger(p.antal)||p.antal<0||p.antal>100000))throw Error('Antal skal være et helt tal eller tomt for bestillingsvarer.');
 const billeder=p.billeder===undefined?[p.billede]:p.billeder;
 if(!Array.isArray(billeder)||!billeder.length||billeder.length>8||new Set(billeder).size!==billeder.length)throw Error('Vælg mellem 1 og 8 forskellige billeder.');
 for(const image of billeder)if(typeof image!=='string'||!/^\/?(?:assets\/[A-Za-z0-9_./-]+|api\/product-image\/[a-f0-9-]+\.(?:jpg|png|webp))$/.test(image)||image.includes('..'))throw Error('Upload et gyldigt produktfoto eller vælg et eksisterende billede.');
 if(!Number.isInteger(p.version)||p.version<0)throw Error('Genindlæs produktet før du gemmer.');
 return {...p,billeder,billede:billeder[0]};
}
export function workflowUpdate(current,action,now){
 if(action==='payment_mail')return {...current,payment_mail_at:current.payment_mail_at||now};
 if(action==='paid'){if(!current.payment_mail_at)throw Error('Registrér først at betalingsmailen er sendt.');return {...current,paid_at:current.paid_at||now};}
 if(action==='fulfilled'){if(!current.paid_at)throw Error('Registrér først at betalingen er modtaget.');return {...current,fulfilled_at:current.fulfilled_at||now};}
 throw Error('Ukendt handling.');
}
