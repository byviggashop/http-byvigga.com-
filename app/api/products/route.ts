import {env} from 'cloudflare:workers';
import fallback from '../../../data/smykker.json';
import {getProducts} from '../../../lib/products.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await getProducts(env.DB,fallback),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Udvalget kunne ikke hentes.'},{status:503})}}
