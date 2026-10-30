import {adminAllowed,adminJson} from './admin-service.mjs';
import {storeUpload} from './image-storage.mjs';
export const MAX_UPLOAD_BYTES=32_000_000;
export async function handleImageUpload(request,env){
 if(!adminAllowed(request,env))return adminJson({error:'Dit login er udløbet, eller du mangler adgang. Genindlæs administrationen og log ind igen.'},403);
 if(request.headers.get('origin')!==new URL(request.url).origin)return adminJson({error:'Upload skal ske fra administrationen på dette website.'},403);
 if(!env.BUCKET)return adminJson({error:'Billedlageret er ikke klar. Prøv igen senere.'},503);
 if(Number(request.headers.get('content-length'))>MAX_UPLOAD_BYTES)return adminJson({error:'Upload er for stor. Vælg et foto under 20 MB.'},413);
 let tooLarge=false;
 try{
  if(!request.body)return adminJson({error:'Upload indeholder ikke et billede.'},400);
  const reader=request.body.getReader();let total=0;
  const boundedBody=new ReadableStream({async pull(controller){const {done,value}=await reader.read();if(done){controller.close();return;}total+=value.byteLength;if(total>MAX_UPLOAD_BYTES){tooLarge=true;await reader.cancel();controller.error(Error('Upload er for stor.'));return;}controller.enqueue(value)},cancel:()=>reader.cancel()});
  const form=await new Response(boundedBody,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();
  return adminJson(await storeUpload(env.BUCKET,form));
 }catch(error){return adminJson({error:tooLarge?'Upload er for stor. Vælg et foto under 20 MB.':error.message||'Billedet kunne ikke uploades. Prøv igen.'},tooLarge?413:error.name==='ImageStorageError'?503:400);}
}
