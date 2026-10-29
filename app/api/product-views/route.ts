import {env} from 'cloudflare:workers';
import fallback from '../../../data/smykker.json';
import {getProducts} from '../../../lib/products.mjs';
import {recordProductView} from '../../../lib/shop-overview.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return await recordProductView(request,env,await getProducts(env.DB,fallback))}catch{return Response.json({ok:false},{status:503,headers:{'Cache-Control':'no-store'}})}}
