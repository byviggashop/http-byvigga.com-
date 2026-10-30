// Local-only integration fixture. Never forwards requests or writes to a live resource.
import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
import {handleImageUpload} from '../../lib/upload-endpoint.mjs';import {serveImage} from '../../lib/image-storage.mjs';import {validateProduct} from '../../lib/admin-service.mjs';
const owner='upload-test@example.invalid',objects=new Map(),bucket={async put(key,body,options){objects.set(key,{body,httpMetadata:options.httpMetadata,httpEtag:'"'+key+'"'})},async get(key){return objects.get(key)||null}};
let product={id:'bv-browser-upload-test',navn:'Uploadtest – kun lokalt',kategori:'Armbånd',pris:19,antal:1,billede:'assets/products/armbaand-01.jpg',billeder:['assets/products/armbaand-01.jpg'],beskrivelse:'Test produktets upload og Gem produkt. Ingen data forlader denne computer.',maal:'',aktiv:true,version:1};
export default defineConfig({plugins:[react(),{name:'isolated-upload-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 const url=new URL(req.url,'http://127.0.0.1:4191');if(!url.pathname.startsWith('/api/'))return next();
 const send=async(response)=>{res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))};
 try{if(req.method==='GET'&&url.pathname==='/api/admin')return send(Response.json({products:[product],orders:[],history:[]}));
 if(req.method==='GET'&&url.pathname==='/api/products')return send(Response.json([product]));
 if(req.method==='GET'&&url.pathname.startsWith('/api/product-image/'))return send(await serveImage(new Request(url),bucket,url.pathname.split('/').at(-1)));
 if(req.method==='POST'){
  const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>32_000_000)return send(Response.json({error:'Upload er for stor.'},{status:413}));parts.push(chunk)}
  const body=Buffer.concat(parts);
  if(url.pathname==='/api/admin/upload'){
   const headers=new Headers(req.headers);if(!String(req.headers.cookie).includes('uploadTestScenario=expired'))headers.set('oai-authenticated-user-email',owner);
   return send(await handleImageUpload(new Request(url,{method:'POST',headers,body}),{ADMIN_EMAIL:owner,BUCKET:bucket}));
  }
  if(url.pathname==='/api/admin'){const input=JSON.parse(body);if(input.action==='product'){const p=validateProduct(input.product);if(p.id!==product.id||p.version!==product.version)return send(Response.json({error:'Genindlæs produktet.'},{status:409}));product={...p,version:p.version+1};return send(Response.json({ok:true}));}}
 }
 return send(Response.json({error:'Kun upload- og produkttest understøttes.'},{status:404}));
 }catch(e){return send(Response.json({error:e.message},{status:400}));}
 });}}],server:{host:'127.0.0.1',port:4191,strictPort:true}});

