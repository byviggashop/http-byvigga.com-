import {env} from 'cloudflare:workers';
import {adminAllowed,adminJson} from '../../../../lib/admin-service.mjs';
import {readOverview} from '../../../../lib/shop-overview.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!adminAllowed(request,env))return adminJson({error:'Adgang kræver ejerlogin.'},403);
 const raw=new URL(request.url).searchParams.get('days')||'30';
 if(!['7','30','90'].includes(raw))return adminJson({error:'Vælg 7, 30 eller 90 dage.'},400);
 try{return adminJson(await readOverview(env.DB,Number(raw)))}catch{return adminJson({error:'Overblikket kunne ikke hentes. Prøv igen.'},503)}
}
