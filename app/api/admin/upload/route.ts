import {env} from 'cloudflare:workers';
import {adminAllowed,adminJson as json} from '../../../../lib/admin-service.mjs';
export async function POST(request:Request){
 if(!adminAllowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Ingen adgang.'},403);
 if(!env.BUCKET)return json({error:'Billedlager er ikke klar.'},503);
 if(Number(request.headers.get('content-length'))>6500000)return json({error:'Billedet må højst være 6 MB.'},413);
 try{const form=await request.formData(),file=form.get('image');if(!(file instanceof File)||file.size>6000000)return json({error:'Vælg et JPG-, PNG- eller WebP-billede under 6 MB.'},400);
 const bytes=new Uint8Array(await file.arrayBuffer());const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 const ext=jpg?'jpg':png?'png':webp?'webp':null;if(!ext)return json({error:'Billedformatet understøttes ikke.'},400);
 const key=crypto.randomUUID()+'.'+ext;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:jpg?'image/jpeg':'image/'+ext}});return json({image:'/api/product-image/'+key});
 }catch{return json({error:'Billedet kunne ikke uploades.'},400)}
}
