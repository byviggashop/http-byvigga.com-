import {env} from 'cloudflare:workers';
import {adminAllowed,adminJson as json} from '../../../../lib/admin-service.mjs';
import {storeUpload} from '../../../../lib/image-storage.mjs';
export async function POST(request:Request){
 if(!adminAllowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Ingen adgang.'},403);
 if(!env.BUCKET)return json({error:'Billedlager er ikke klar.'},503);
 if(Number(request.headers.get('content-length'))>16000000)return json({error:'Upload er for stor.'},413);
 try{return json(await storeUpload(env.BUCKET,await request.formData()))}catch(e:any){return json({error:e.message||'Billedet kunne ikke uploades.'},400)}
}
